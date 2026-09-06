# HW15 — The Cloud Bridge

## Architecture

Pixel Siege runs as three independent containers:

```
Browser
   |
   v
frontend  Nginx :80        (static game + proxies /api/* to backend)
   |
   v
backend   Node/Express :3000 (REST API only, no static files)
   |
   v
db        PostgreSQL :5432
```

The backend never hardcodes a DB address: it reads `DATABASE_URL`, or
`DB_HOST`/`DB_PORT`/`POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_DB` from the
environment. Locally `DB_HOST=db` (the Compose service name); for the AWS
HW17 split-host layout, set `DB_HOST` to the DB EC2's private IP.

## Local Development (Docker Compose)

```bash
cp .env.example .env   # then edit POSTGRES_PASSWORD, etc.
docker compose up -d --build
docker compose ps
curl http://localhost/
curl http://localhost/api/health
```

## AWS Setup

- **S3 bucket:** `gdav170-hw15-2508` (us-east-1)
- **EC2 region:** eu-north-1 (Stockholm)
- **Instance type:** t3.micro (Free tier eligible)
- **AMI:** Ubuntu 24.04 LTS
- **Public IP:** 13.48.43.95

## Ansible Execution

Inventory (`ansible/inventory.ini`):

```ini
[app]
ec2-server ansible_host=13.48.43.95 ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/newkey.pem
```

Command used to run the playbook against EC2:

```bash
ansible-playbook -i ansible/inventory.ini ansible/playbook.yml
```

The playbook installs Docker Engine + Compose plugin, starts/enables the Docker
service, creates the application directory on the EC2 host, copies
`docker-compose.yml`, `backend/`, `db/`, and `.env` to the host, and runs
`docker compose up` (with `build: always`) to build and start the stack.

## Proof

### Health check

```bash
$ curl http://13.48.43.95:3000/api/health
{"status":"ok"}
```

### Idempotency (second run)

Running the playbook a second time against the same host to confirm no
unnecessary changes are made:

```
PLAY RECAP *****************************************************************************************************
ec2-server                 : ok=15   changed=0    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
```

All 15 tasks reported `ok` with `changed=0`, confirming the playbook is fully idempotent.

## Teardown Confirmation

- [x] EC2 instance (`i-07438a894561e1fe2`) terminated — confirmed via AWS Console, instance state: **Terminated**.
- [x] S3 bucket (`gdav170-hw15-2508`) emptied and deleted — confirmed via AWS Console: "Successfully deleted bucket".

All AWS resources for this assignment have been torn down; no ongoing costs are being incurred.

