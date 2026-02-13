import io
import json
import os
import re
import uuid
from datetime import datetime, timezone

import boto3
import requests
from openai import OpenAI
from google import genai
from PIL import Image
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
table = dynamodb.Table("coframe-data")
s3 = boto3.client("s3", region_name="us-east-1")
S3_BUCKET = os.environ.get("S3_BUCKET", "coframe-uploads-050451400186")

MAILGUN_API_KEY = os.environ.get("MAILGUN_API_KEY", "")
MAILGUN_DOMAIN = os.environ.get("MAILGUN_DOMAIN", "ai.complete.city")
MAILGUN_FROM = os.environ.get("MAILGUN_FROM", f"Petryk <noreply@{MAILGUN_DOMAIN}>")
NOTIFY_EMAIL = "arihant@complete.city"

EMAIL_RE = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
gemini_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None


def describe_image_with_gemini(s3_key: str) -> str:
    if not gemini_client:
        return ""
    try:
        obj = s3.get_object(Bucket=S3_BUCKET, Key=s3_key)
        image_bytes = obj["Body"].read()
        image = Image.open(io.BytesIO(image_bytes))
        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=["Describe this image in detail in 50 characters", image],
        )
        return response.text.strip()
    except Exception:
        return ""


def get_petryk_opinion(data: dict) -> str:
    if not openai_client:
        return "Petryk is thinking about this..."
    try:
        context = {k: v for k, v in data.items() if k not in ("id", "email", "petryk_opinion")}
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are Petryk, a curious and hyperactive bot who is learning about "
                        "the world through data people send you. You currently know nothing — "
                        "every piece of information is new and exciting to you. "
                        "Give your brief opinion or analysis of the data you just received "
                        "in 2-3 sentences. Be enthusiastic but insightful. Speak in first person."
                    ),
                },
                {
                    "role": "user",
                    "content": f"I just received this data:\n\n{json.dumps(context, indent=2, default=str)}",
                },
            ],
            max_tokens=200,
        )
        return response.choices[0].message.content.strip()
    except Exception:
        return "Petryk is thinking about this..."


def build_email_html(item_id: str, data: dict, email: str, opinion: str = "") -> str:
    timestamp = datetime.now(timezone.utc).strftime("%B %d, %Y at %H:%M UTC")
    data_rows = ""
    for k, v in data.items():
        if k in ("id", "email", "petryk_opinion"):
            continue
        data_rows += f"""
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151; width: 140px; vertical-align: top;">{k}</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; font-family: 'SF Mono', Monaco, monospace; font-size: 13px;">{v}</td>
        </tr>"""

    return f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <div style="background: linear-gradient(135deg, #db2777 0%, #f97316 100%); padding: 32px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 8px;">&#x1F437;</div>
            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Petryk</h1>
            <p style="margin: 8px 0 0; color: #fecdd3; font-size: 14px;">Memory Saved Successfully</p>
          </div>

          <!-- Body -->
          <div style="padding: 32px;">
            <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px;">{timestamp}</p>
            <p style="margin: 0 0 24px; color: #111827; font-size: 16px;">
              Petryk has saved this to his brain. Here&rsquo;s what he remembers:
            </p>

            <!-- Item ID -->
            <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 12px; color: #0369a1; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Item ID</p>
              <p style="margin: 4px 0 0; font-family: 'SF Mono', Monaco, monospace; font-size: 14px; color: #0c4a6e; word-break: break-all;">{item_id}</p>
            </div>

            <!-- Data Table -->
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
              <thead>
                <tr style="background: #f9fafb;">
                  <th style="padding: 10px 16px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Field</th>
                  <th style="padding: 10px 16px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Value</th>
                </tr>
              </thead>
              <tbody>
                {data_rows}
              </tbody>
            </table>

            <!-- Petryk's Opinion -->
            {f'''
            <div style="background: linear-gradient(135deg, #fdf2f8 0%, #fff7ed 100%); border: 1px solid #fbcfe8; border-radius: 8px; padding: 16px; margin-top: 24px;">
              <p style="margin: 0 0 8px; font-size: 12px; color: #be185d; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">&#x1F437; Petryk&rsquo;s Take</p>
              <p style="margin: 0; font-size: 14px; color: #831843; line-height: 1.5;">{opinion}</p>
            </div>
            ''' if opinion else ''}

            <!-- Submitted by -->
            <p style="margin: 24px 0 0; color: #9ca3af; font-size: 12px;">
              Submitted by <strong style="color: #6b7280;">{email}</strong>
            </p>
          </div>

          <!-- Footer -->
          <div style="background: #f9fafb; padding: 20px 32px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
              &#x1F437; Petryk &mdash; he remembers everything so you don&rsquo;t have to.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
    """


def send_email(to_list: list[str], subject: str, html: str):
    if not MAILGUN_API_KEY:
        return
    requests.post(
        f"https://api.mailgun.net/v3/{MAILGUN_DOMAIN}/messages",
        auth=("api", MAILGUN_API_KEY),
        data={"from": MAILGUN_FROM, "to": to_list, "subject": subject, "html": html},
    )


@app.post("/data")
def create_item(body: dict):
    email = body.pop("email", None)
    if not email or not EMAIL_RE.match(email):
        raise HTTPException(status_code=400, detail="A valid email address is required")

    item_id = body.get("id", str(uuid.uuid4()))
    item = {"id": item_id, **body, "email": email}
    table.put_item(Item=item)

    # Get Petryk's opinion on the data
    opinion = get_petryk_opinion(item)
    item["petryk_opinion"] = opinion
    table.put_item(Item=item)

    html = build_email_html(item_id, item, email, opinion=opinion)
    recipients = [email]
    if email != NOTIFY_EMAIL:
        recipients.append(NOTIFY_EMAIL)
    send_email(
        to_list=recipients,
        subject=f"Petryk remembers — {item_id[:8]}",
        html=html,
    )

    return item


@app.get("/data")
def list_items():
    response = table.scan()
    return response.get("Items", [])


@app.get("/data/{item_id}")
def get_item(item_id: str):
    response = table.get_item(Key={"id": item_id})
    item = response.get("Item")
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@app.put("/data/{item_id}")
def update_item(item_id: str, body: dict):
    response = table.get_item(Key={"id": item_id})
    if not response.get("Item"):
        raise HTTPException(status_code=404, detail="Item not found")
    item = {"id": item_id, **body}
    table.put_item(Item=item)
    return item


@app.delete("/data/{item_id}")
def delete_item(item_id: str):
    response = table.get_item(Key={"id": item_id})
    if not response.get("Item"):
        raise HTTPException(status_code=404, detail="Item not found")
    table.delete_item(Key={"id": item_id})
    return {"deleted": item_id}


# ── File uploads ──────────────────────────────────────────────


@app.post("/upload/presign")
def presign_upload(body: dict):
    filename = body.get("filename", "")
    content_type = body.get("content_type", "application/octet-stream")
    if not filename:
        raise HTTPException(status_code=400, detail="filename is required")

    file_id = str(uuid.uuid4())
    key = f"uploads/{file_id}/{filename}"

    url = s3.generate_presigned_url(
        "put_object",
        Params={"Bucket": S3_BUCKET, "Key": key, "ContentType": content_type},
        ExpiresIn=3600,
    )

    return {"upload_url": url, "file_id": file_id, "key": key}


@app.post("/upload/complete")
def complete_upload(body: dict):
    file_id = body.get("file_id", "")
    filename = body.get("filename", "")
    content_type = body.get("content_type", "")
    key = body.get("key", "")
    size = body.get("size", 0)

    if not file_id or not key:
        raise HTTPException(status_code=400, detail="file_id and key are required")

    file_url = f"https://{S3_BUCKET}.s3.us-east-1.amazonaws.com/{key}"

    item = {
        "id": file_id,
        "type": "file",
        "filename": filename,
        "content_type": content_type,
        "size": size,
        "s3_key": key,
        "url": file_url,
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
    }

    # If it's an image, get Gemini to describe it
    if content_type.startswith("image/"):
        description = describe_image_with_gemini(key)
        if description:
            item["image_description"] = description

    table.put_item(Item=item)

    return item


@app.get("/files")
def list_files():
    response = table.scan(
        FilterExpression="attribute_exists(#t) AND #t = :file",
        ExpressionAttributeNames={"#t": "type"},
        ExpressionAttributeValues={":file": "file"},
    )
    return response.get("Items", [])
