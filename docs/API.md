# API Reference

Base URL: `http://localhost:3000/api`

All authenticated endpoints require a JWT token in the `Authorization` header:
```
Authorization: Bearer <token>
```

---

## Auth

### POST /api/auth/register

Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePass123"
}
```

**Response (201):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "userId": "c8adcc5a-1a50-4c72-874c-374609f2d919",
  "email": "user@example.com"
}
```

### POST /api/auth/login

Login with existing credentials.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePass123"
}
```

**Response (201):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "userId": "c8adcc5a-1a50-4c72-874c-374609f2d919",
  "email": "user@example.com"
}
```

---

## Habits

All endpoints require authentication.

### POST /api/habits

Create a new habit.

**Request:**
```json
{
  "name": "Morning Meditation",
  "description": "10 minutes of mindfulness after waking",
  "frequency": "daily",
  "targetPerDay": 1
}
```

**Response (201):**
```json
{
  "id": "6b39132a-8618-4ee0-a172-109f979c5c92",
  "name": "Morning Meditation",
  "description": "10 minutes of mindfulness after waking",
  "frequency": "daily",
  "targetPerDay": 1,
  "active": true,
  "userId": "c8adcc5a-1a50-4c72-874c-374609f2d919",
  "createdAt": "2026-06-12T01:00:00.000Z",
  "updatedAt": "2026-06-12T01:00:00.000Z"
}
```

### GET /api/habits

Get all habits for the authenticated user.

**Response (200):**
```json
[
  {
    "id": "6b39132a-...",
    "name": "Morning Meditation",
    "frequency": "daily",
    "targetPerDay": 1,
    "active": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

### GET /api/habits/:id

Get a single habit.

### PUT /api/habits/:id

Update a habit.

**Request (partial):**
```json
{
  "active": false
}
```

### DELETE /api/habits/:id

Delete a habit and all its entries.

---

## Entries

### POST /api/habits/:habitId/entries

Log an entry for a habit. If an entry exists for the same habit+date, it increments the count.

**Request:**
```json
{
  "date": "2026-06-12",
  "count": 1,
  "note": "Felt great!"
}
```

### GET /api/habits/:habitId/entries

Get entries for a habit. Optional query params: `startDate`, `endDate`.

### PUT /api/entries/:id

Update an entry.

### DELETE /api/entries/:id

Delete an entry.

---

## Insights

### POST /api/insights/generate

Generate AI-powered insights from habit data. Analyzes streaks, weekly patterns, and produces a summary.

**Response (201):**
```json
[
  {
    "id": "uuid",
    "type": "streak",
    "title": "Morning Meditation: 14-day streak!",
    "content": "You've maintained \"Morning Meditation\" for 14 consecutive days. That's a full week of consistency!",
    "data": { "streak": 14, "best": 14 },
    "createdAt": "2026-06-12T01:00:00.000Z"
  }
]
```

### GET /api/insights

Get all generated insights for the authenticated user.
