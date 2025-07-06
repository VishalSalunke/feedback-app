const mongoose = require('mongoose');
const { Schema } = mongoose;

// Sentiment analysis keywords
const SENTIMENT_KEYWORDS = {
  positive: ['good', 'great', 'awesome', 'excellent', 'satisfied', 'happy', 'love'],
  negative: ['bad', 'poor', 'terrible', 'awful', 'dissatisfied', 'unhappy', 'hate']
};

// Analyze text sentiment
const analyzeSentiment = (text) => {
  if (!text || typeof text !== 'string') return 'Neutral';
  
  const words = text.toLowerCase().split(/\W+/);
  let sentimentScore = 0;
  
  // Check for positive and negative keywords
  words.forEach(word => {
    if (SENTIMENT_KEYWORDS.positive.includes(word)) {
      sentimentScore += 1;
    } else if (SENTIMENT_KEYWORDS.negative.includes(word)) {
      sentimentScore -= 1;
    }
  });
  
  if (sentimentScore > 0) return 'Positive';
  if (sentimentScore < 0) return 'Negative';
  return 'Neutral';
};

// Answer schema
const answerSchema = new Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Form',
    required: [true, 'Question ID is required']
  },
  questionText: {
    type: String,
    required: [true, 'Question text is required']
  },
  type: {
    type: String,
    enum: ['text', 'vote', 'rating'],
    required: [true, 'Answer type is required'],
    validate: {
      validator: function(v) {
        return ['text', 'vote', 'rating'].includes(v);
      },
      message: 'Invalid answer type. Must be one of: text, vote, rating'
    }
  },
  // For text answers
  text: {
    type: String,
    trim: true,
    required: function() {
      return this.type === 'text';
    },
    validate: {
      validator: function(v) {
        if (this.type !== 'text') return true;
        return v && v.trim().length > 0;
      },
      message: 'Text is required for text answers'
    }
  },
  // For boolean vote answers (thumbs up/down)
  vote: {
    type: Boolean,
    required: function() {
      return this.type === 'vote';
    }
  },
  // For numeric rating answers (1-5)
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: function() {
      return this.type === 'rating';
    },
    validate: {
      validator: function(v) {
        if (this.type !== 'rating') return true;
        return Number.isInteger(v) && v >= 1 && v <= 5;
      },
      message: 'Rating must be an integer between 1 and 5'
    }
  },
  sentiment: {
    type: String,
    enum: ['Positive', 'Negative', 'Neutral'],
    default: 'Neutral'
  }
}, { _id: false });

// Feedback schema
const feedbackSchema = new Schema({
  formId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Form',
    required: [true, 'Form ID is required']
  },
  answers: {
    type: [answerSchema],
    required: [true, 'At least one answer is required'],
    validate: {
      validator: function(v) {
        return v.length > 0;
      },
      message: 'At least one answer is required'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-save hook to analyze sentiment for text answers
feedbackSchema.pre('save', function(next) {
  this.answers.forEach(answer => {
    if (answer.type === 'text' && answer.text) {
      answer.sentiment = analyzeSentiment(answer.text);
    } else if (answer.type === 'rating') {
      // For ratings, map to sentiment (1-2: Negative, 3: Neutral, 4-5: Positive)
      if (answer.rating <= 2) {
        answer.sentiment = 'Negative';
      } else if (answer.rating >= 4) {
        answer.sentiment = 'Positive';
      } else {
        answer.sentiment = 'Neutral';
      }
    } else if (answer.type === 'vote') {
      // For votes, true is Positive, false is Negative
      answer.sentiment = answer.vote ? 'Positive' : 'Negative';
    }
  });
  next();
});

// Virtual to get overall sentiment
feedbackSchema.virtual('overallSentiment').get(function() {
  if (!this.answers || this.answers.length === 0) return 'Neutral';
  
  const sentimentCounts = {
    Positive: 0,
    Negative: 0,
    Neutral: 0
  };
  
  this.answers.forEach(answer => {
    if (answer.sentiment) {
      sentimentCounts[answer.sentiment]++;
    }
  });
  
  // If we have any answers with sentiment, return the most common one
  if (sentimentCounts.Positive + sentimentCounts.Negative + sentimentCounts.Neutral > 0) {
    const maxCount = Math.max(...Object.values(sentimentCounts));
    const sentimentsWithMax = Object.keys(sentimentCounts).filter(
      sentiment => sentimentCounts[sentiment] === maxCount
    );
    
    // In case of a tie, prefer Positive > Neutral > Negative
    if (sentimentsWithMax.includes('Positive')) return 'Positive';
    if (sentimentsWithMax.includes('Neutral')) return 'Neutral';
    return 'Negative';
  }
  
  return 'Neutral';
  
  return sentimentsWithMax.length > 1 ? 'Neutral' : sentimentsWithMax[0];
});

// Middleware to analyze sentiment for text answers
feedbackSchema.pre('save', function(next) {
  this.answers.forEach(answer => {
    if (answer.type === 'text' && answer.text) {
      answer.sentiment = analyzeSentiment(answer.text);
    }
  });
  next();
});

// Create model
const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;
