# Seed Conversations Admin Endpoint Documentation

## Overview
The `/api/admin/seed-conversations` endpoint allows admin users or users with lifetime access to seed the production database with 140 therapy-informed conversation questions for couples.

## Endpoint Details

- **URL**: `/api/admin/seed-conversations`
- **Method**: `POST`
- **Authentication**: Required (user must be authenticated)
- **Authorization**: Admin users or users with lifetime access only

## Implementation

### Storage Methods Added
1. **`getAllConversationQuestions()`**: Retrieves all conversation questions from the database
2. **`createConversationQuestion()`**: Creates a new conversation question in the database

### Files Modified
1. **`server/storage.ts`**: Added the two storage methods to interface and implementation
2. **`server/routes.ts`**: Added the admin endpoint at line ~2944
3. **`server/seedConversations.ts`**: Updated to prevent auto-execution when imported

## Usage

### Prerequisites
- User must be logged in as an admin or have lifetime access
- Application must be running (`npm run dev`)

### How to Seed Conversations

#### Option 1: Using curl (Recommended for Production)
```bash
# First, login as admin to get session cookie
curl -c cookies.txt -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}'

# Then call the seed endpoint
curl -b cookies.txt -X POST http://localhost:5000/api/admin/seed-conversations
```

#### Option 2: Using JavaScript/Fetch
```javascript
// First login
const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'your-password'
  }),
  credentials: 'include'
});

// Then seed conversations
const seedResponse = await fetch('http://localhost:5000/api/admin/seed-conversations', {
  method: 'POST',
  credentials: 'include'
});

const result = await seedResponse.json();
console.log(result);
```

## Response Format

### Success Response (First Time)
```json
{
  "success": true,
  "message": "Conversation questions seeded successfully",
  "count": 140,
  "status": "seeded",
  "categories": [
    "emotional_intimacy",
    "communication_conflict",
    "physical_intimacy",
    "finances_planning",
    "values_spiritual",
    "play_adventure",
    "trust_boundaries"
  ],
  "intensityLevels": [1, 2, 3]
}
```

### Already Seeded Response (Idempotent)
```json
{
  "success": true,
  "message": "Conversation questions already exist in database",
  "count": 140,
  "status": "already_seeded"
}
```

### Error Responses

#### Unauthorized (Not Logged In)
```json
{
  "message": "Authentication required"
}
```

#### Forbidden (Not Admin/Lifetime User)
```json
{
  "message": "Access denied. This endpoint is only available to admin or lifetime users."
}
```

#### Server Error
```json
{
  "success": false,
  "message": "Failed to seed conversation questions",
  "error": "Error details here"
}
```

## Question Categories

The endpoint seeds 140 questions across 7 categories (20 questions each):

1. **emotional_intimacy** - Building emotional connection
2. **communication_conflict** - Improving communication and conflict resolution
3. **physical_intimacy** - Physical touch and closeness
4. **finances_planning** - Financial planning and security
5. **values_spiritual** - Shared values and spiritual connection
6. **play_adventure** - Fun activities and adventures
7. **trust_boundaries** - Building trust and healthy boundaries

## Intensity Levels

Each question has an intensity level:
- **1** (Gentle) - Easy, light questions
- **2** (Moderate) - Deeper exploration
- **3** (Deep) - Most vulnerable/challenging questions

## Production Deployment

To seed the production database after deployment:

1. Deploy the updated code with this endpoint
2. Login to production as an admin user
3. Call the endpoint once to seed all questions
4. The endpoint is idempotent, so it's safe to call multiple times

## Verification

To verify questions were seeded correctly, you can:

1. Check the response count (should be 140)
2. Use the existing conversation endpoints to retrieve questions
3. Check the database directly: `SELECT COUNT(*) FROM conversation_questions;`

## Notes

- The endpoint is idempotent - safe to run multiple times
- Questions come from therapy-informed sources (Gottman Method, EFT, etc.)
- Each question includes a therapy prompt for guidance
- All questions are marked as `active: 1` by default