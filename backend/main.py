import os
import re
import uuid

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
MAILGUN_FROM = os.environ.get("MAILGUN_FROM", f"Coframe <noreply@{MAILGUN_DOMAIN}>")

EMAIL_RE = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")


def send_email(to: str, subject: str, body: str):
    if not MAILGUN_API_KEY:
        return
    requests.post(
        f"https://api.mailgun.net/v3/{MAILGUN_DOMAIN}/messages",
        auth=("api", MAILGUN_API_KEY),
        data={"from": MAILGUN_FROM, "to": [to], "subject": subject, "html": body},
    )


@app.post("/data")
def create_item(body: dict):
    email = body.pop("email", None)
    if email and not EMAIL_RE.match(email):
        raise HTTPException(status_code=400, detail="Invalid email address")

    item_id = body.get("id", str(uuid.uuid4()))
    item = {"id": item_id, **body}
    if email:
        item["email"] = email
    table.put_item(Item=item)

    if email:
        send_email(
            to=email,
            subject="Your data has been saved - Coframe",
            body=f"""
            <h2>Your data has been saved!</h2>
            <p>Your item ID is: <strong>{item_id}</strong></p>
            <p>You can use this ID to look up your data anytime.</p>
            <pre>{__import__('json').dumps({k: v for k, v in item.items() if k != 'email'}, indent=2)}</pre>
            <p>— Coframe</p>
            """,
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
