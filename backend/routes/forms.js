const express = require('express');
const router = express.Router();
const Form = require('../models/Form');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Middleware to validate form data
const validateForm = (req, res, next) => {
  const { title, questions } = req.body;
  
  // Validate title
  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    return res.status(400).json({ message: 'Invalid title' });
  }
  
  // Validate questions array
  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ message: 'At least one question is required' });
  }
  
  // Validate each question
  for (const question of questions) {
    if (!question.text || typeof question.text !== 'string') {
      return res.status(400).json({ message: 'Invalid question text' });
    }
    if (!question.type || !['text', 'vote', 'rating'].includes(question.type)) {
      return res.status(400).json({ message: 'Invalid question type' });
    }
  }
  
  next();
};

// Create new form (Admin only)
router.post('/', [auth, admin, validateForm], async (req, res) => {
  try {
    const form = new Form({
      title: req.body.title,
      questions: req.body.questions,
      createdBy: req.user.id
    });
    
    await form.save();
    res.status(201).json(form);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get form by ID (Public)
router.get('/:id', async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }
    res.json(form);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching form' });
  }
});

// Get all forms for admin (Admin only)
router.get('/', [auth, admin], async (req, res) => {
  try {
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get sorting parameters
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    // Build query
    const query = { createdBy: req.user.id };
    
    // Get total count for pagination
    const total = await Form.countDocuments(query);
    
    // Get paginated and sorted forms
    const forms = await Form.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('_id title questions createdAt')
      .lean();

    // Add question count to each form
    const formsWithCount = forms.map(form => ({
      ...form,
      questionCount: form.questions.length
    }));

    res.json({
      data: formsWithCount,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching forms:', error);
    res.status(500).json({ message: 'Error fetching forms', error: error.message });
  }
});

module.exports = router;
