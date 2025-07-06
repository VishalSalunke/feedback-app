const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../app');
const User = require('../models/User');
const Form = require('../models/Form');
const Feedback = require('../models/Feedback');

// Clear database before tests
beforeEach(async () => {
  await mongoose.connection.db.dropDatabase();
});

describe('Feedback API', () => {
  let token;
  let formId;
  let questionId1;
  let questionId2;

  // Create test user and form before tests
  beforeAll(async () => {
    // Create admin user
    const user = new User({
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin'
    });
    await user.save();

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123'
      });
    token = loginResponse.body.token;

    // Create test form
    const form = new Form({
      title: 'Test Form',
      questions: [
        {
          text: 'How satisfied are you?',
          type: 'vote'
        },
        {
          text: 'What do you think about our service?',
          type: 'text'
        }
      ]
    });
    const savedForm = await form.save();
    formId = savedForm._id;
    questionId1 = savedForm.questions[0]._id;
    questionId2 = savedForm.questions[1]._id;
  });

  // Cleanup after tests
  afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
  });

  describe('POST /feedback', () => {
    it('should submit feedback successfully', async () => {
      const response = await request(app)
        .post('/api/feedback')
        .send({
          formId,
          answers: [
            {
              questionId: questionId1,
              type: 'vote',
              vote: true
            },
            {
              questionId: questionId2,
              type: 'text',
              text: 'Great service! Everything worked smoothly.'
            }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Feedback submitted successfully');
      expect(response.body.feedback).toHaveProperty('id');
      expect(response.body.feedback).toHaveProperty('formId', formId);
      expect(response.body.feedback.answers).toHaveLength(2);
      expect(response.body.feedback.overallSentiment).toBe('Positive');
    });

    it('should return 400 for invalid formId', async () => {
      const response = await request(app)
        .post('/api/feedback')
        .send({
          formId: 'invalid-id',
          answers: [
            {
              questionId: questionId1,
              type: 'vote',
              vote: true
            }
          ]
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Form not found');
    });

    it('should return 400 for mismatched answer types', async () => {
      const response = await request(app)
        .post('/api/feedback')
        .send({
          formId,
          answers: [
            {
              questionId: questionId2, // This is a text question
              type: 'vote',
              vote: true
            }
          ]
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Answer type does not match question type');
    });
  });

  describe('GET /feedbacks', () => {
    it('should return all feedbacks for admin', async () => {
      // Submit a feedback first
      await request(app)
        .post('/api/feedback')
        .send({
          formId,
          answers: [
            {
              questionId: questionId1,
              type: 'vote',
              vote: true
            },
            {
              questionId: questionId2,
              type: 'text',
              text: 'Great service! Everything worked smoothly.'
            }
          ]
        });

      const response = await request(app)
        .get('/api/feedback/feedbacks')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('formId.title', 'Test Form');
      expect(response.body[0].answers).toHaveLength(2);
      expect(response.body[0].overallSentiment).toBe('Positive');
    });

    it('should return 401 for non-admin users', async () => {
      // Create non-admin user
      const user = new User({
        email: 'user@test.com',
        password: 'password123',
        role: 'user'
      });
      await user.save();

      // Login as non-admin user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com',
          password: 'password123'
        });
      const nonAdminToken = loginResponse.body.token;

      const response = await request(app)
        .get('/api/feedback/feedbacks')
        .set('Authorization', `Bearer ${nonAdminToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Admin access required');
    });
  });
});
