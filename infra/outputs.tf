output "table_name" {
  value = aws_dynamodb_table.coframe_data.name
}

output "table_arn" {
  value = aws_dynamodb_table.coframe_data.arn
}

output "s3_bucket_name" {
  value = aws_s3_bucket.coframe_uploads.bucket
}

output "s3_bucket_arn" {
  value = aws_s3_bucket.coframe_uploads.arn
}
