# Infrastructure — Petryk's Foundations

This is the ground Petryk stands on. Terraform configurations that provision the AWS resources powering the entire system.

A self-improving system needs two things at the infrastructure level: a place to store structured knowledge, and a place to store raw artifacts. That's exactly what's here — a DynamoDB table for data and an S3 bucket for files. Serverless, scalable, pay-per-use. Petryk can grow without anyone having to worry about capacity.

## Resources

### DynamoDB — `coframe-data`
Petryk's memory. A schemaless, serverless table that stores every piece of data the system ingests. PAY_PER_REQUEST billing means it scales from zero to whatever, automatically. No provisioned throughput to manage. The only fixed attribute is `id` — everything else is freeform by design, because a self-improving system shouldn't be constrained by a rigid schema decided on day one.

### S3 — `coframe-uploads-050451400186`
Petryk's filing cabinet. Images, videos, audio, documents — any file uploaded through the frontend or API lands here. CORS-enabled for direct browser uploads via presigned URLs. Unlimited storage. Every file becomes a piece of data the system can eventually learn from.

## Deploying

```bash
terraform init
terraform apply
```

## What Comes Next

These are deliberately minimal foundations. As Petryk evolves — processing pipelines, embeddings, retrieval, feedback loops — the infra grows with him. But it starts here: a durable, schemaless data store and an object store with no upper limit. Everything else builds on top.
