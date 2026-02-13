# Same Data Writer

Full-stack data platform with a FastAPI backend, DynamoDB storage, Mailgun email integration, and multi-client frontends.

## Architecture

| Layer | Tech | Location |
|-------|------|----------|
| Database | AWS DynamoDB (`coframe-data`) | us-east-1 |
| Backend API | FastAPI on AWS App Runner | `backend/` |
| Web App | Next.js + shadcn/ui | `web/` |
| Mobile App | React Native (Expo) | `mobile/` |
| CI/CD | GitHub Actions → ECR → App Runner | `.github/workflows/` |
| Infra | Terraform | `infra/` |

## Public API

**Base URL:** `https://yh9fp9463n.us-east-1.awsapprunner.com`

### `POST /data`

Create a new item. Optionally include an `email` field to receive a confirmation email.

```bash
curl -X POST https://yh9fp9463n.us-east-1.awsapprunner.com/data \
  -H "Content-Type: application/json" \
  -d '{"name": "example", "value": 42, "email": "you@example.com"}'
```

**Response:**
```json
{
  "id": "generated-uuid",
  "name": "example",
  "value": 42,
  "email": "you@example.com"
}
```

### `GET /data/{id}`

Retrieve an item by ID.

```bash
curl https://yh9fp9463n.us-east-1.awsapprunner.com/data/some-uuid
```

**Response:**
```json
{
  "id": "some-uuid",
  "name": "example",
  "value": 42
}
```

### `PUT /data/{id}`

Update an existing item by ID.

```bash
curl -X PUT https://yh9fp9463n.us-east-1.awsapprunner.com/data/some-uuid \
  -H "Content-Type: application/json" \
  -d '{"name": "updated", "value": 99}'
```

**Response:**
```json
{
  "id": "some-uuid",
  "name": "updated",
  "value": 99
}
```

### `DELETE /data/{id}`

Delete an item by ID.

```bash
curl -X DELETE https://yh9fp9463n.us-east-1.awsapprunner.com/data/some-uuid
```

**Response:**
```json
{
  "deleted": "some-uuid"
}
```

## Running Locally

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Web App

```bash
cd web
npm install
npm run dev
```

### Mobile App

```bash
cd mobile
npm install
npx expo start
```

## Deployment

- **Backend:** Pushes to `backend/` on `main` trigger GitHub Actions to build and push to ECR. App Runner auto-deploys.
- **Web:** Connect `web/` to Vercel. Set `NEXT_PUBLIC_API_URL` env var.
- **Infra:** `cd infra && terraform init && terraform apply`
