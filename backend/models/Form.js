const mongoose = require('mongoose');
const { Schema } = mongoose;

// Question schema
const questionSchema = new Schema({
  text: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Question type is required'],
    enum: ['text', 'vote', 'rating'],
    message: 'Question type must be either text, vote, or rating'
  }
});

// Form schema
const formSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters long']
  },
  questions: {
    type: [questionSchema],
    required: [true, 'At least one question is required'],
    validate: {
      validator: function(v) {
        return v.length > 0;
      },
      message: 'At least one question is required'
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by user is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create model
const Form = mongoose.model('Form', formSchema);

module.exports = Form;
