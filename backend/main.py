import uuid

import boto3
from fastapi import FastAPI, HTTPException

app = FastAPI()

dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
table = dynamodb.Table("coframe-data")


@app.post("/data")
def create_item(body: dict):
    item_id = str(uuid.uuid4())
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
