resource "aws_s3_bucket" "project_artifacts" {
  bucket_prefix = "pixel-siege-hw19-"
  force_destroy = false

  tags = {
    Project    = "PixelSiege"
    Assignment = "HW19"
    Purpose    = "Sanitized release artifacts"
  }
}

resource "aws_s3_bucket_public_access_block" "project_artifacts" {
  bucket = aws_s3_bucket.project_artifacts.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "project_artifacts" {
  bucket = aws_s3_bucket.project_artifacts.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "project_artifacts" {
  bucket = aws_s3_bucket.project_artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "project_artifacts" {
  bucket = aws_s3_bucket.project_artifacts.id

  depends_on = [aws_s3_bucket_versioning.project_artifacts]

  rule {
    id     = "expire-old-versions"
    status = "Enabled"

    filter {
      prefix = ""
    }

    noncurrent_version_expiration {
      noncurrent_days = 7
    }
  }
}

resource "aws_s3_object" "storage_check" {
  bucket                 = aws_s3_bucket.project_artifacts.id
  key                    = "storage-check.txt"
  content                = "Pixel Siege release artifact storage check. No sensitive data.\n"
  content_type           = "text/plain"
  server_side_encryption = "AES256"

  depends_on = [
    aws_s3_bucket_public_access_block.project_artifacts,
    aws_s3_bucket_versioning.project_artifacts,
    aws_s3_bucket_server_side_encryption_configuration.project_artifacts
  ]
}

output "hw19_bucket_name" {
  description = "Private Pixel Siege artifact bucket"
  value       = aws_s3_bucket.project_artifacts.id
}
