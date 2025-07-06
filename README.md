# Feedback Collection Platform

A full-stack application for creating feedback forms and collecting responses. Built with React, Node.js, Express, and MongoDB.

## 🌟 Features

- **User Authentication**

  - Secure JWT-based authentication
  - Role-based access control (Admin/User)
  - Password hashing with bcrypt

- **Form Management**

  - Create custom feedback forms
  - Multiple question types support
  - Form sharing via unique URLs

- **Feedback Collection**

  - Real-time response tracking
  - Response analytics and statistics
  - Export responses (CSV/Excel)

- **Responsive Design**
  - Mobile-friendly interface
  - Modern UI with Tailwind CSS
  - Dark/Light mode support

## 🏗️ Project Structure

```
.
├── backend/                   # Backend server (Node.js/Express)
│   ├── config/               # Configuration files
│   ├── controllers/          # Route controllers
│   ├── middleware/           # Custom middleware
│   ├── models/               # MongoDB models
│   ├── routes/               # API routes
│   ├── .env.example          # Example env variables
│   ├── server.js             # Express server
│   └── package.json
│
├── frontend/                 # Frontend (Vite + React)
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   └── App.jsx           # Main app component
│   ├── .env.example          # Frontend env example
│   └── package.json
│
├── docker-compose.yml        # Docker Compose config
└── README.md                # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm/yarn
- MongoDB (local or Atlas)
- Git

### Local Development

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/feedback-app.git
   cd feedback-app
   ```

2. **Set up backend**

   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   npm install
   npm run dev
   ```

3. **Set up frontend**

   ```bash
   cd ../frontend
   cp .env.example .env
   # Edit .env with your API URL
   npm install
   npm run dev
   ```

4. **Access the app**
   - Frontend: http://localhost:5000
   - Backend API: http://localhost:3030
   - API Docs: http://localhost:3030/api-docs

## 🐳 Docker Setup

1. **Using Docker Compose (Recommended)**

   ```bash
   # Start all services
   docker-compose up --build

   # Access the app at http://localhost:5000
   ```

2. **Environment Variables**
   - Copy and configure the example environment files:
     ```bash
     cp backend/.env.example backend/.env
     cp frontend/.env.example frontend/.env
     ```
   - Update the following variables in `backend/.env`:
     ```env
     NODE_ENV=development
     PORT=3030
     MONGO_URI=mongodb://mongo:27017/feedback
     JWT_SECRET=your_secure_jwt_secret
     JWT_EXPIRE=30d
     ```
   - Update frontend variables in `frontend/.env`:
     ```env
     VITE_API_BASE_URL=http://localhost:3030/api
     ```

## 🚀 Deployment

### Backend (Render.com)

1. Push your code to a GitHub repository
2. Create a new Web Service on Render
3. Connect your GitHub repository
4. Configure build settings:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     ```
     NODE_ENV=production
     PORT=10000
     MONGO_URI=your_mongodb_atlas_uri
     JWT_SECRET=your_secure_jwt_secret
     JWT_EXPIRE=30d
     ```

### Frontend (Vercel)

1. Push your code to a GitHub repository
2. Import the project in Vercel
3. Configure settings:
   - **Framework Preset**: Vite
   - **Root Directory**: frontend
   - **Build Command**: `npm run build`
   - **Output Directory**: dist
   - **Environment Variables**:
     ```
     VITE_API_BASE_URL=your_backend_url
     ```

## 🛠 Development

### Available Scripts

**Backend**

```bash
# Development mode with hot-reload
npm run dev

# Run tests
npm test

# Production start
npm start
```

**Frontend**

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- Built with ❤️ using modern web technologies
- Inspired by popular form builders

### Backend

From the `backend` directory:

- `npm start` - Start the backend server
- `npm test` - Run tests

### Frontend

From the `frontend` directory:

- `npm start` - Start the development server
- `npm build` - Build for production
- `npm test` - Run tests
