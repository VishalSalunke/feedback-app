const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');

// Test data
const testUser = {
  _id: 'test-user-id',
  email: 'test@example.com',
  password: 'hashed-password',
  role: 'admin'
};

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn((payload, secret, options) => {
    return `jwt-token-${payload.userId}`;
  }),
  verify: jest.fn((token, secret) => {
    return { userId: testUser._id, role: testUser.role };
  })
}));

// Mock the User model
jest.mock('../models/User', () => {
  const mockUserModel = function(data) {
    return {
      ...data,
      save: jest.fn().mockResolvedValue({
        ...data,
        toObject: () => ({
          _id: data._id || 'new-user-id',
          email: data.email,
          role: data.role || 'admin',
          password: undefined // Don't return password in toObject
        })
      }),
      comparePassword: jest.fn().mockResolvedValue(true)
    };
  };

  // Mock static methods
  mockUserModel.findOne = jest.fn();
  mockUserModel.findById = jest.fn();
  mockUserModel.create = jest.fn().mockImplementation((data) => {
    return Promise.resolve(mockUserModel(data));
  });
  mockUserModel.deleteMany = jest.fn().mockResolvedValue({});
  mockUserModel.select = jest.fn().mockReturnThis();
  
  return mockUserModel;
});

// Import the mocked User model
const User = require('../models/User');

// Setup default mocks
User.findOne.mockResolvedValue(null);
User.findById.mockResolvedValue(null);

// Mock environment variables
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '24h';

// Test token
let token;

// Test suite
describe('Auth endpoints', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup test token
    token = 'test-jwt-token';
    
    // Setup JWT mocks
    jwt.sign.mockReturnValue(token);
    jwt.verify.mockImplementation(() => ({
      userId: testUser._id,
      role: testUser.role
    }));
  });

  // Test signup
  describe('POST /api/auth/signup', () => {
    it('should create a new user', async () => {
      // Mock User.findOne to return null (user doesn't exist)
      User.findOne.mockResolvedValueOnce(null);
      
      // Create a mock user
      const newUser = new User({
        email: 'newuser@example.com',
        password: 'hashed-password',
        role: 'admin'
      });
      
      // Mock User.create
      User.create.mockResolvedValueOnce(newUser);
      
      // Mock JWT sign
      const mockToken = 'new-jwt-token';
      jwt.sign.mockReturnValueOnce(mockToken);

      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'newuser@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token', mockToken);
      expect(response.body.user).toHaveProperty('email', 'newuser@example.com');
      
      // Verify User.create was called with the correct data
      expect(User.create).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
        role: 'admin'
      });
    });

    it('should prevent duplicate emails', async () => {
      // Mock User.findOne to return a user (email already exists)
      User.findOne.mockResolvedValueOnce(new User({
        email: 'existing@example.com',
        password: 'hashed-password',
        role: 'admin'
      }));

      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'existing@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Email already in use');
    });
  });

  // Test login
  describe('POST /api/auth/login', () => {
    it('should login successfully', async () => {
      // Create a test user
      const user = new User({
        email: 'test@example.com',
        password: 'hashed-password',
        role: 'admin'
      });
      user.comparePassword = jest.fn().mockResolvedValue(true);
      
      // Mock User.findOne to return the test user
      User.findOne.mockResolvedValueOnce(user);
      
      // Mock JWT sign
      const mockToken = 'test-jwt-token';
      jwt.sign.mockReturnValueOnce(mockToken);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token', mockToken);
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
      
      // Verify comparePassword was called
      expect(user.comparePassword).toHaveBeenCalledWith('password123');
    });

    it('should fail with wrong password', async () => {
      // Create a test user with failing comparePassword
      const user = new User({
        email: 'test@example.com',
        password: 'hashed-password',
        role: 'admin'
      });
      user.comparePassword = jest.fn().mockResolvedValue(false);
      
      // Mock User.findOne to return the test user
      User.findOne.mockResolvedValueOnce(user);
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrong-password'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
      
      // Verify comparePassword was called
      expect(user.comparePassword).toHaveBeenCalledWith('wrong-password');
    });

    it('should fail with non-existent email', async () => {
      // Mock User.findOne to return null
      User.findOne.mockResolvedValueOnce(null);
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });
  });

  // Test protected route
  describe('Protected routes', () => {
    it('should allow access with valid token', async () => {
      // Create a test user
      const user = new User({
        _id: testUser._id,
        email: testUser.email,
        password: testUser.password,
        role: testUser.role
      });
      
      // Mock User.findById
      User.findById.mockResolvedValueOnce(user);
      
      // Mock JWT verify
      jwt.verify.mockReturnValueOnce({ userId: testUser._id, role: testUser.role });
      
      const response = await request(app)
        .get('/api/protected-route')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Access granted');
      expect(response.body.user).toHaveProperty('email', testUser.email);
    });

    it('should deny access without token', async () => {
      const response = await request(app)
        .get('/api/protected-route');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'No token provided');
    });

    it('should deny access with invalid token', async () => {
      // Mock JWT verify to throw error
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      const response = await request(app)
        .get('/api/protected-route')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Token is not valid');
    });
  });
});
