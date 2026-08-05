# ClientFlow Backend Production Runbook

This backend is intended to run as a Dockerized API on EC2, behind host-level Nginx + HTTPS, with PostgreSQL hosted on RDS.

## 1. RDS

- Create a PostgreSQL database for ClientFlow.
- Allow inbound PostgreSQL traffic only from the EC2 security group.
- Use an RDS connection string like:

```bash
postgresql://USER:PASSWORD@RDS_ENDPOINT:5432/clientflow_crm?schema=public&sslmode=require
```

## 2. EC2 Environment

Create `back-end/.env.production` on the EC2 host from `.env.production.example`.

Required values:

```bash
NODE_ENV=production
PORT=4000
CORS_ORIGINS=https://clientflow.example.com
DATABASE_URL=postgresql://USER:PASSWORD@RDS_ENDPOINT:5432/clientflow_crm?schema=public&sslmode=require
JWT_SECRET=<random 32+ character secret>
TRUST_PROXY=1
LOG_LEVEL=info
```

Do not commit `.env.production`.

## 3. Build And Deploy

From `back-end/` on EC2:

```bash
docker compose -f compose.prod.yml build
docker compose -f compose.prod.yml run --rm api npm run db:deploy
docker compose -f compose.prod.yml up -d api
```

`db:deploy` runs Prisma migrations and seeds the default sales pipeline.

## 4. Create The First User

Run this once after migrations:

```bash
docker compose -f compose.prod.yml run --rm \
  -e ADMIN_NAME="Admin" \
  -e ADMIN_EMAIL="admin@example.com" \
  -e ADMIN_PASSWORD="<strong password>" \
  api npm run admin:create
```

If you want the command to be idempotent when the user already exists:

```bash
docker compose -f compose.prod.yml run --rm \
  -e ADMIN_CREATE_IF_MISSING=true \
  -e ADMIN_NAME="Admin" \
  -e ADMIN_EMAIL="admin@example.com" \
  -e ADMIN_PASSWORD="<strong password>" \
  api npm run admin:create
```

The command never prints the password or password hash.

## 5. Nginx

Copy `deploy/nginx/clientflow-api.conf` to Nginx sites, replace `api.example.com`, and issue certificates with Certbot or your certificate manager.

The API container only publishes to `127.0.0.1:4000`; Nginx should be the public entry point.

## 6. Health Checks

Local EC2 checks:

```bash
curl http://127.0.0.1:4000/api/health
curl http://127.0.0.1:4000/api/ready
```

Public check after Nginx:

```bash
curl https://api.example.com/api/health
```

## 7. Rollback

Application rollback:

```bash
git checkout <previous-release>
docker compose -f compose.prod.yml build
docker compose -f compose.prod.yml up -d api
```

Database migrations should be treated as forward-only. For destructive database rollback, restore an RDS snapshot.
