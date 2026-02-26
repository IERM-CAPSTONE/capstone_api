# 📮 Postman API Testing Guide

## 🚀 Quick Start

### Prerequisites
1. **Postman** installed on your machine
2. **API Server Running**: `npm run start:dev:api` (should be running on `http://localhost:3001`)
3. **Redis Server Running**: Windows Service or `C:\Redis\redis-server.exe`
4. **Database**: PostgreSQL running with seed data
5. **Postman Collection**: Import `Capstone_API_Postman_Collection.json`

### Environment Setup
1. Open Postman
2. Create a new Environment or use existing one
3. Add variable: `base_url = http://localhost:3001`
4. Add variable: `accessToken = (will be filled after getting token)`

---

## 📋 Table of Contents
1. [Authentication APIs](#-authentication-apis)
2. [Exam Rooms APIs](#-exam-rooms-apis)
3. [Exam Sessions APIs](#-exam-sessions-apis)
4. [Exam Seats APIs](#-exam-seats-apis)
5. [Student Exams APIs](#-student-exams-apis)
6. [Users APIs](#-users-apis)
7. [Testing Workflow](#-testing-workflow)
8. [Common Issues & Solutions](#-common-issues--solutions)

---

## 🔐 Authentication APIs

### 1. Get Test Token
**Purpose**: Obtain JWT access token for API authentication

| Property | Value |
|----------|-------|
| **Location** | `apps/app_api/src/features/users/use-cases/test-token/` |
| **Method** | `POST` |
| **URL** | `{{base_url}}/api/auth/test-token` |
| **Auth** | None (public endpoint) |

**Request Body** (JSON):
```json
{
  "role": "ADMIN",
  "userId": "admin-id-123"
}
```

**Available Roles**:
- `ADMIN` - Full system access
- `EXAM_OFFICER` - Exam management
- `PROCTOR` - Exam proctoring
- `HALL_INVIGILATOR` - Hall supervision
- `STUDENT` - Student access

**Response** (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

**How to Save Token in Postman**:
1. Click **Tests** tab
2. Add script to save token to environment:
```javascript
var jsonData = pm.response.json();
if (jsonData.accessToken) {
    pm.environment.set("accessToken", jsonData.accessToken);
}
```

---

### 2. Get Current User Profile
**Purpose**: Get authenticated user's profile information

| Property | Value |
|----------|-------|
| **Location** | `apps/app_api/src/features/users/use-cases/me/` |
| **Method** | `GET` |
| **URL** | `{{base_url}}/api/users/me` |
| **Auth** | Bearer Token (Required) |

**Request Headers**:
```
Authorization: Bearer {{accessToken}}
```

**Response** (200 OK):
```json
{
  "id": "user-id-123",
  "email": "admin@exam.com",
  "fullName": "Admin User",
  "identityCode": "ADMIN001",
  "role": "ADMIN",
  "isActive": true,
  "createdAt": "2026-01-14T12:00:00.000Z",
  "updatedAt": "2026-01-14T12:00:00.000Z"
}
```

---

## 🏢 Exam Rooms APIs

### 1. List All Exam Rooms
**Purpose**: Get paginated list of all exam rooms

| Property | Value |
|----------|-------|
| **Location** | `apps/app_api/src/features/exam-rooms/use-cases/list-exam-rooms/` |
| **Method** | `GET` |
| **URL** | `{{base_url}}/api/exam-rooms` |
| **Auth** | Bearer Token (Required) |

**Query Parameters**:
```
?page=1&limit=10
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 10) |

**Request Headers**:
```
Authorization: Bearer {{accessToken}}
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "room-id-1",
      "roomNumber": "101",
      "capacity": 30,
      "status": "Available",
      "createdAt": "2026-01-14T10:00:00.000Z",
      "updatedAt": "2026-01-14T10:00:00.000Z"
    },
    {
      "id": "room-id-2",
      "roomNumber": "102",
      "capacity": 40,
      "status": "Occupied",
      "createdAt": "2026-01-14T10:05:00.000Z",
      "updatedAt": "2026-01-14T10:05:00.000Z"
    }
  ],
  "total": 4,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

---

### 2. Create Exam Room
**Purpose**: Create a new exam room

| Property | Value |
|----------|-------|
| **Location** | `apps/app_api/src/features/exam-rooms/use-cases/create-exam-room/` |
| **Method** | `POST` |
| **URL** | `{{base_url}}/api/exam-rooms` |
| **Auth** | Bearer Token (Required) - Admin/Exam Officer only |

**Request Headers**:
```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Request Body** (JSON):
```json
{
  "roomNumber": "R-201",
  "capacity": 40,
  "status": "Available"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `roomNumber` | string | Yes | Unique identifier (e.g., "101", "R-201") |
| `capacity` | number | No | Room capacity (must be ≥ 1) |
| `status` | string | No | Default: "Available" |

**Status Options**:
- `Available` - Room is available for use
- `Occupied` - Room is currently in use
- `Maintenance` - Room is under maintenance
- `Exam_Ongoing` - Exam is currently happening
- `For_Exam` - Room reserved for exam

**Response** (201 Created):
```json
{
  "id": "room-id-new",
  "roomNumber": "R-201",
  "capacity": 40,
  "status": "Available",
  "createdAt": "2026-01-14T14:30:00.000Z",
  "updatedAt": "2026-01-14T14:30:00.000Z"
}
```

**Error Response** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": "Room number 'R-201' already exists",
  "error": "Bad Request"
}
```

---

### 3. Get Single Exam Room
**Purpose**: Get details of a specific exam room

| Property | Value |
|----------|-------|
| **Location** | `apps/app_api/src/features/exam-rooms/use-cases/get-exam-room/` |
| **Method** | `GET` |
| **URL** | `{{base_url}}/api/exam-rooms/{id}` |
| **Auth** | Bearer Token (Required) |

**Request Headers**:
```
Authorization: Bearer {{accessToken}}
```

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string (UUID) | Room ID from list response |

**Example URL**:
```
GET {{base_url}}/api/exam-rooms/550e8400-e29b-41d4-a716-446655440000
```

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "roomNumber": "101",
  "capacity": 30,
  "status": "Available",
  "createdAt": "2026-01-14T10:00:00.000Z",
  "updatedAt": "2026-01-14T10:00:00.000Z"
}
```

---

### 4. Update Exam Room
**Purpose**: Update exam room details

| Property | Value |
|----------|-------|
| **Location** | `apps/app_api/src/features/exam-rooms/use-cases/update-exam-room/` |
| **Method** | `PUT` |
| **URL** | `{{base_url}}/api/exam-rooms/{id}` |
| **Auth** | Bearer Token (Required) - Admin/Exam Officer only |

**Request Headers**:
```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Request Body** (JSON):
```json
{
  "capacity": 50,
  "status": "Maintenance"
}
```

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "roomNumber": "101",
  "capacity": 50,
  "status": "Maintenance",
  "createdAt": "2026-01-14T10:00:00.000Z",
  "updatedAt": "2026-01-14T14:35:00.000Z"
}
```

---

### 5. Delete Exam Room
**Purpose**: Delete an exam room

| Property | Value |
|----------|-------|
| **Location** | `apps/app_api/src/features/exam-rooms/use-cases/delete-exam-room/` |
| **Method** | `DELETE` |
| **URL** | `{{base_url}}/api/exam-rooms/{id}` |
| **Auth** | Bearer Token (Required) - Admin only |

**Request Headers**:
```
Authorization: Bearer {{accessToken}}
```

**Response** (204 No Content):
```
(Empty response body)
```

---

### 6. Import Exam Rooms from Excel
**Purpose**: Bulk import exam rooms from Excel file

| Property | Value |
|----------|-------|
| **Location** | `apps/app_api/src/features/exam-rooms/use-cases/import-exam-room/` |
| **Method** | `POST` |
| **URL** | `{{base_url}}/api/exam-rooms/import` |
| **Auth** | Bearer Token (Required) - Admin only |

**Request Headers**:
```
Authorization: Bearer {{accessToken}}
Content-Type: multipart/form-data
```

**Form Data**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | Excel file (.xlsx, .csv) |

**Excel File Format**:
| Column A | Column B | Column C |
|----------|----------|----------|
| roomNumber | capacity | status |
| 101 | 30 | Available |
| 102 | 40 | Available |
| 103 | 35 | Maintenance |

**Response** (200 OK):
```json
{
  "imported": 3,
  "failed": 0,
  "errors": []
}
```

---

## 📚 Exam Sessions APIs

### 1. List All Exam Sessions
**Purpose**: Get paginated list of all exam sessions

| Property | Value |
|----------|-------|
| **Location** | `apps/app_api/src/features/exam-sessions/use-cases/list-exam-sessions/` |
| **Method** | `GET` |
| **URL** | `{{base_url}}/api/exam-sessions` |
| **Auth** | Bearer Token (Required) |

**Query Parameters**:
```
?page=1&limit=10
```

**Request Headers**:
```
Authorization: Bearer {{accessToken}}
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "session-id-1",
      "subjectCode": "CS101",
      "examRoomId": "room-id-1",
      "proctorId": "proctor-id-1",
      "hallInvigilatorId": "hall-invigilator-id-1",
      "examOpenTime": "2026-01-20T08:00:00.000Z",
      "examCloseTime": "2026-01-20T10:00:00.000Z",
      "status": "Scheduled",
      "createdAt": "2026-01-14T10:00:00.000Z",
      "updatedAt": "2026-01-14T10:00:00.000Z"
    }
  ],
  "total": 3,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

---

### 2. Create Exam Session
**Purpose**: Create a new exam session

| Property | Value |
|----------|-------|
| **Location** | `apps/app_api/src/features/exam-sessions/use-cases/create-exam-session/` |
| **Method** | `POST` |
| **URL** | `{{base_url}}/api/exam-sessions` |
| **Auth** | Bearer Token (Required) - Admin/Exam Officer only |

**Request Headers**:
```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Request Body** (JSON):
```json
{
  "subjectCode": "CS302",
  "examRoomId": "room-id-123",
  "proctorId": "proctor-id-456",
  "hallInvigilatorId": "hall-invigilator-id-789",
  "examOpenTime": "2026-01-22T09:00:00.000Z",
  "examCloseTime": "2026-01-22T11:00:00.000Z",
  "status": "Scheduled"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `subjectCode` | string | Yes | Subject/course code (e.g., "CS302") |
| `examRoomId` | string (UUID) | Yes | ID of exam room |
| `proctorId` | string (UUID) | Yes | ID of proctor user |
| `hallInvigilatorId` | string (UUID) | Yes | ID of hall invigilator user |
| `examOpenTime` | ISO 8601 DateTime | Yes | Exam start time |
| `examCloseTime` | ISO 8601 DateTime | Yes | Exam end time |
| `status` | string | No | Default: "Scheduled" |

**Status Options**:
- `Scheduled` - Session is scheduled
- `Ongoing` - Exam is currently happening
- `Ended` - Exam has ended

**Response** (201 Created):
```json
{
  "id": "session-id-new",
  "subjectCode": "CS302",
  "examRoomId": "room-id-123",
  "proctorId": "proctor-id-456",
  "hallInvigilatorId": "hall-invigilator-id-789",
  "examOpenTime": "2026-01-22T09:00:00.000Z",
  "examCloseTime": "2026-01-22T11:00:00.000Z",
  "status": "Scheduled",
  "createdAt": "2026-01-14T14:30:00.000Z",
  "updatedAt": "2026-01-14T14:30:00.000Z"
}
```

---

### 3. Get Single Exam Session
**Purpose**: Get details of a specific exam session

| Property | Value |
|----------|-------|
| **Location** | `apps/app_api/src/features/exam-sessions/use-cases/get-exam-session/` |
| **Method** | `GET` |
| **URL** | `{{base_url}}/api/exam-sessions/{id}` |
| **Auth** | Bearer Token (Required) |

**Request Headers**:
```
Authorization: Bearer {{accessToken}}
```

**Response** (200 OK):
```json
{
  "id": "session-id-1",
  "subjectCode": "CS101",
  "examRoomId": "room-id-1",
  "proctorId": "proctor-id-1",
  "hallInvigilatorId": "hall-invigilator-id-1",
  "examOpenTime": "2026-01-20T08:00:00.000Z",
  "examCloseTime": "2026-01-20T10:00:00.000Z",
  "status": "Scheduled",
  "createdAt": "2026-01-14T10:00:00.000Z",
  "updatedAt": "2026-01-14T10:00:00.000Z"
}
```

---

### 4. Update Exam Session
**Purpose**: Update exam session details

| Property | Value |
|----------|-------|
| **Location** | `apps/app_api/src/features/exam-sessions/use-cases/update-exam-session/` |
| **Method** | `PUT` |
| **URL** | `{{base_url}}/api/exam-sessions/{id}` |
| **Auth** | Bearer Token (Required) - Admin/Exam Officer only |

**Request Headers**:
```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Request Body** (JSON):
```json
{
  "status": "Ongoing",
  "examOpenTime": "2026-01-22T09:00:00.000Z"
}
```

**Response** (200 OK):
```json
{
  "id": "session-id-1",
  "subjectCode": "CS101",
  "examRoomId": "room-id-1",
  "proctorId": "proctor-id-1",
  "hallInvigilatorId": "hall-invigilator-id-1",
  "examOpenTime": "2026-01-22T09:00:00.000Z",
  "examCloseTime": "2026-01-20T10:00:00.000Z",
  "status": "Ongoing",
  "createdAt": "2026-01-14T10:00:00.000Z",
  "updatedAt": "2026-01-14T14:40:00.000Z"
}
```

---

### 5. Delete Exam Session
**Purpose**: Delete an exam session

| Property | Value |
|----------|-------|
| **Location** | `apps/app_api/src/features/exam-sessions/use-cases/delete-exam-session/` |
| **Method** | `DELETE` |
| **URL** | `{{base_url}}/api/exam-sessions/{id}` |
| **Auth** | Bearer Token (Required) - Admin only |

**Response** (204 No Content):
```
(Empty response body)
```

---

### 6. Import Exam Sessions from Excel
**Purpose**: Bulk import exam sessions from Excel file

| Property | Value |
|----------|-------|
| **Location** | `apps/app_api/src/features/exam-sessions/use-cases/import-exam-session/` |
| **Method** | `POST` |
| **URL** | `{{base_url}}/api/exam-sessions/import` |
| **Auth** | Bearer Token (Required) - Admin only |

**Request Headers**:
```
Authorization: Bearer {{accessToken}}
Content-Type: multipart/form-data
```

**Form Data**:
| Field | Type | Required |
|-------|------|----------|
| `file` | File | Yes |

**Excel File Format**:
| Column A | Column B | Column C | Column D | Column E | Column F | Column G |
|----------|----------|----------|----------|----------|----------|----------|
| subjectCode | examRoomId | proctorId | hallInvigilatorId | examOpenTime | examCloseTime | status |
| CS101 | room-1 | proctor-1 | hall-1 | 2026-01-20T08:00:00Z | 2026-01-20T10:00:00Z | Scheduled |

---

## 🪑 Exam Seats APIs

### 1. Get All Exam Seats
**Purpose**: Retrieve all exam seats across all sessions

| Property | Value |
|----------|-------|
| **Location** | `apps/app_api/src/features/exam-seats/use-cases/get-all-exam-seats/` |
| **Method** | `GET` |
| **URL** | `{{base_url}}/api/exam-seats` |
| **Auth** | Bearer Token (Required) |

**Request Headers**:
```
Authorization: Bearer {{accessToken}}
```

**Response** (200 OK):
```json
[
  {
    "id": "seat-uuid-1",
    "examSessionId": "session-uuid-1",
    "row": 1,
    "col": 1,
    "status": "Available",
    "createdAt": "2026-02-05T10:00:00Z",
    "updatedAt": "2026-02-05T10:00:00Z"
  },
  {
    "id": "seat-uuid-2",
    "examSessionId": "session-uuid-1",
    "row": 1,
    "col": 2,
    "status": "Locked",
    "createdAt": "2026-02-05T10:00:00Z",
    "updatedAt": "2026-02-05T11:00:00Z"
  }
]
```

---

### 2. Get Exam Seats by Session
**Purpose**: Retrieve all seats for a specific exam session with optional status filter

| Property | Value |
|----------|-------|
| **Location** | `apps/app_api/src/features/exam-seats/use-cases/get-exam-seats-by-session/` |
| **Method** | `GET` |
| **URL** | `{{base_url}}/api/exam-seats/session/{sessionId}?status={status}` |
| **Auth** | Bearer Token (Required) |

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sessionId` | UUID | Yes | Exam session ID |

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | String | No | Filter by seat status: `Available`, `Locked`, `Assigned`, `Present`, `Absent` |

**Request Headers**:
```
Authorization: Bearer {{accessToken}}
```

**Example URLs**:
```
GET {{base_url}}/api/exam-seats/session/session-uuid-1
GET {{base_url}}/api/exam-seats/session/session-uuid-1?status=Available
GET {{base_url}}/api/exam-seats/session/session-uuid-1?status=Locked
```

**Response** (200 OK):
```json
[
  {
    "id": "seat-uuid-1",
    "examSessionId": "session-uuid-1",
    "row": 1,
    "col": 1,
    "status": "Available",
    "createdAt": "2026-02-05T10:00:00Z",
    "updatedAt": "2026-02-05T10:00:00Z"
  },
  {
    "id": "seat-uuid-2",
    "examSessionId": "session-uuid-1",
    "row": 1,
    "col": 2,
    "status": "Available",
    "createdAt": "2026-02-05T10:00:00Z",
    "updatedAt": "2026-02-05T10:00:00Z"
  }
]
```

**Error Response** (404 Not Found):
```json
{
  "statusCode": 404,
  "message": "Exam session with ID session-uuid-1 not found"
}
```

---

### 3. Change Seat Status (Lock/Unlock, Check-in, No-show)
**Purpose**: Update physical seat status based on role rules

| Property | Value |
|----------|-------|
| **Location** | `apps/app_api/src/features/exam-seats/use-cases/change-seat-status/` |
| **Method** | `PATCH` |
| **URL** | `{{base_url}}/api/exam-seats/{id}/status` |
| **Auth** | Bearer Token (Required) |

**Request Headers**:
```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Request Body** (JSON):
```json
{
  "status": "Locked"
}
```

**Status Options**:
- `Available` - Seat is open
- `Locked` - Seat locked by exam officer
- `Assigned` - Student imported, awaiting check-in
- `Present` - Student checked in
- `Absent` - Student no-show

**Role Rules**:
- **EXAM_OFFICER**: `Available` ↔ `Locked` only (pre-import)
- **PROCTOR**: `Assigned` → `Present`, `Present` → `Absent`

**Response** (200 OK):
```json
{
  "id": "seat-id-1",
  "examSessionId": "session-id-1",
  "row": 1,
  "col": 3,
  "status": "Locked",
  "createdAt": "2026-02-05T10:00:00.000Z",
  "updatedAt": "2026-02-05T10:05:00.000Z"
}
```

**Error Responses**:
- `403 Forbidden` if layout is locked after import (`hasStudentsImported = true`)
- `403 Forbidden` for invalid role transition

---

## � Student Exams APIs

### 1. List All Student Exams
**Purpose**: Get paginated list of student exam registrations

| Property | Value |
|----------|-------|
| **Location** | `apps/app_api/src/features/student-exams/use-cases/list-student-exams/` |
| **Method** | `GET` |
| **URL** | `{{base_url}}/api/student-exams` |
| **Auth** | Bearer Token (Required) - Admin/Exam Officer/Proctor only |

**Query Parameters**:
```
?page=1&limit=10&examSessionId=xxx&studentId=xxx&status=CHECKEDIN
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page |
| `examSessionId` | string | Filter by exam session ID |
| `studentId` | string | Filter by student ID |
| `status` | string | Filter by status (REGISTERED, CHECKEDIN, CHECKEDOUT, MOVED, REMOVED) |

**Request Headers**:
```
Authorization: Bearer {{accessToken}}
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "student-exam-id-1",
      "examSessionId": "session-id-1",
      "studentId": "student-id-1",
      "seatNumber": 12,
      "status": "CHECKEDIN",
      "currentLocation": "Room A1",
      "identityId": "identity-id-1",
      "isMatched": true,
      "checkinTime": "2026-01-20T08:00:00.000Z",
      "checkoutTime": null,
      "isValid": true,
      "createdAt": "2026-01-14T10:00:00.000Z",
      "updatedAt": "2026-01-20T08:00:00.000Z"
    }
  ],
  "total": 6,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

---

### 2. Create Student Exam
**Purpose**: Register a student for an exam session

| Property | Value |
|----------|-------|
| **Location** | `apps/app_api/src/features/student-exams/use-cases/create-student-exam/` |
| **Method** | `POST` |
| **URL** | `{{base_url}}/api/student-exams` |
| **Auth** | Bearer Token (Required) - Admin/Exam Officer only |

**Request Headers**:
```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Request Body** (JSON):
```json
{
  "examSessionId": "session-id-123",
  "studentId": "student-id-456",
  "seatNumber": 15,
  "status": "REGISTERED",
  "currentLocation": null,
  "isMatched": false,
  "isValid": true
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `examSessionId` | string (UUID) | Yes | ID of exam session |
| `studentId` | string (UUID) | Yes | ID of student user |
| `seatNumber` | number | No | Assigned seat number |
| `status` | string | No | Default: "REGISTERED" |
| `currentLocation` | string | No | Current location (e.g., "Room A1", "IT Helpdesk") |
| `identityId` | string (UUID) | No | Identity verification record |
| `isMatched` | boolean | No | Identity match status (default: false) |
| `checkinTime` | ISO 8601 DateTime | No | Check-in timestamp |
| `checkoutTime` | ISO 8601 DateTime | No | Check-out timestamp |
| `isValid` | boolean | No | Validity status (default: true) |

**Status Options**:
- `REGISTERED` - Student registered for exam
- `CHECKEDIN` - Student checked in
- `CHECKEDOUT` - Student checked out
- `MOVED` - Student moved to different location
- `REMOVED` - Student removed from exam

**Response** (201 Created):
```json
{
  "id": "student-exam-id-new",
  "examSessionId": "session-id-123",
  "studentId": "student-id-456",
  "seatNumber": 15,
  "status": "REGISTERED",
  "currentLocation": null,
  "identityId": null,
  "isMatched": false,
  "checkinTime": null,
  "checkoutTime": null,
  "isValid": true,
  "createdAt": "2026-01-14T14:30:00.000Z",
  "updatedAt": "2026-01-14T14:30:00.000Z"
}
```

**Error Response** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": "Student is already registered for this exam session",
  "error": "Bad Request"
}
```

---

### 3. Get Single Student Exam
**Purpose**: Get details of a specific student exam registration

| Property | Value |
|----------|-------|
| **Location** | `apps/app_api/src/features/student-exams/use-cases/get-student-exam/` |
| **Method** | `GET` |
| **URL** | `{{base_url}}/api/student-exams/{id}` |
| **Auth** | Bearer Token (Required) - Admin/Exam Officer/Proctor only |

**Request Headers**:
```
Authorization: Bearer {{accessToken}}
```

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string (UUID) | Student exam ID from list response |

**Example URL**:
```
GET {{base_url}}/api/student-exams/550e8400-e29b-41d4-a716-446655440000
```

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "examSessionId": "session-id-1",
  "studentId": "student-id-1",
  "seatNumber": 12,
  "status": "CHECKEDIN",
  "currentLocation": "Room A1",
  "identityId": "identity-id-1",
  "isMatched": true,
  "checkinTime": "2026-01-20T08:00:00.000Z",
  "checkoutTime": null,
  "isValid": true,
  "createdAt": "2026-01-14T10:00:00.000Z",
  "updatedAt": "2026-01-20T08:00:00.000Z"
}
```

---

### 4. Update Student Exam
**Purpose**: Update student exam details (check-in, check-out, location, etc.)

| Property | Value |
|----------|-------|
| **Location** | `apps/app_api/src/features/student-exams/use-cases/update-student-exam/` |
| **Method** | `PUT` |
| **URL** | `{{base_url}}/api/student-exams/{id}` |
| **Auth** | Bearer Token (Required) - Admin/Exam Officer/Proctor only |

**Request Headers**:
```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Request Body** (JSON):
```json
{
  "status": "CHECKEDIN",
  "checkinTime": "2026-01-20T08:05:00.000Z",
  "currentLocation": "Room A1",
  "seatNumber": 12,
  "isMatched": true
}
```

**Common Update Scenarios**:

**1. Check-in Student**:
```json
{
  "status": "CHECKEDIN",
  "checkinTime": "2026-01-20T08:00:00.000Z",
  "currentLocation": "Room A1"
}
```

**2. Check-out Student**:
```json
{
  "status": "CHECKEDOUT",
  "checkoutTime": "2026-01-20T10:00:00.000Z"
}
```

**3. Move Student Location**:
```json
{
  "status": "MOVED",
  "currentLocation": "IT Helpdesk"
}
```

**4. Verify Identity**:
```json
{
  "identityId": "identity-id-123",
  "isMatched": true
}
```

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "examSessionId": "session-id-1",
  "studentId": "student-id-1",
  "seatNumber": 12,
  "status": "CHECKEDIN",
  "currentLocation": "Room A1",
  "identityId": null,
  "isMatched": true,
  "checkinTime": "2026-01-20T08:05:00.000Z",
  "checkoutTime": null,
  "isValid": true,
  "createdAt": "2026-01-14T10:00:00.000Z",
  "updatedAt": "2026-01-20T08:05:00.000Z"
}
```

---

### 5. Delete Student Exam
**Purpose**: Remove a student from an exam session

| Property | Value |
|----------|-------|
| **Location** | `apps/app_api/src/features/student-exams/use-cases/delete-student-exam/` |
| **Method** | `DELETE` |
| **URL** | `{{base_url}}/api/student-exams/{id}` |
| **Auth** | Bearer Token (Required) - Admin/Exam Officer only |

**Request Headers**:
```
Authorization: Bearer {{accessToken}}
```

**Response** (204 No Content):
```
(Empty response body)
```

---

## �👥 Users APIs

### 1. List All Users
**Purpose**: Get paginated list of all users

| Property | Value |
|----------|-------|
| **Location** | `apps/app_api/src/features/users/use-cases/list-users/` |
| **Method** | `GET` |
| **URL** | `{{base_url}}/api/users` |
| **Auth** | Bearer Token (Required) - Admin/Exam Officer only |

**Query Parameters**:
```
?page=1&limit=10&role=STUDENT&search=name
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page |
| `role` | string | Filter by role (ADMIN, EXAM_OFFICER, PROCTOR, HALL_INVIGILATOR, STUDENT) |
| `isActive` | boolean | Filter by active status |
| `search` | string | Search by name, email, or code |

**Request Headers**:
```
Authorization: Bearer {{accessToken}}
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "user-id-1",
      "email": "student1@exam.com",
      "fullName": "Student One",
      "identityCode": "SE001",
      "role": "STUDENT",
      "isActive": true,
      "createdAt": "2026-01-14T10:00:00.000Z",
      "updatedAt": "2026-01-14T10:00:00.000Z"
    }
  ],
  "total": 4,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

---

### 2. Create User
**Purpose**: Create a new user account

| Property | Value |
|----------|-------|
| **Location** | `apps/app_api/src/features/users/use-cases/create-user/` |
| **Method** | `POST` |
| **URL** | `{{base_url}}/api/users` |
| **Auth** | Bearer Token (Required) - Admin only |

**Request Headers**:
```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Request Body** (JSON):
```json
{
  "email": "newstudent@exam.com",
  "identityCode": "SE005",
  "fullName": "New Student",
  "role": "STUDENT"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `email` | string | Yes | Valid email format |
| `identityCode` | string | Yes | Unique identifier |
| `fullName` | string | Yes | Full name |
| `role` | string | Yes | User role |

**Available Roles**:
- `ADMIN` - System administrator
- `EXAM_OFFICER` - Exam management staff
- `PROCTOR` - Exam proctor
- `HALL_INVIGILATOR` - Hall invigilator
- `STUDENT` - Student user

**Response** (201 Created):
```json
{
  "id": "user-id-new",
  "email": "newstudent@exam.com",
  "identityCode": "SE005",
  "fullName": "New Student",
  "role": "STUDENT",
  "isActive": true,
  "createdAt": "2026-01-14T14:30:00.000Z",
  "updatedAt": "2026-01-14T14:30:00.000Z"
}
```

---

### 3. Get Single User
**Purpose**: Get details of a specific user

| Property | Value |
|----------|-------|
| **Location** | `apps/app_api/src/features/users/use-cases/get-user/` |
| **Method** | `GET` |
| **URL** | `{{base_url}}/api/users/{id}` |
| **Auth** | Bearer Token (Required) |

**Request Headers**:
```
Authorization: Bearer {{accessToken}}
```

**Response** (200 OK):
```json
{
  "id": "user-id-1",
  "email": "student1@exam.com",
  "fullName": "Student One",
  "identityCode": "SE001",
  "role": "STUDENT",
  "isActive": true,
  "createdAt": "2026-01-14T10:00:00.000Z",
  "updatedAt": "2026-01-14T10:00:00.000Z"
}
```

---

### 4. Update User
**Purpose**: Update user details

| Property | Value |
|----------|-------|
| **Location** | `apps/app_api/src/features/users/use-cases/update-user/` |
| **Method** | `PUT` |
| **URL** | `{{base_url}}/api/users/{id}` |
| **Auth** | Bearer Token (Required) - Admin or own user only |

**Request Headers**:
```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Request Body** (JSON):
```json
{
  "fullName": "Updated Student Name",
  "phoneNumber": "+84912345678"
}
```

**Response** (200 OK):
```json
{
  "id": "user-id-1",
  "email": "student1@exam.com",
  "fullName": "Updated Student Name",
  "identityCode": "SE001",
  "role": "STUDENT",
  "phoneNumber": "+84912345678",
  "isActive": true,
  "createdAt": "2026-01-14T10:00:00.000Z",
  "updatedAt": "2026-01-14T14:35:00.000Z"
}
```

---

### 5. Delete User
**Purpose**: Delete a user account

| Property | Value |
|----------|-------|
| **Location** | `apps/app_api/src/features/users/use-cases/delete-user/` |
| **Method** | `DELETE` |
| **URL** | `{{base_url}}/api/users/{id}` |
| **Auth** | Bearer Token (Required) - Admin only |

**Request Headers**:
```
Authorization: Bearer {{accessToken}}
```

**Response** (204 No Content):
```
(Empty response body)
```

---

### 6. Change User Role
**Purpose**: Change a user's role

| Property | Value |
|----------|-------|
| **Location** | `apps/app_api/src/features/users/use-cases/change-role/` |
| **Method** | `PATCH` |
| **URL** | `{{base_url}}/api/users/{id}/role` |
| **Auth** | Bearer Token (Required) - Admin only |

**Request Headers**:
```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Request Body** (JSON):
```json
{
  "role": "EXAM_OFFICER"
}
```

**Response** (200 OK):
```json
{
  "id": "user-id-1",
  "email": "student1@exam.com",
  "fullName": "Student One",
  "identityCode": "SE001",
  "role": "EXAM_OFFICER",
  "isActive": true,
  "createdAt": "2026-01-14T10:00:00.000Z",
  "updatedAt": "2026-01-14T14:40:00.000Z"
}
```

---

### 7. Import Students from Excel
**Purpose**: Bulk import student users from Excel file

| Property | Value |
|----------|-------|
| **Location** | `apps/app_api/src/features/users/use-cases/import-student/` |
| **Method** | `POST` |
| **URL** | `{{base_url}}/api/users/import` |
| **Auth** | Bearer Token (Required) - Admin only |

**Request Headers**:
```
Authorization: Bearer {{accessToken}}
Content-Type: multipart/form-data
```

**Form Data**:
| Field | Type | Required |
|-------|------|----------|
| `file` | File | Yes |

**Excel File Format**:
| Column A | Column B | Column C | Column D |
|----------|----------|----------|----------|
| email | identityCode | fullName | role |
| student1@exam.com | SE001 | Student One | STUDENT |
| student2@exam.com | SE002 | Student Two | STUDENT |

**Response** (200 OK):
```json
{
  "imported": 2,
  "failed": 0,
  "errors": []
}
```

---

## 🧪 Testing Workflow

### Complete Example: Create and Test Exam Room

**Step 1: Get Admin Token**
```
POST http://localhost:3001/api/auth/test-token
Body: { "role": "ADMIN", "userId": "admin-id-123" }
Response: { "accessToken": "eyJhbGciOi...", ... }
```

**Step 2: Create Exam Room**
```
POST http://localhost:3001/api/exam-rooms
Authorization: Bearer eyJhbGciOi...
Body: { "roomNumber": "R-301", "capacity": 35, "status": "Available" }
Response: { "id": "room-id-123", "roomNumber": "R-301", ... }
```

**Step 3: List Exam Rooms**
```
GET http://localhost:3001/api/exam-rooms?page=1&limit=10
Authorization: Bearer eyJhbGciOi...
Response: { "data": [...], "total": 5, ... }
```

**Step 4: Get Single Room**
```
GET http://localhost:3001/api/exam-rooms/room-id-123
Authorization: Bearer eyJhbGciOi...
Response: { "id": "room-id-123", "roomNumber": "R-301", ... }
```

**Step 5: Update Room**
```
PUT http://localhost:3001/api/exam-rooms/room-id-123
Authorization: Bearer eyJhbGciOi...
Body: { "status": "Maintenance", "capacity": 40 }
Response: { "id": "room-id-123", "status": "Maintenance", ... }
```

### Quick Seat Lock/Unlock Test
**Step 6: List All Seats**
```
GET http://localhost:3001/api/exam-seats
Authorization: Bearer {{adminToken}}
Response: [{ "id": "seat-uuid-1", "examSessionId": "session-uuid-1", "row": 1, "col": 1, "status": "Available" }, ...]
```

**Step 7: List Seats by Session**
```
GET http://localhost:3001/api/exam-seats/session/session-uuid-1?status=Available
Authorization: Bearer {{adminToken}}
Response: [{ "id": "seat-uuid-1", "examSessionId": "session-uuid-1", "row": 1, "col": 1, "status": "Available" }, ...]
```

**Step 8: Get Exam Officer Token**
```
POST http://localhost:3001/api/auth/test-token
Body: { "role": "EXAM_OFFICER", "userId": "exam-officer-id-123" }
```

**Step 9: Lock a Seat (Available → Locked)**
```
PATCH http://localhost:3001/api/exam-seats/{seatId}/status
Authorization: Bearer {{accessToken}}
Body: { "status": "Locked" }
```

**Step 10: Unlock a Seat (Locked → Available)**
```
PATCH http://localhost:3001/api/exam-seats/{seatId}/status
Authorization: Bearer {{accessToken}}
Body: { "status": "Available" }
```

**Step 11: Proctor Check-in (Assigned → Present)**
```
POST http://localhost:3001/api/auth/test-token
Body: { "role": "PROCTOR", "userId": "proctor-id-123" }

PATCH http://localhost:3001/api/exam-seats/{seatId}/status
Authorization: Bearer {{accessToken}}
Body: { "status": "Present" }
```

---

## 🔧 Common Issues & Solutions

### Issue 1: "Unauthorized" Error
**Symptoms**: `401 Unauthorized` or `403 Forbidden` response

**Cause**: Invalid or missing JWT token

**Solution**:
1. Get a fresh token from `/api/auth/test-token`
2. Copy the `accessToken` from response
3. Add to Authorization header: `Bearer {accessToken}`
4. Check token hasn't expired (tokens expire in 1 hour)

---

### Issue 2: "Email must end with @fpt.edu.vn" Error
**Symptoms**: `400 Bad Request` when creating user with test email

**Cause**: Email domain validation is enabled

**Solution**: The validation has been disabled for development. If error persists:
1. Ensure you're running the latest code
2. Restart the API server: `npm run start:dev:api`
3. Use valid emails for production

---

### Issue 3: Token Not Saving in Postman
**Symptoms**: `{{accessToken}}` variable is empty in subsequent requests

**Solution**:
1. Add test script to token endpoint:
```javascript
var jsonData = pm.response.json();
if (jsonData.accessToken) {
    pm.environment.set("accessToken", jsonData.accessToken);
}
```
2. Click **Send**
3. Check **Environment** tab - `accessToken` should be populated

---

### Issue 4: CORS or Connection Error
**Symptoms**: `ERR_EMPTY_RESPONSE` or network error

**Solution**:
1. Verify API is running: `npm run start:dev:api`
2. Check correct URL: `http://localhost:3001` (not 3000)
3. Restart API if needed
4. Check Redis is running: `C:\Redis\redis-server.exe`

---

### Issue 5: "Role not found" or Authorization Error
**Symptoms**: Cannot access endpoint even with valid token

**Cause**: User role doesn't have permission

**Solution**:
1. For admin endpoints, use `role: "ADMIN"` in test-token request
2. For exam officer, use `role: "EXAM_OFFICER"`
3. Check endpoint requirements in this guide

---

## 📝 Notes

- **All timestamps** are in ISO 8601 format (UTC)
- **All IDs** are UUIDs (strings)
- **All requests** require `Content-Type: application/json` header (except file uploads)
- **All paginated responses** include `total`, `page`, `limit`, `totalPages`
- **Database seed data** creates initial test users and rooms for testing

---

## 🚀 Quick Reference Table

| Feature | Method | URL | Auth Required | Role Required |
|---------|--------|-----|----------------|---------------|
| Get Token | POST | `/api/auth/test-token` | No | - |
| Get Profile | GET | `/api/users/me` | Yes | Any |
| List Rooms | GET | `/api/exam-rooms` | Yes | Any |
| Create Room | POST | `/api/exam-rooms` | Yes | ADMIN, EXAM_OFFICER |
| Update Room | PUT | `/api/exam-rooms/{id}` | Yes | ADMIN, EXAM_OFFICER |
| Delete Room | DELETE | `/api/exam-rooms/{id}` | Yes | ADMIN |
| List Sessions | GET | `/api/exam-sessions` | Yes | Any |
| Create Session | POST | `/api/exam-sessions` | Yes | ADMIN, EXAM_OFFICER |
| Update Session | PUT | `/api/exam-sessions/{id}` | Yes | ADMIN, EXAM_OFFICER |
| Delete Session | DELETE | `/api/exam-sessions/{id}` | Yes | ADMIN |
| Get All Seats | GET | `/api/exam-seats` | Yes | Any |
| Get Seats by Session | GET | `/api/exam-seats/session/{id}` | Yes | Any |
| Change Seat Status | PATCH | `/api/exam-seats/{id}/status` | Yes | EXAM_OFFICER, PROCTOR |
| List Users | GET | `/api/users` | Yes | ADMIN, EXAM_OFFICER |
| Create User | POST | `/api/users` | Yes | ADMIN |
| Update User | PUT | `/api/users/{id}` | Yes | ADMIN, Self |
| Delete User | DELETE | `/api/users/{id}` | Yes | ADMIN |
| Change Role | PATCH | `/api/users/{id}/role` | Yes | ADMIN |

---

## 📚 Additional Resources

- **Postman Collection**: `Capstone_API_Postman_Collection.json` (in root directory)
- **API Documentation**: Run API and visit `http://localhost:3001/api` for Swagger UI
- **Database Seed**: Pre-loaded with test data from `prisma/seed.ts`

**Last Updated**: February 5, 2026
