import json
import os
import re
import uuid
from datetime import datetime, timezone

import boto3
import requests
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

MAILGUN_API_KEY = os.environ.get("MAILGUN_API_KEY", "")
MAILGUN_DOMAIN = os.environ.get("MAILGUN_DOMAIN", "ai.complete.city")
MAILGUN_FROM = os.environ.get("MAILGUN_FROM", f"Same Data Writer <noreply@{MAILGUN_DOMAIN}>")
NOTIFY_EMAIL = "arihant@complete.city"

EMAIL_RE = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")


def build_email_html(item_id: str, data: dict, email: str) -> str:
    timestamp = datetime.now(timezone.utc).strftime("%B %d, %Y at %H:%M UTC")
    data_rows = ""
    for k, v in data.items():
        if k in ("id", "email"):
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
          <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 32px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Same Data Writer</h1>
            <p style="margin: 8px 0 0; color: #bfdbfe; font-size: 14px;">Data Successfully Saved</p>
          </div>

          <!-- Body -->
          <div style="padding: 32px;">
            <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px;">{timestamp}</p>
            <p style="margin: 0 0 24px; color: #111827; font-size: 16px;">
              Your data has been written to the database.
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

            <!-- Submitted by -->
            <p style="margin: 24px 0 0; color: #9ca3af; font-size: 12px;">
              Submitted by <strong style="color: #6b7280;">{email}</strong>
            </p>
          </div>

          <!-- Footer -->
          <div style="background: #f9fafb; padding: 20px 32px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
              Same Data Writer &mdash; Powered by DynamoDB + FastAPI
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

    html = build_email_html(item_id, item, email)
    recipients = [email]
    if email != NOTIFY_EMAIL:
        recipients.append(NOTIFY_EMAIL)
    send_email(
        to_list=recipients,
        subject=f"Data Saved — {item_id[:8]}",
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
