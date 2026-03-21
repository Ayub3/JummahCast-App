# 🚀 Quick Start Guide

## Installation & Running (2 minutes)

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Add these new dependencies:
npm install jsonwebtoken aws-jwt-verify

# Frontend  
cd ../frontend
npm install
```

### 2. Configure Environment

```bash
# Backend: Copy template
cd backend
cp .env.example .env

# ✅ Default configuration works out of the box!
# AUTH_MODE=local, DB_DRIVER=sqlite, BLOB_DRIVER=local
```

### 3. Start Application

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

### 4. Test It!

1. **Open:** http://localhost:5173
2. **Click:** "Admin login"
3. **Login with:**
   - Email: `admin@jummahcast.local`
   - Password: `admin123`
4. **Upload a sermon!**

## 🎯 Test Credentials

| User Type | Email | Password | Access |
|-----------|-------|----------|--------|
| **Admin** | `admin@jummahcast.local` | `admin123` | ✅ Full access (can upload) |
| **Regular User** | `user@jummahcast.local` | `user123` | ❌ No upload access |

## API Endpoints

### Public Endpoints
```bash
GET  /health                    # Health check
GET  /api/sermons               # List sermons
GET  /api/speakers              # List speakers
GET  /api/sermons/:id/stream    # Stream audio
```

### Authentication
```bash
POST /api/auth/login            # Login (local auth)
GET  /api/auth/me               # Get current user (requires auth)
```

### Protected Endpoints (Require Authentication + Admin Role)
```bash
POST /api/admin/upload          # Upload sermon
```

## Troubleshooting

**Port 4000 already in use?**
```bash
# In backend/.env
PORT=4001
```

**Authentication not working?**
```bash
# Check backend/.env exists and contains:
AUTH_MODE=local
JWT_SECRET=your-super-secret-jwt-key-change-this
```

**CORS errors?**
```bash
# backend/.env
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173
```

## What Changed?

✅ **Authentication system** - Local JWT + Cognito support  
✅ **Layered architecture** - Domain, Services, Controllers  
✅ **Protected routes** - Admin upload requires login  
✅ **Error handling** - Centralized, consistent  
✅ **Input validation** - Zod schemas + sanitization  
✅ **Rate limiting** - Prevent abuse  

**📄 Full documentation:** See [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)

## Production Deployment

When ready for production:

1. **Update backend/.env:**
   ```bash
   AUTH_MODE=cognito
   DB_DRIVER=postgres
   BLOB_DRIVER=s3
   # ... add AWS credentials
   ```

2. **Setup AWS Cognito** (one-time):
   - Create User Pool
   - Create App Client
   - Create Groups: "Admins", "Users"
   - Add users to groups

3. **Deploy as usual** (Docker + ECS)

The same code works for both local and production! 🎉
