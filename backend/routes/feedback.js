const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const Form = require('../models/Form');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Middleware to validate feedback data
const validateFeedback = async (req, res, next) => {
  try {
    const { formId, answers } = req.body;
    
    // Validate formId
    if (!formId) {
      return res.status(400).json({ message: 'Form ID is required' });
    }
    
    // Validate answers
    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: 'At least one answer is required' });
    }
    
    // Check if form exists
    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }
    
    // Create a map of question IDs to their expected types for quick lookup
    const questionMap = new Map();
    form.questions.forEach(q => {
      questionMap.set(q._id.toString(), q);
    });
    
    // Validate each answer
    for (const answer of answers) {
      const question = questionMap.get(answer.questionId?.toString());
      
      // Check if question exists in the form
      if (!question) {
        return res.status(400).json({ 
          message: `Question with ID ${answer.questionId} not found in form` 
        });
      }

      // Validate answer type matches question type
      if (answer.type !== question.type) {
        return res.status(400).json({ 
          message: `Answer type (${answer.type}) does not match question type (${question.type})` 
        });
      }

      // Type-specific validation
      if (answer.type === 'text') {
        if (question.required && (!answer.text || answer.text.trim() === '')) {
          return res.status(400).json({ 
            message: `Text is required for question: ${question.text}` 
          });
        }
      } 
      else if (answer.type === 'vote') {
        if (answer.vote === undefined || answer.vote === null) {
          return res.status(400).json({ 
            message: 'Vote is required for vote questions' 
          });
        }
      } 
      else if (answer.type === 'rating') {
        if (question.required && (answer.rating === undefined || answer.rating === null)) {
          return res.status(400).json({ 
            message: 'Rating is required for rating questions' 
          });
        }
        if (answer.rating !== undefined && answer.rating !== null && 
            (!Number.isInteger(answer.rating) || answer.rating < 1 || answer.rating > 5)) {
          return res.status(400).json({ 
            message: 'Rating must be an integer between 1 and 5' 
          });
        }
      }
    }

    // Attach form data to request for use in the route handler
    req.form = form;
    next();
  } catch (err) {
    console.error('Error validating feedback:', err);
    res.status(500).json({ message: 'Server error during validation' });
  }
};

// Submit feedback (Public)
router.post('/', validateFeedback, async (req, res) => {
  try {
    const { answers } = req.body;
    const form = req.form;

    // Prepare answers with question text and proper formatting
    const formattedAnswers = answers.map(answer => {
      const question = form.questions.find(q => 
        q._id.toString() === answer.questionId.toString()
      );
      
      const formattedAnswer = {
        questionId: answer.questionId,
        questionText: question?.text || 'Unknown Question',
        type: answer.type
      };

      // Set the appropriate field based on answer type
      if (answer.type === 'text') {
        formattedAnswer.text = answer.text || '';
      } else if (answer.type === 'vote') {
        formattedAnswer.vote = answer.vote;
      } else if (answer.type === 'rating') {
        formattedAnswer.rating = answer.rating;
      }

      return formattedAnswer;
    });

    const feedback = new Feedback({
      formId: form._id,
      answers: formattedAnswers
    });
    
    await feedback.save();
    
    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback: {
        id: feedback._id,
        formId: feedback.formId,
        answers: feedback.answers.map(a => ({
          questionId: a.questionId,
          questionText: a.questionText,
          type: a.type,
          text: a.text,
          vote: a.vote,
          rating: a.rating,
          sentiment: a.sentiment
        })),
        createdAt: feedback.createdAt,
        overallSentiment: feedback.overallSentiment
      }
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ 
        message: 'Validation error',
        errors: messages 
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Duplicate feedback submission detected' 
      });
    }
    
    res.status(500).json({ 
      message: 'Error submitting feedback',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all feedbacks with filtering and pagination (Admin only)
router.get('/feedbacks', [auth, admin], async (req, res) => {
  try {
    const { 
      formId, 
      startDate, 
      endDate, 
      sentiment,
      page = 1, 
      limit = 10 
    } = req.query;

    console.log('Fetching feedbacks with query:', {
      formId, startDate, endDate, sentiment, page, limit
    });

    // Build query
    const query = {};
    
    if (formId) {
      query.formId = formId;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // End of the day
        query.createdAt.$lte = end;
      }
    }
    
    if (sentiment) {
      query['answers.sentiment'] = sentiment;
    }

    // Execute query with pagination
    const feedbacks = await Feedback.find(query)
      .populate('formId', 'title')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Get total count for pagination
    const total = await Feedback.countDocuments(query);

    res.json({
      feedbacks,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalFeedback: total
    });
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    res.status(500).json({ 
      message: 'Error fetching feedbacks',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get feedback statistics (Admin only)
router.get('/stats', [auth, admin], async (req, res) => {
  try {
    const { formId, startDate, endDate } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.$lte = end;
    }
    
    // Build query
    const query = {};
    if (formId) query.formId = formId;
    if (startDate || endDate) query.createdAt = dateFilter;
    
    // Get all matching feedbacks
    const feedbacks = await Feedback.find(query).lean();
    
    // Calculate statistics
    const stats = {
      totalSubmissions: feedbacks.length,
      sentiment: {
        Positive: 0,
        Neutral: 0,
        Negative: 0
      },
      byQuestionType: {
        text: 0,
        vote: 0,
        rating: 0
      },
      ratingDistribution: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      },
      voteDistribution: {
        true: 0,
        false: 0
      },
      submissionsByDate: {}
    };
    
    // Process each feedback
    feedbacks.forEach(feedback => {
      // Track sentiment
      if (feedback.overallSentiment) {
        stats.sentiment[feedback.overallSentiment]++;
      }
      
      // Process answers
      feedback.answers.forEach(answer => {
        // Count by question type
        if (answer.type in stats.byQuestionType) {
          stats.byQuestionType[answer.type]++;
        }
        
        // Track rating distribution
        if (answer.type === 'rating' && answer.rating) {
          stats.ratingDistribution[answer.rating]++;
        }
        
        // Track vote distribution
        if (answer.type === 'vote' && answer.vote !== undefined) {
          stats.voteDistribution[answer.vote]++;
        }
      });
      
      // Track submissions by date
      if (feedback.createdAt) {
        const date = feedback.createdAt.toISOString().split('T')[0];
        stats.submissionsByDate[date] = (stats.submissionsByDate[date] || 0) + 1;
      }
    });
    
    // Calculate averages
    stats.averageRating = 0;
    const totalRatings = Object.values(stats.ratingDistribution).reduce((a, b) => a + b, 0);
    if (totalRatings > 0) {
      stats.averageRating = 
        (1 * stats.ratingDistribution[1] +
         2 * stats.ratingDistribution[2] +
         3 * stats.ratingDistribution[3] +
         4 * stats.ratingDistribution[4] +
         5 * stats.ratingDistribution[5]) / totalRatings;
    }
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching feedback statistics:', error);
    res.status(500).json({ 
      message: 'Error fetching feedback statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get feedback for a specific form (Admin only)
router.get('/form/:formId', [auth, admin], async (req, res) => {
  try {
    const { formId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const query = { formId };
    
    // Get total count for pagination
    const total = await Feedback.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    // Fetch feedbacks with pagination
    const feedbacks = await Feedback.find(query)

  // Log the first feedback item for debugging
  console.log('First feedback item structure:', feedbacks[0] ? {
    _id: feedbacks[0]._id,
    formId: feedbacks[0].formId,
    answers: feedbacks[0].answers?.map(a => ({
      questionId: a.questionId,
      questionText: a.questionText,
      type: a.type,
      text: a.text,
      vote: a.vote,
      rating: a.rating,
      sentiment: a.sentiment
    })),
    overallSentiment: feedbacks[0].overallSentiment,
    createdAt: feedbacks[0].createdAt
  } : 'No feedbacks found');

    res.json({
      success: true,
      data: feedbacks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching form feedback:', error);
    res.status(500).json({ 
      message: 'Error fetching form feedback',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get a single feedback by ID (Admin only)
router.get('/:id', [auth, admin], async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate('formId', 'title')
      .lean();
      
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    
    res.json(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ 
      message: 'Error fetching feedback',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete a feedback (Admin only)
router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    
    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ 
      message: 'Error deleting feedback',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
