#!/bin/bash
set -Eeuo pipefail

STEP="Preparation"
trap 'printf "\nFAIL: %s (line %s)\n" "$STEP" "$LINENO" >&2' ERR

# Work from the Terraform directory regardless of the launch directory.
cd "$(dirname "$0")/.."

export AWS_PAGER=""
export AWS_CLI_AUTO_PROMPT=off
REGION="eu-west-1"

check_equal() {
  if [[ "$1" != "$2" ]]; then
    printf 'Expected: %s\nReceived: %s\n' "$2" "$1" >&2
    return 1
  fi
  printf 'PASS: %s\n' "$STEP"
}

STEP="Read bucket name from Terraform"
BUCKET=$(terraform output -raw hw19_bucket_name)
[[ -n "$BUCKET" ]]
printf 'Bucket: %s\n' "$BUCKET"

STEP="Authenticated file read"
CONTENT=$(aws s3 cp "s3://$BUCKET/storage-check.txt" - \
  --region "$REGION")
check_equal "$CONTENT" \
  "Pixel Siege release artifact storage check. No sensitive data."

STEP="All four public access blocks enabled"
BLOCKED=$(aws s3api get-public-access-block \
  --bucket "$BUCKET" --region "$REGION" \
  --query 'PublicAccessBlockConfiguration.[BlockPublicAcls,IgnorePublicAcls,BlockPublicPolicy,RestrictPublicBuckets]' \
  --output text)
check_equal "$BLOCKED" $'True\tTrue\tTrue\tTrue'

STEP="Versioning enabled"
VERSIONING=$(aws s3api get-bucket-versioning \
  --bucket "$BUCKET" --region "$REGION" \
  --query Status --output text)
check_equal "$VERSIONING" "Enabled"

STEP="AES256 default encryption"
ENCRYPTION=$(aws s3api get-bucket-encryption \
  --bucket "$BUCKET" --region "$REGION" \
  --query 'ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm' \
  --output text)
check_equal "$ENCRYPTION" "AES256"

STEP="Enabled lifecycle rule expires old versions after 7 days"
DAYS=$(aws s3api get-bucket-lifecycle-configuration \
  --bucket "$BUCKET" --region "$REGION" \
  --query "Rules[?ID=='expire-old-versions' && Status=='Enabled'].NoncurrentVersionExpiration.NoncurrentDays" \
  --output text)
check_equal "$DAYS" "7"

STEP="Anonymous file access denied"
ERROR_FILE=$(mktemp)
trap 'rm -f "$ERROR_FILE"' EXIT

if aws s3 cp "s3://$BUCKET/storage-check.txt" - \
  --region "$REGION" --no-sign-request \
  >/dev/null 2>"$ERROR_FILE"; then
  printf 'FAIL: The file is publicly readable!\n' >&2
  exit 1
elif grep -Eq '\(403\)|AccessDenied' "$ERROR_FILE"; then
  printf 'PASS: Anonymous access denied\n'
else
  printf 'FAIL: Unexpected error; access denial not verified\n' >&2
  cat "$ERROR_FILE" >&2
  exit 1
fi

printf '\nAll 6 storage checks passed at %s\n' "$(date -u +%FT%TZ)"
