HW19 — Compute and Storage Decision

Project and HW18 baseline

Project: The Last Knight

Provider: AWS

Region: eu-west-1

Terraform AWS provider: 5.100.0

This change extends the project's HW18 Terraform configuration.
HW18 infrastructure had been destroyed before HW19 began.
Its configuration was retained; its infrastructure was not recreated.

Retained HW18 resource definitions:

Resource

Terraform address

Configuration

VPC

aws_vpc.main

10.18.0.0/16

Public subnet

aws_subnet.public_app

10.18.1.0/24, eu-west-1a

Private subnet A

aws_subnet.private_db_a

10.18.2.0/24, eu-west-1a

Private subnet B

aws_subnet.private_db_b

10.18.3.0/24, eu-west-1b

Application host

aws_instance.app

t3.micro

Managed database

aws_db_instance.postgres

PostgreSQL 16, db.t4g.micro

The database configuration sets publicly_accessible=false and allows
port 5432 from the application security group.

These are configuration facts, not proof of running HW18 resources.
Application connectivity and continued database privacy could not be
tested because the HW18 environment was absent.

Storage decision

Purpose: private storage for sanitized The Last Knight release artifacts.
The only uploaded object is storage-check.txt, containing no sensitive data.

Bucket: pixel-siege-hw19-20260906204812819100000001

All four S3 Block Public Access settings are enabled.

Access requires an authenticated identity with appropriate IAM permissions.

No public bucket policy or public ACL was added.

Versioning is enabled.

Default encryption is S3-managed AES256 (SSE-S3).

Noncurrent versions expire after 7 days.

The lifecycle rule does not expire the current object version.

No storage-class transition is configured.

force_destroy=false prevents Terraform from automatically emptying
the bucket during deletion.

Six Terraform resources manage this single bucket and its test object:

aws_s3_bucket.project_artifacts

aws_s3_bucket_public_access_block.project_artifacts

aws_s3_bucket_versioning.project_artifacts

aws_s3_bucket_server_side_encryption_configuration.project_artifacts

aws_s3_bucket_lifecycle_configuration.project_artifacts

aws_s3_object.storage_check

Compute/bootstrap decision

terraform/scripts/init.sh is a bootstrap candidate that records a UTC
timestamp and checks whether Docker and psql are installed.

It contains no credentials and performs no package installation.
The existing compute.tf bootstrap installs Docker and PostgreSQL clients;
it was not replaced.

The candidate was not attached or applied. No existing EC2 host was
available for an in-place versus replacement plan comparison.
No claim is made that a replacement was observed.

The bootstrap candidate and storage verification script have separate roles:

init.sh: harmless checks intended for the application host.

verify-storage.sh: storage checks run locally with Terraform and AWS CLI.

PostgreSQL VM versus RDS

Area

Self-managed PostgreSQL VM

RDS

Patching

We maintain the OS and database

AWS manages infrastructure and provides database maintenance; we manage upgrade choices

Backups

We schedule, retain and test backups

Managed backups are available, but this HW18 configuration disables them with retention=0

Scaling

We manage VM resizing and database changes

Managed instance/storage changes are available; downtime and cost still need review

Private networking

We configure routing, firewall and PostgreSQL access

Private subnets and security groups are configured; public access is disabled

Operations

We handle OS failures, database service and recovery

AWS handles more infrastructure operations; we retain application, access and query responsibilities

Cost

VM, disk, backups and engineering time

Database instance, storage, optional features and usage; less infrastructure administration

RDS is preferable for this project because it reduces routine database
infrastructure administration. It does not remove responsibility for
backup configuration, restore testing, access control or application
compatibility.

Verification results

Check

Observed result

terraform validate

Successful

Baseline HW18 plan

13 additions

Full HW19 plan

19 additions, 0 changes, 0 deletions

S3-only targeted plan

6 additions, 0 changes, 0 deletions

Applied saved plan

6 added, 0 changed, 0 destroyed

Authenticated object read

Successful; expected text returned

Public access block

All four values true

Versioning

Enabled

Default encryption

AES256

Lifecycle

Enabled; NoncurrentDays=7

Anonymous object access

HTTP 403 Forbidden

The applied plan contained only S3 resources, with no VM, database,
NAT service, load balancer or reserved IP.

Targeting was used exceptionally to verify storage without recreating
the previously destroyed HW18 environment. A normal full apply would
also propose recreating the missing HW18 resources.

Commands executed from terraform/:

terraform validate
terraform plan

terraform plan \
  -target=aws_s3_bucket.project_artifacts \
  -target=aws_s3_bucket_public_access_block.project_artifacts \
  -target=aws_s3_bucket_versioning.project_artifacts \
  -target=aws_s3_bucket_server_side_encryption_configuration.project_artifacts \
  -target=aws_s3_bucket_lifecycle_configuration.project_artifacts \
  -target=aws_s3_object.storage_check \
  -out=hw19-storage.tfplan

terraform apply "hw19-storage.tfplan"

HW19_BUCKET=$(terraform output -raw hw19_bucket_name)

aws s3 cp "s3://$HW19_BUCKET/storage-check.txt" - \
  --region eu-west-1

aws s3api get-public-access-block \
  --bucket "$HW19_BUCKET" --region eu-west-1 --no-cli-pager

aws s3api get-bucket-versioning \
  --bucket "$HW19_BUCKET" --region eu-west-1 --no-cli-pager

aws s3api get-bucket-encryption \
  --bucket "$HW19_BUCKET" --region eu-west-1 --no-cli-pager

aws s3api get-bucket-lifecycle-configuration \
  --bucket "$HW19_BUCKET" --region eu-west-1 --no-cli-pager

aws s3 cp "s3://$HW19_BUCKET/storage-check.txt" - \
  --region eu-west-1 --no-sign-request

Expected authenticated content:

Pixel Siege release artifact storage check. No sensitive data.

Observed anonymous result:

An error occurred (403) when calling the HeadObject operation: Forbidden

Automated storage verification

The repeatable verification script is located at:

terraform/scripts/verify-storage.sh

Run it from the terraform directory:

bash -n scripts/verify-storage.sh &&
bash scripts/verify-storage.sh

The script reads the bucket name from Terraform outputs and checks:

Authenticated access returns the expected storage-check.txt content.

All four S3 Block Public Access settings are enabled.

Versioning is Enabled.

Default encryption is AES256.

The enabled expire-old-versions rule specifies 7 noncurrent days.

Anonymous object access returns HTTP 403 or AccessDenied.

Each successful check prints PASS before proceeding to the next check.
An unexpected command failure or incorrect value stops the script with
a nonzero exit code.

Anonymous access denial is an expected success. Network errors or other
unexpected failures are not accepted as proof that public access is blocked.

The script performs read-only AWS operations. It does not create,
modify or delete cloud resources and contains no credentials.
It uses the locally configured AWS identity.

The individual manual checks passed. Execution of the automated script
has not yet been recorded.

Cost and cleanup status

Only one small text object was uploaded. Storage, retained versions and
requests may incur charges. Small usage does not guarantee zero cost.

Billing alert and current free-tier/credit eligibility verification
remain to be recorded.

Cleanup is pending instructor review. The planned sequence is:

Remove the test object.

Remove any remaining object versions and delete markers.

Review a destroy plan targeting only the HW19 S3 resources.

Apply that reviewed cleanup plan.

Confirm in AWS that the bucket is gone.

Run terraform state list and terraform plan to record the final state.

Do not run whole-stack terraform destroy.

Exact cleanup commands and observed results will be added after cleanup.
Retained resource definitions may appear as proposed additions in later
plans after their resources have been deleted; this is not proof that
cleanup failed.

Submission status and limitations

Storage creation and manual access checks: completed.

Automated verification execution: not yet recorded.

Bootstrap candidate: intentionally unapplied; no live-host comparison.

Billing/free-tier verification: not yet recorded.

Instructor review and storage cleanup: pending.

HW19 PR merge and Google Sheet submission: pending.

The former HW18 environment was absent during this exercise.
Preservation of live HW18 resources and unchanged application/database
connectivity have therefore not been verified.
