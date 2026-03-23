# 🏗️ JummahCast Architecture Guide

## 🎯 Authentication & Authorization Model

### Single Login Flow with Role-Based Access Control (RBAC)

**IMPORTANT:** There is **ONE login flow**, not separate "user" and "admin" logins.

```
┌─────────────────────────────────────────────────────┐
│              SINGLE LOGIN ENDPOINT                   │
│            POST /api/auth/login                      │
│         { email, password }                          │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
         Authenticate User
                 │
                 ▼
         ┌───────────────────┐
         │ Extract User Roles│
         │ from JWT Claims   │
         └────────┬──────────┘
                  │
        ┌─────────┴──────────┐
        ▼                    ▼
   ┌─────────┐         ┌──────────┐
   │  User   │         │  Admin   │
   │ Role    │         │  Role    │
   └────┬────┘         └────┬─────┘
        │                   │
        ▼                   ▼
   ✅ Browse           ✅ Browse
   ✅ Listen           ✅ Listen
   ❌ Upload           ✅ Upload
```

### How Roles Work

#### Local Development (AUTH_MODE=local)
```javascript
// In-memory test users in LocalAuthProvider
const users = [
  {
    id: 'admin-001',
    email: 'admin@jummahcast.local',
    password: 'admin123',
    roles: ['admin']  // ← Can upload
  },
  {
    id: 'user-001',
    email: 'user@jummahcast.local',
    password: 'user123',
    roles: ['user']   // ← Cannot upload
  }
];
```

#### Production (AUTH_MODE=cognito)
```
AWS Cognito User Pool
├── Groups:
│   ├── Admins    → maps to role: 'admin'
│   └── Users     → maps to role: 'user'
│
└── Users:
    ├── john@company.com (in group: Admins) → can upload
    └── jane@company.com (in group: Users)  → cannot upload
```

The backend extracts roles from Cognito groups:
```javascript
extractRoles(payload) {
  const groups = payload['cognito:groups'] || [];
  const roleMapping = {
    'Admins': 'admin',
    'Users': 'user'
  };
  return groups.map(g => roleMapping[g] || 'user');
}
```

### UI Experience

**Before Login:**
- Navigation shows: "Login" button

**After Login (Regular User):**
- Navigation shows: email + "Logout" button
- Can browse and listen to sermons
- Upload page redirects with "Access Denied"

**After Login (Admin User):**
- Navigation shows: email + **"ADMIN"** badge + "Logout" button
- Can browse, listen, AND upload sermons
- Upload page accessible

---

## 🔧 Provider/Driver Pattern Explained

The application uses the **Factory Pattern** for environment-aware component swapping.

### 1. Authentication Provider

```
┌─────────────────────────────────────────┐
│   Environment Variable: AUTH_MODE       │
├─────────────────────────────────────────┤
│   LOCAL: "local"                        │
│   PROD:  "cognito"                      │
└──────────────┬──────────────────────────┘
               │
               ▼
      ┌────────────────┐
      │ createAuthProvider(config) │
      └────────┬────────┘
               │
    ┏━━━━━━━━━┻━━━━━━━━━┓
    ▼                    ▼
┌─────────────────┐  ┌──────────────────┐
│LocalAuthProvider│  │CognitoAuthProvider│
├─────────────────┤  ├──────────────────┤
│- JWT signing    │  │- JWT verification│
│- In-memory users│  │- JWKS validation │
│- No AWS deps    │  │- Cognito API     │
└─────────────────┘  └──────────────────┘
```

**Code:**
```javascript
// backend/src/infrastructure/auth/index.js
export function createAuthProvider(config) {
  if (config.AUTH_MODE === 'cognito') {
    return new CognitoAuthProvider({
      userPoolId: config.COGNITO_USER_POOL_ID,
      clientId: config.COGNITO_CLIENT_ID,
      region: config.AWS_REGION,
    });
  }
  
  return new LocalAuthProvider(config.JWT_SECRET);
}
```

### 2. Database Driver

```
┌─────────────────────────────────────────┐
│   Environment Variable: DB_DRIVER       │
├─────────────────────────────────────────┤
│   LOCAL: "sqlite"                       │
│   PROD:  "postgres"                     │
└──────────────┬──────────────────────────┘
               │
               ▼
        ┌──────────────┐
        │ createDbAdapter(config) │
        └────────┬─────┘
                 │
      ┏━━━━━━━━━┻━━━━━━━━┓
      ▼                   ▼
┌─────────────┐    ┌──────────────┐
│SQLite Adapter│   │Postgres Adapter│
├─────────────┤    ├──────────────┤
│- File-based │    │- AWS RDS     │
│- ./data/    │    │- Connection  │
│  app.db     │    │  pooling     │
└─────────────┘    └──────────────┘
```

**Code:**
```javascript
// backend/adapters/db/index.js
export function createDbAdapter(config) {
  if (config.DB_DRIVER === 'postgres') {
    return createPostgresDb(config);
  }
  return createSqliteDb(config);
}
```

### 3. Storage Driver

```
┌─────────────────────────────────────────┐
│   Environment Variable: BLOB_DRIVER     │
├─────────────────────────────────────────┤
│   LOCAL: "local"                        │
│   PROD:  "s3"                           │
└──────────────┬──────────────────────────┘
               │
               ▼
       ┌───────────────┐
       │ createBlobAdapter(config) │
       └────────┬──────┘
                │
     ┏━━━━━━━━━┻━━━━━━━━━┓
     ▼                    ▼
┌──────────────┐    ┌─────────────┐
│Local Storage │    │ AWS S3      │
├──────────────┤    ├─────────────┤
│- ./uploads/  │    │- S3 bucket  │
│- File system │    │- Presigned  │
│- Range reqs  │    │  URLs       │
└──────────────┘    └─────────────┘
```

**Code:**
```javascript
// backend/adapters/blob/index.js
export function createBlobAdapter(config) {
  if (config.BLOB_DRIVER === 's3') {
    return createS3Blob(config);
  }
  return createLocalBlob(config);
}
```

---

## 🌍 Environment Configuration

### Local Development (.env)

```bash
NODE_ENV=development

# Authentication: Local JWT
AUTH_MODE=local
JWT_SECRET=your-dev-secret

# Database: SQLite file
DB_DRIVER=sqlite

# Storage: Local filesystem
BLOB_DRIVER=local

# CORS: Allow frontend dev server
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173
```

### Production (.env.production)

```bash
NODE_ENV=production

# Authentication: AWS Cognito
AUTH_MODE=cognito
COGNITO_USER_POOL_ID=eu-west-2_XXXXXXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxx
AWS_REGION=eu-west-2

# Database: AWS RDS PostgreSQL
DB_DRIVER=postgres
DB_HOST=jummahcast-prod.xxxxxxxx.eu-west-2.rds.amazonaws.com
DB_NAME=jummahcast
DB_USER=jummahcast_admin
DB_PASSWORD=<from AWS Secrets Manager>
DB_SSL=true

# Storage: AWS S3
BLOB_DRIVER=s3
S3_BUCKET=jummahcast-prod-sermons

# CORS: Production domain
CORS_ALLOWED_ORIGINS=https://jummahcast.com,https://www.jummahcast.com
```

---

## 🔄 How Switching Works

### The Magic: Same Code, Different Behavior

```javascript
// backend/src/server.js - Application Startup
export function createApp() {
  const config = getConfig();  // Reads environment variables

  // 🎯 These lines create the right provider based on ENV
  const authProvider = createAuthProvider(config);  // Local OR Cognito
  const db = createDbAdapter(config);               // SQLite OR Postgres
  const blob = createBlobAdapter(config);           // Local OR S3

  // Rest of app uses these providers
  const authService = new AuthService(authProvider);
  const uploadService = new UploadService(db, blob);
  // ...
}
```

### No Code Changes Needed!

The same route handler works everywhere:
```javascript
// backend/src/api/routes/admin.js
router.post('/upload',
  createAuthMiddleware(authProvider),  // ← Works with Local OR Cognito
  requireRole(authProvider, 'admin'),  // ← Checks roles from either provider
  upload.single('file'),
  adminController.uploadSermon
);
```

---

## 📊 Component Compatibility Matrix

| Component | Local Dev | Production | Switch Via |
|-----------|-----------|------------|------------|
| **Authentication** | JWT (in-memory) | AWS Cognito | `AUTH_MODE` |
| **Database** | SQLite (file) | PostgreSQL (RDS) | `DB_DRIVER` |
| **Storage** | Filesystem | AWS S3 | `BLOB_DRIVER` |
| **CORS** | localhost:5173 | your-domain.com | `CORS_ALLOWED_ORIGINS` |

---

## 🚀 Deployment Workflow

### Step 1: Develop Locally
```bash
# .env
AUTH_MODE=local
DB_DRIVER=sqlite
BLOB_DRIVER=local

npm run dev  # Everything runs locally
```

### Step 2: Test Production Mode Locally (Optional)
```bash
# .env.staging
AUTH_MODE=cognito
DB_DRIVER=postgres
BLOB_DRIVER=s3
# ... add AWS credentials

npm run dev  # Uses AWS services from local machine
```

### Step 3: Deploy to Production
```bash
# docker build -t jummahcast-api .
# docker push to ECR
# ECS pulls image and sets environment variables via task definition

# Environment variables set in ECS Task Definition:
# - AUTH_MODE=cognito
# - DB_DRIVER=postgres
# - BLOB_DRIVER=s3
# - All AWS resource identifiers
```

**The same Docker image runs everywhere!** Only environment variables change.

---

## 🧪 Testing Different Roles

### Test as Regular User
1. Login: `user@jummahcast.local` / `user123`
2. Try to visit: `http://localhost:5173/admin/upload`
3. **Result:** ❌ Access Denied (403 Forbidden)

### Test as Admin User
1. Login: `admin@jummahcast.local` / `admin123`
2. Try to visit: `http://localhost:5173/admin/upload`
3. **Result:** ✅ Success - Upload page loads

---

## 🔐 Production Setup Checklist

### AWS Cognito Setup
1. Create User Pool
2. Create App Client (no client secret for public apps)
3. Create Groups:
   - `Admins` (for upload access)
   - `Users` (for browse-only)
4. Add users and assign to groups
5. Copy User Pool ID and Client ID to `.env`

### Backend Environment
```bash
AUTH_MODE=cognito
COGNITO_USER_POOL_ID=from-cognito-console
COGNITO_CLIENT_ID=from-cognito-console
AWS_REGION=eu-west-2
```

### Frontend Environment
```bash
VITE_API_BASE_URL=https://api.yoursite.com
```

**That's it!** The same code now uses Cognito instead of local auth.

---

## 💡 Key Takeaways

1. **One Login Flow:** All users log in the same way
2. **Roles Determine Access:** Backend checks user roles after authentication
3. **Provider Pattern:** Environment variables control which implementation is used
4. **Zero Code Changes:** Same codebase works local → staging → production
5. **Test Locally First:** Both local and cloud modes can run on your laptop

---

## 🐛 Troubleshooting

**"Access Denied" when trying to upload:**
- Check user roles in JWT token
- Local: User must be in admin list in LocalAuthProvider
- Production: User must be in "Admins" group in Cognito

**"Invalid token" errors:**
- Local: Check JWT_SECRET matches between sessions
- Production: Verify COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID are correct

**Database connection failed:**
- Check DB_DRIVER matches your setup (sqlite/postgres)
- For postgres: Verify DB_HOST, DB_USER, DB_PASSWORD, DB_NAME

**File upload fails:**
- Check BLOB_DRIVER setting
- Local: Ensure ./uploads directory is writable
- Production: Verify S3_BUCKET exists and IAM permissions are correct
