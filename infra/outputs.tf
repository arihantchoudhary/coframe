output "table_name" {
  value = aws_dynamodb_table.coframe_data.name
}

output "table_arn" {
  value = aws_dynamodb_table.coframe_data.arn
}
