# Feedback App Monorepo

This is a monorepo containing both frontend and backend code for the Feedback application.

## Project Structure

```
.
├── backend/           # Backend server code
├── frontend/          # Frontend application
├── .gitignore         # Git ignore rules
└── README.md          # This file
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies for both frontend and backend:
   ```bash
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

## Available Scripts

### Backend
From the `backend` directory:
- `npm start` - Start the backend server
- `npm test` - Run tests

### Frontend
From the `frontend` directory:
- `npm start` - Start the development server
- `npm build` - Build for production
- `npm test` - Run tests
