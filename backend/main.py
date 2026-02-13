import uuid

import boto3
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


@app.post("/data")
def create_item(body: dict):
    item_id = body.get("id", str(uuid.uuid4()))
    item = {"id": item_id, **body}
    table.put_item(Item=item)
    return item


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
