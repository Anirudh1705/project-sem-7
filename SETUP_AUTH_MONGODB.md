# JWT Authentication & MongoDB Setup Guide

## Overview

The Testbot application now includes:
- **JWT Authentication** - Secure user login/registration
- **MongoDB Integration** - Persistent chat storage per user
- **User Sessions** - Each user has their own chat history
- **Token-based API** - All API endpoints require JWT authentication

## Prerequisites

1. **Node.js 18+** - Already installed
2. **MongoDB** - Local or cloud instance
3. **Gemini API Key** - Already configured

## Step 1: Setup MongoDB

### Option A: Local MongoDB (Recommended for Development)

1. **Install MongoDB Community Edition**
   - Windows: Download from https://www.mongodb.com/try/download/community
   - Follow installation wizard
   - MongoDB runs as a service on `localhost:27017`

2. **Verify MongoDB is running**
   ```bash
   mongosh
   ```
   If you see a connection prompt, MongoDB is running.

### Option B: MongoDB Atlas (Cloud)

1. **Create free account** at https://www.mongodb.com/cloud/atlas
2. **Create a cluster** (free tier available)
3. **Get connection string** from Atlas dashboard
4. **Update `.env` file** with your connection string

## Step 2: Configure Environment Variables

Edit `.env` file in the project root:

```env
# Gemini API Key (already set)
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# MongoDB Connection String
# For local MongoDB:
MONGODB_URI=mongodb://localhost:27017/testbot

# For MongoDB Atlas (cloud):
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/testbot

# JWT Secret (change this in production!)
JWT_SECRET=your-secret-key-change-in-production
```

## Step 3: Install Dependencies

All dependencies are already installed:
- `jsonwebtoken` - JWT token generation/verification
- `mongoose` - MongoDB ODM
- `bcryptjs` - Password hashing

## Step 4: Run the Application

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Step 5: Test Authentication

### Register a New User

1. Open http://localhost:3000
2. Click "Sign Up"
3. Enter:
   - Name: Your name
   - Email: your@email.com
   - Password: At least 6 characters
4. Click "Sign Up"

### Login

1. Click "Login"
2. Enter your email and password
3. Click "Login"

## How It Works

### Authentication Flow

```
User Registration/Login
        ↓
POST /api/auth/register or /api/auth/login
        ↓
Validate credentials
        ↓
Hash password (bcryptjs)
        ↓
Generate JWT token
        ↓
Return token + user info
        ↓
Store in localStorage
        ↓
Include in API requests (Authorization header)
```

### Chat Storage Flow

```
User sends message
        ↓
POST /api/chat with JWT token
        ↓
Verify JWT token
        ↓
Get Gemini response
        ↓
Save to MongoDB (linked to user)
        ↓
Return response
        ↓
Update UI
```

## API Endpoints

### Authentication

**POST /api/auth/register**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

Response:
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**POST /api/auth/login**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Chat Sessions

**GET /api/sessions**
- Get all user's chat sessions
- Requires: `Authorization: Bearer {token}`

**POST /api/sessions**
- Create new chat session
- Requires: `Authorization: Bearer {token}`
- Body: `{ "title": "Chat Title" }`

**GET /api/sessions/{id}**
- Get specific session
- Requires: `Authorization: Bearer {token}`

**DELETE /api/sessions/{id}**
- Delete session
- Requires: `Authorization: Bearer {token}`

**POST /api/chat**
- Send message and get response
- Requires: `Authorization: Bearer {token}`
- Body: `{ "message": "...", "history": [...], "sessionId": "..." }`

## Database Schema

### Users Collection

```typescript
{
  _id: ObjectId,
  email: string (unique),
  password: string (hashed),
  name: string,
  createdAt: Date,
  updatedAt: Date
}
```

### ChatSessions Collection

```typescript
{
  _id: ObjectId,
  userId: string (reference to User),
  title: string,
  messages: [
    {
      id: string,
      role: 'user' | 'assistant',
      content: string,
      timestamp: Date
    }
  ],
  stats: {
    promptTokens: number,
    completionTokens: number,
    totalTokens: number,
    estimatedCost: number
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Security Features

✅ **Password Hashing** - Passwords hashed with bcryptjs (10 salt rounds)
✅ **JWT Tokens** - Secure token-based authentication
✅ **Token Expiry** - Tokens expire after 7 days
✅ **Authorization** - All API endpoints verify JWT token
✅ **User Isolation** - Users can only access their own data
✅ **Input Validation** - Email and password validation

## Troubleshooting

### MongoDB Connection Error

**Error:** `MongooseError: Cannot connect to MongoDB`

**Solution:**
1. Ensure MongoDB is running
2. Check connection string in `.env`
3. For local: `mongodb://localhost:27017/testbot`
4. For Atlas: Verify username, password, and cluster name

### JWT Token Expired

**Error:** `Unauthorized - Invalid token`

**Solution:**
- Logout and login again
- Token expires after 7 days
- New token generated on each login

### Password Too Short

**Error:** `Password must be at least 6 characters`

**Solution:**
- Use a password with 6+ characters

### Email Already Exists

**Error:** `User already exists`

**Solution:**
- Use a different email address
- Or login with existing account

## Production Deployment

### Before Deploying:

1. **Change JWT_SECRET**
   ```env
   JWT_SECRET=your-very-secure-random-string-here
   ```

2. **Use MongoDB Atlas** (not local)
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/testbot
   ```

3. **Set environment variables** on your hosting platform:
   - Vercel: Settings → Environment Variables
   - Heroku: Config Vars
   - AWS: Environment Variables

4. **Build and test**
   ```bash
   npm run build
   npm start
   ```

## Features Implemented

✅ User registration with email/password
✅ User login with JWT token
✅ Persistent chat sessions in MongoDB
✅ Per-user chat history
✅ Token tracking per session
✅ Cost calculation per session
✅ Export chats (JSON, Markdown, CSV)
✅ Session management (create, delete, list)
✅ Automatic token refresh on login
✅ Logout functionality

## Next Steps

1. Start MongoDB
2. Update `.env` with your MongoDB URI
3. Run `npm run dev`
4. Register a new account
5. Start chatting!

## Support

For issues:
1. Check MongoDB connection
2. Verify `.env` variables
3. Check browser console for errors
4. Check server logs in terminal
