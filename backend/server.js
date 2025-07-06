require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const protectedRoutes = require('./routes/protected');
const formsRoutes = require('./routes/forms');
const feedbackRoutes = require('./routes/feedback');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', protectedRoutes);
app.use('/api/forms', formsRoutes);
app.use('/api/feedback', feedbackRoutes);

// Simple health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Only start the server if this file is run directly (not when imported for tests)
if (require.main === module) {
  // MongoDB Connection
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

  const PORT = process.env.PORT || 3000;
  const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
  
  // Handle server close gracefully
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
    });
  });
}

module.exports = app; // Export for testing
