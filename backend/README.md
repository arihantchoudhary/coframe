# Backend — Petryk's Brain

This is the nervous system of Petryk — a hyperactive kid who never stops listening, never forgets, and always writes back.

The backend is a FastAPI service that receives anything you throw at it: structured data, files, images, video, audio, documents. It stores everything in DynamoDB, uploads files to S3, and fires off email confirmations so you know Petryk got it. Think of it as the first layer of a self-improving system — a universal intake that accepts any shape of data and holds onto it, ready for whatever comes next.

Right now, Petryk remembers. Soon, he'll learn.

## What It Does

- **Ingests anything** — JSON with arbitrary fields, no fixed schema. Send whatever matters.
- **Handles file uploads** — Presigned S3 URLs for direct client uploads (images, video, audio, PDFs, presentations, spreadsheets, anything).
- **Confirms receipt** — HTML email notifications on every write so you know Petryk caught it.
- **Full CRUD** — Create, read, update, delete. Everything Petryk knows is accessible and editable.

## Endpoints

| Method | Path | What It Does |
|--------|------|--------------|
| `POST` | `/data` | Send Petryk new data (requires email) |
| `GET` | `/data` | See everything Petryk knows |
| `GET` | `/data/{id}` | Look up a specific memory |
| `PUT` | `/data/{id}` | Correct something Petryk got wrong |
| `DELETE` | `/data/{id}` | Tell Petryk to forget |
| `POST` | `/upload/presign` | Get a signed URL to upload a file |
| `POST` | `/upload/complete` | Tell Petryk the upload finished |
| `GET` | `/files` | See all files Petryk is holding onto |

## Stack

- **FastAPI** + Uvicorn
- **AWS DynamoDB** for data (schemaless, pay-per-request)
- **AWS S3** for file storage
- **Mailgun** for email confirmations
- **Docker** → ECR → App Runner for deployment

## Running Locally

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

## Why This Matters

Every self-improving system starts with the ability to take in information from the outside world. This backend is that open door — accept any data, from any source, in any format, and store it durably. The schema is flexible on purpose. Petryk doesn't judge what you send him. He just remembers it, files it away, and waits for the day he gets smart enough to do something with it.
