# JummahCast-App
A lightweight streaming service for Jummah lectures

## 🎯 Authentication Model

**Single Login with Role-Based Access:**
- ✅ **All users** can browse and listen to sermons
- ✅ **Admin users** can upload new content
- 🔐 Same login flow for everyone - access determined by role

### Test Accounts (Local Dev)
| Email | Password | Role | Can Upload? |
|-------|----------|------|-------------|
| `admin@jummahcast.local` | `admin123` | Admin | ✅ Yes |
| `user@jummahcast.local` | `user123` | User | ❌ No |

## 🏗️ Architecture

This app uses the **Provider Pattern** for environment-aware components:

```
Environment Variable → Provider Factory → Implementation

AUTH_MODE=local    →  createAuthProvider()  →  LocalAuthProvider (JWT)
AUTH_MODE=cognito  →  createAuthProvider()  →  CognitoAuthProvider (AWS)

DB_DRIVER=sqlite   →  createDbAdapter()     →  SQLite (file)
DB_DRIVER=postgres →  createDbAdapter()     →  PostgreSQL (RDS)

BLOB_DRIVER=local  →  createBlobAdapter()   →  Filesystem (./uploads)
BLOB_DRIVER=s3     →  createBlobAdapter()   →  AWS S3
```

**Same codebase works everywhere** - just change environment variables!

## 🚀 Quick Start

```bash
# Backend
cd backend
npm install
npm run dev    # Runs on http://localhost:4000

# Frontend
cd frontend
npm install
npm run dev    # Runs on http://localhost:5173
```

Visit http://localhost:5173 and login with test accounts above.

## 📚 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Complete system architecture guide
- **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Detailed implementation docs
- **[QUICKSTART.md](./QUICKSTART.md)** - 2-minute setup guide

## 🔧 Technology Stack

- **Frontend:** React 19, Vite, React Router
- **Backend:** Node.js, Express 5
- **Auth:** JWT (local) / AWS Cognito (production)
- **Database:** SQLite (local) / PostgreSQL (production)
- **Storage:** Filesystem (local) / AWS S3 (production)
- **Container:** Docker, Docker Compose

## 📖 Key Features

✅ Role-based access control (RBAC)  
✅ Environment-aware architecture  
✅ Authentication abstraction (Local + AWS Cognito)  
✅ Database abstraction (SQLite + PostgreSQL)  
✅ Storage abstraction (Local + S3)  
✅ Input validation & sanitization  
✅ Rate limiting  
✅ Centralized error handling  
✅ Docker support
