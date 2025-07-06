# API Documentation

This document provides detailed information about the API endpoints available in the Node.js Express backend with MongoDB and JWT authentication.

## Base URL
All API endpoints are relative to the base URL:
```
http://localhost:3000/api
```

## Authentication
This API uses JWT (JSON Web Tokens) for authentication. Include the JWT token in the `Authorization` header for protected routes.

### Important Note
All POST and PUT requests must include the following header:
```
Content-Type: application/json
```

Without this header, the server will not be able to parse the request body, and you'll receive errors.

## API Endpoints

### 1. User Registration
Register a new admin user.

- **URL**: `/auth/signup`
- **Method**: `POST`
- **Authentication**: Not required
- **Request Body**:
  ```json
  {
    "email": "admin@example.com",
    "password": "yourpassword123"
  }
  ```
- **Success Response**:
  - **Code**: 201 Created
  - **Content**:
    ```json
    {
      "message": "User created successfully",
      "token": "jwt.token.here",
      "user": {
        "id": "user_id_here",
        "email": "admin@example.com",
        "role": "admin"
      }
    }
    ```
- **Error Responses**:
  - `400 Bad Request` - Email already registered
  - `500 Internal Server Error` - Server error

### 2. User Login
Authenticate a user and get a JWT token.

- **URL**: `/auth/login`
- **Method**: `POST`
- **Authentication**: Not required
- **Request Body**:
  ```json
  {
    "email": "admin@example.com",
    "password": "yourpassword123"
  }
  ```
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:
    ```json
    {
      "message": "Login successful",
      "token": "jwt.token.here",
      "user": {
        "id": "user_id_here",
        "email": "admin@example.com",
        "role": "admin"
      }
    }
    ```
- **Error Responses**:
  - `401 Unauthorized` - Invalid credentials
  - `500 Internal Server Error` - Server error

### 3. Get Protected Data (Example)
Example of a protected route that requires authentication.

- **URL**: `/protected-route`
- **Method**: `GET`
- **Authentication**: Required (JWT token in Authorization header)
- **Headers**:
  ```
  Authorization: Bearer your.jwt.token.here
  ```
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:
    ```json
    {
      "message": "Access granted",
      "user": {
        "id": "user_id_here",
        "email": "admin@example.com",
        "role": "admin"
      }
    }
    ```
- **Error Responses**:
  - `401 Unauthorized` - No token provided or invalid token
  - `403 Forbidden` - Token expired or invalid

## Error Responses
All error responses follow this format:
```json
{
  "message": "Error message describing the issue"
}
```

## Environment Variables
Make sure these environment variables are set in your `.env` file:
```
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

## Running the Server
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the server:
   ```bash
   npm start
   ```
3. For development with auto-reload:
   ```bash
   npm run dev
   ```

## Testing with Postman
1. Import the following collection into Postman:
   ```json
   {
     "info": {
       "name": "Auth API",
       "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
     },
     "item": [
       {
         "name": "Register User",
         "request": {
           "method": "POST",
           "header": [
             {
               "key": "Content-Type",
               "value": "application/json"
             }
           ],
           "body": {
             "mode": "raw",
             "raw": "{\n  \"email\": \"admin@example.com\",
  \"password\": \"yourpassword123\"
}"
           },
           "url": {
             "raw": "http://localhost:3000/api/auth/signup",
             "protocol": "http",
             "host": ["localhost"],
             "port": "3000",
             "path": ["api", "auth", "signup"]
           }
         }
       },
       {
         "name": "Login User",
         "request": {
           "method": "POST",
           "header": [
             {
               "key": "Content-Type",
               "value": "application/json"
             }
           ],
           "body": {
             "mode": "raw",
             "raw": "{\n  \"email\": \"admin@example.com\",
  \"password\": \"yourpassword123\"
}"
           },
           "url": {
             "raw": "http://localhost:3000/api/auth/login",
             "protocol": "http",
             "host": ["localhost"],
             "port": "3000",
             "path": ["api", "auth", "login"]
           }
         }
       },
       {
         "name": "Get Protected Data",
         "request": {
           "method": "GET",
           "header": [
             {
               "key": "Authorization",
               "value": "Bearer YOUR_JWT_TOKEN"
             }
           ],
           "url": {
             "raw": "http://localhost:3000/api/protected-route",
             "protocol": "http",
             "host": ["localhost"],
             "port": "3000",
             "path": ["api", "protected-route"]
           }
         }
       }
     ]
   }
   ```

## Testing Steps
1. Start the server
2. Use Postman to test the `/api/auth/signup` endpoint to create a new user
3. Use the `/api/auth/login` endpoint to get a JWT token
4. Use the token to access protected routes by including it in the `Authorization` header

## Notes
- All passwords are hashed using bcrypt before being stored in the database
- JWT tokens expire in 24 hours by default
- The API follows RESTful conventions

# Forms API

## POST /forms
- Creates a new feedback form (Admin only)
- Required fields:
  - title: string (min 3 chars)
  - questions: array of objects with:
    - text: string (required)
    - type: 'text' or 'vote' (required)
- Returns: Form object with id, title, questions, and createdAt
- Example request body:
```json
{
  "title": "User Feedback Survey",
  "questions": [
    {
      "text": "How satisfied are you with our service?",
      "type": "vote"
    },
    {
      "text": "What improvements would you suggest?",
      "type": "text"
    }
  ]
}
```

## GET /forms/:id
- Retrieves a feedback form by ID
- Public access
- Returns: Form object without sensitive fields
- Example response:
```json
{
  "_id": "form-id",
  "title": "User Feedback Survey",
  "questions": [
    {
      "text": "How satisfied are you with our service?",
      "type": "vote"
    },
    {
      "text": "What improvements would you suggest?",
      "type": "text"
    }
  ]
}
}

# Feedback API

## POST /feedback
- Submit feedback for a form (Public)
- Required fields:
  - formId: string (required)
  - answers: array of objects with:
    - questionId: string (required)
    - type: 'text' or 'vote' (required)
    - text: string (required if type is 'text')
    - vote: boolean (required if type is 'vote')
- Returns: Feedback object with id, formId, answers, createdAt, and overallSentiment
- Example request body:
```json
{
  "formId": "form-id",
  "answers": [
    {
      "questionId": "question-id-1",
      "type": "vote",
      "vote": true
    },
    {
      "questionId": "question-id-2",
      "type": "text",
      "text": "Great service! Everything worked smoothly."
    }
  ]
}
```
- Example response:
```json
{
  "message": "Feedback submitted successfully",
  "feedback": {
    "id": "feedback-id",
    "formId": "form-id",
    "answers": [
      {
        "questionId": "question-id-1",
        "type": "vote",
        "vote": true
      },
      {
        "questionId": "question-id-2",
        "type": "text",
        "text": "Great service! Everything worked smoothly.",
        "sentiment": "Positive"
      }
    ],
    "createdAt": "2025-07-03T14:30:00.000Z",
    "overallSentiment": "Positive"
  }
}
```

## GET /feedbacks
- Retrieve all feedback submissions (Admin only)
- Returns: Array of feedback objects with form title
- Example response:
```json
[
  {
    "_id": "feedback-id",
    "formId": {
      "title": "User Feedback Survey"
    },
    "answers": [
      {
        "questionId": "question-id-1",
        "type": "vote",
        "vote": true
      },
      {
        "questionId": "question-id-2",
        "type": "text",
        "text": "Great service! Everything worked smoothly.",
        "sentiment": "Positive"
      }
    ],
    "createdAt": "2025-07-03T14:30:00.000Z",
    "overallSentiment": "Positive"
  }
]
