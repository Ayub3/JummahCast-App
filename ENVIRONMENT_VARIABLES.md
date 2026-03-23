# Environment Variables Guide for Deployment

## 📋 Complete Environment Variables List

### Core Application Settings

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Environment mode: `development` or `production` |
| `PORT` | No | `4000` | Port the server listens on |

### 🔐 Authentication Driver

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AUTH_MODE` | No | `local` | Authentication mode: `local` or `cognito` |
| `JWT_SECRET` | Yes (if `AUTH_MODE=local`) | - | Secret key for JWT signing (min 32 chars) |
| `COGNITO_USER_POOL_ID` | Yes (if `AUTH_MODE=cognito`) | - | AWS Cognito User Pool ID |
| `COGNITO_CLIENT_ID` | Yes (if `AUTH_MODE=cognito`) | - | AWS Cognito App Client ID |

### 💾 Database Driver

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_DRIVER` | No | `sqlite` | Database driver: `sqlite` or `postgres` |
| `DB_HOST` | Yes (if `DB_DRIVER=postgres`) | - | PostgreSQL host (RDS endpoint) |
| `DB_PORT` | No | `5432` | PostgreSQL port |
| `DB_NAME` | Yes (if `DB_DRIVER=postgres`) | - | Database name |
| `DB_USER` | Yes (if `DB_DRIVER=postgres`) | - | Database username |
| `DB_PASSWORD` | Yes (if `DB_DRIVER=postgres`) | - | Database password (use Secrets Manager!) |
| `DB_SSL` | No | `false` | Enable SSL for database connection |
| `DB_POOL_MAX` | No | `10` | Maximum database connection pool size |

### 📦 Storage Driver

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BLOB_DRIVER` | No | `local` | Storage driver: `local` or `s3` |
| `AWS_REGION` | Yes (if `BLOB_DRIVER=s3`) | - | AWS region for S3 |
| `S3_BUCKET` | Yes (if `BLOB_DRIVER=s3`) | - | S3 bucket name for sermon audio |
| `SIGNED_URL_TTL_SECONDS` | No | `300` | Presigned URL expiry (seconds) |

### 🌐 CORS Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CORS_ALLOWED_ORIGINS` | No | `http://localhost:5173,http://localhost:4173` | Comma-separated list of allowed origins |

---

## 🚀 Deployment Configurations

### 1. Local Development (Default)

```bash
# .env
NODE_ENV=development
AUTH_MODE=local
DB_DRIVER=sqlite
BLOB_DRIVER=local
JWT_SECRET=local-dev-secret-change-in-production
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173
```

**What runs:**
- ✅ JWT authentication (in-memory users)
- ✅ SQLite database (./data/app.db)
- ✅ Local file storage (./uploads/)
- ✅ No AWS required

### 2. Docker Compose (Local)

```yaml
# docker-compose.yml
environment:
  NODE_ENV: development
  AUTH_MODE: local
  DB_DRIVER: sqlite
  BLOB_DRIVER: local
  JWT_SECRET: local-dev-secret
  CORS_ALLOWED_ORIGINS: "http://localhost:5173,http://localhost:4173"
```

**To test with Postgres:**
```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: jummahcast
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
    volumes:
      - postgres-data:/var/lib/postgresql/data
  
  backend:
    environment:
      DB_DRIVER: postgres
      DB_HOST: postgres
      DB_NAME: jummahcast
      DB_USER: postgres
      DB_PASSWORD: postgres123
      # ... other vars
```

### 3. AWS ECS (Production)

#### Option A: Environment Variables in Task Definition

```json
{
  "environment": [
    { "name": "NODE_ENV", "value": "production" },
    { "name": "AUTH_MODE", "value": "cognito" },
    { "name": "DB_DRIVER", "value": "postgres" },
    { "name": "BLOB_DRIVER", "value": "s3" },
    { "name": "DB_HOST", "value": "jummahcast-prod.xxxxxxxx.eu-west-2.rds.amazonaws.com" },
    { "name": "DB_NAME", "value": "jummahcast" },
    { "name": "DB_USER", "value": "jummahcast_admin" },
    { "name": "S3_BUCKET", "value": "jummahcast-prod-sermons" },
    { "name": "COGNITO_USER_POOL_ID", "value": "eu-west-2_XXXXXXXXX" },
    { "name": "COGNITO_CLIENT_ID", "value": "xxxxxxxxxxxxxxxxxx" }
  ],
  "secrets": [
    {
      "name": "DB_PASSWORD",
      "valueFrom": "arn:aws:secretsmanager:eu-west-2:ACCOUNT_ID:secret:jummahcast/prod/db-password"
    }
  ]
}
```

#### Option B: Terraform (Recommended)

```hcl
resource "aws_ecs_task_definition" "api" {
  family = "jummahcast-api"
  
  container_definitions = jsonencode([{
    name = "api"
    image = "${aws_ecr_repository.api.repository_url}:${var.image_tag}"
    
    environment = [
      { name = "NODE_ENV", value = var.environment },
      { name = "AUTH_MODE", value = "cognito" },
      { name = "DB_DRIVER", value = "postgres" },
      { name = "BLOB_DRIVER", value = "s3" },
      { name = "DB_HOST", value = aws_db_instance.postgres.address },
      { name = "DB_NAME", value = aws_db_instance.postgres.db_name },
      { name = "DB_USER", value = aws_db_instance.postgres.username },
      { name = "DB_SSL", value = "true" },
      { name = "AWS_REGION", value = var.region },
      { name = "S3_BUCKET", value = aws_s3_bucket.sermons.id },
      { name = "COGNITO_USER_POOL_ID", value = aws_cognito_user_pool.main.id },
      { name = "COGNITO_CLIENT_ID", value = aws_cognito_user_pool_client.main.id },
      { name = "CORS_ALLOWED_ORIGINS", value = "https://jummahcast.com" }
    ]
    
    secrets = [
      {
        name = "DB_PASSWORD"
        valueFrom = aws_secretsmanager_secret_version.db_password.arn
      }
    ]
  }])
}
```

---

## 🔒 Secrets Management (IMPORTANT!)

### ❌ NEVER in Git
```bash
# Don't commit these!
DB_PASSWORD=my-secret-password
JWT_SECRET=super-secret-key
AWS_ACCESS_KEY_ID=AKIA...
```

### ✅ Use AWS Secrets Manager

**1. Store secrets:**
```bash
aws secretsmanager create-secret \
  --name jummahcast/prod/db-password \
  --secret-string "your-secure-password" \
  --region eu-west-2
```

**2. Reference in ECS task:**
```json
"secrets": [
  {
    "name": "DB_PASSWORD",
    "valueFrom": "arn:aws:secretsmanager:eu-west-2:ACCOUNT:secret:jummahcast/prod/db-password"
  }
]
```

**3. Grant IAM permissions:**
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "secretsmanager:GetSecretValue"
    ],
    "Resource": "arn:aws:secretsmanager:*:*:secret:jummahcast/prod/*"
  }]
}
```

---

## 🧪 Testing Different Configurations

### Test Local → Postgres Migration

```bash
# 1. Start with SQLite
DB_DRIVER=sqlite npm run dev

# 2. Start Postgres in Docker
docker run -d --name postgres \
  -e POSTGRES_DB=jummahcast \
  -e POSTGRES_PASSWORD=postgres123 \
  -p 5432:5432 \
  postgres:16-alpine

# 3. Switch to Postgres
DB_DRIVER=postgres \
DB_HOST=localhost \
DB_NAME=jummahcast \
DB_USER=postgres \
DB_PASSWORD=postgres123 \
npm run dev
```

### Test Local → Cognito Migration

```bash
# 1. Create Cognito User Pool (one-time setup)
# 2. Create test user in Cognito
# 3. Update environment
AUTH_MODE=cognito \
COGNITO_USER_POOL_ID=eu-west-2_XXXXXXXXX \
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxx \
AWS_REGION=eu-west-2 \
npm run dev

# 4. Login via Cognito Hosted UI or AWS SDK
```

---

## ⚠️ Common Mistakes

### 1. Missing Required Variables
```bash
# ❌ This will fail:
AUTH_MODE=cognito npm run dev
# Error: COGNITO_USER_POOL_ID is required

# ✅ This works:
AUTH_MODE=cognito \
COGNITO_USER_POOL_ID=eu-west-2_XXXXXXXXX \
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxx \
npm run dev
```

### 2. Wrong Driver Combo
```bash
# ❌ Don't mix these:
DB_DRIVER=sqlite
DB_HOST=my-rds-instance.aws.com  # Ignored! SQLite doesn't use this

# ✅ Be explicit:
DB_DRIVER=postgres
DB_HOST=my-rds-instance.aws.com  # Used correctly
```

### 3. Forgetting to Update CORS
```bash
# ❌ Production fails CORS:
CORS_ALLOWED_ORIGINS=http://localhost:5173
# Frontend on https://jummahcast.com gets blocked!

# ✅ Update for production:
CORS_ALLOWED_ORIGINS=https://jummahcast.com,https://www.jummahcast.com
```

---

## 📝 Environment Validation

The app validates configuration at startup:

```
Starting server...

✅ Configuration validated
🔐 Auth: cognito
💾 Database: postgres (jummahcast-prod.xxx.rds.amazonaws.com)
📦 Storage: s3 (jummahcast-prod-sermons)
🌐 CORS: https://jummahcast.com

Server running on port 4000
```

**If validation fails:**
```
❌ Configuration validation failed:
  - COGNITO_USER_POOL_ID is required when AUTH_MODE=cognito
  - DB_PASSWORD is required when DB_DRIVER=postgres
```

Fix the missing variables and restart!

---

## 🎯 Quick Reference by Environment

| Setting | Local Dev | Docker | AWS ECS |
|---------|-----------|--------|---------|
| **AUTH_MODE** | `local` | `local` | `cognito` |
| **DB_DRIVER** | `sqlite` | `sqlite`/`postgres` | `postgres` |
| **BLOB_DRIVER** | `local` | `local` | `s3` |
| **Secrets** | `.env` file | docker-compose | Secrets Manager |
| **DB Location** | `./data/app.db` | Volume mount | AWS RDS |
| **File Storage** | `./uploads/` | Volume mount | AWS S3 |

---

## 📚 See Also

- [ARCHITECTURE.md](../ARCHITECTURE.md) - How the driver pattern works
- [IMPLEMENTATION_GUIDE.md](../IMPLEMENTATION_GUIDE.md) - Detailed refactor docs
- [ecs-task-definition-example.json](./ecs-task-definition-example.json) - Full ECS config
