# Petryk

A hyperactive kid who never stops listening, never forgets, and always writes back.

Petryk is the foundation of a self-improving system. Right now, he's a universal data intake — send him anything (text, files, images, video, documents) and he'll remember it. No fixed schema, no restrictions on what you can feed him. He stores everything, confirms receipt, and keeps it all accessible. Today he remembers. Tomorrow he learns.

## Write to Petryk's Brain

**API URL:** `https://yh9fp9463n.us-east-1.awsapprunner.com`

Send anything:

```bash
curl -X POST https://yh9fp9463n.us-east-1.awsapprunner.com/data \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "name": "example", "value": 42, "anything": "you want"}'
```

Petryk accepts any JSON fields. The only requirement is `email` so he can confirm he got it. He'll store everything and send you a confirmation.

## The System

| Layer | What It Is | Location |
|-------|-----------|----------|
| **Brain** | FastAPI on AWS App Runner — ingests data, stores it, sends confirmations | [`backend/`](backend/) |
| **Face** | Next.js + shadcn/ui — write data, browse memories, upload files | [`web/`](web/) |
| **Pocket** | React Native (Expo) — quick data pushes from your phone | [`mobile/`](mobile/) |
| **Foundations** | Terraform — DynamoDB for data, S3 for files, all serverless | [`infra/`](infra/) |
| **Reflexes** | GitHub Actions — auto-deploy on push to main | [`.github/workflows/`](.github/workflows/) |

## API

| Method | Endpoint | What It Does |
|--------|----------|--------------|
| `POST` | `/data` | Send Petryk new data |
| `GET` | `/data` | See everything he knows |
| `GET` | `/data/{id}` | Look up a specific memory |
| `PUT` | `/data/{id}` | Correct something |
| `DELETE` | `/data/{id}` | Tell him to forget |
| `POST` | `/upload/presign` | Get a signed URL to upload a file |
| `POST` | `/upload/complete` | Confirm a file upload finished |
| `GET` | `/files` | See all files he's holding |

## Running Locally

```bash
# Backend
cd backend && pip install -r requirements.txt && uvicorn main:app --reload

# Web
cd web && npm install && npm run dev

# Mobile
cd mobile && npm install && npx expo start
```

## Deployment

- **Backend:** Push to `backend/` on `main` triggers GitHub Actions → Docker → ECR → App Runner auto-deploys.
- **Web:** Connect `web/` to Vercel. Set `NEXT_PUBLIC_API_URL` env var.
- **Infra:** `cd infra && terraform init && terraform apply`
