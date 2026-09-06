output "app_public_ip" {
  description = "Public IPv4 address of the App Host"
  value       = aws_instance.app.public_ip
}

output "rds_endpoint" {
  description = "Private endpoint of the managed RDS instance"
  value       = aws_db_instance.postgres.endpoint
}

output "rds_address" {
  description = "Private hostname of the managed RDS instance"
  value       = aws_db_instance.postgres.address
}
