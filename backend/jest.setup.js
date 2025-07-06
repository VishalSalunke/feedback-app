// Mock mongoose first with a simple mock
jest.mock('mongoose', () => {
  const mockConnection = {
    dropDatabase: jest.fn(),
    close: jest.fn()
  };

  const mockMongoose = {
    connect: jest.fn().mockResolvedValue(mockConnection),
    connection: mockConnection,
    model: jest.fn().mockReturnThis(),
    Schema: jest.fn(),
    Types: {
      ObjectId: jest.fn()
    }
  };
  
  return mockMongoose;
});

const mongoose = require('mongoose');

// Mock User model data
const createMockUser = (overrides = {}) => ({
  _id: 'test-user-id',
  email: 'test@example.com',
  password: 'hashed-password',
  role: 'admin',
  comparePassword: jest.fn().mockResolvedValue(true),
  save: jest.fn().mockImplementation(function() {
    return Promise.resolve({
      _id: this._id,
      email: this.email,
      role: this.role
    });
  }),
  ...overrides
});

// Mock the User model
jest.mock('models/User', () => {
  const mockUser = createMockUser();
  
  const mockMethods = {
    findOne: jest.fn().mockImplementation((query) => {
      if (query?.email === 'test@example.com') {
        return Promise.resolve({
          ...mockUser,
          comparePassword: jest.fn().mockResolvedValue(true)
        });
      }
      return Promise.resolve(null);
    }),
    create: jest.fn().mockImplementation((userData) => {
      const newUser = {
        _id: 'new-user-id',
        email: userData.email,
        role: 'admin',
        ...userData,
        save: jest.fn().mockResolvedValue({
          _id: 'new-user-id',
          email: userData.email,
          role: 'admin'
        })
      };
      return Promise.resolve(newUser);
    }),
    findById: jest.fn().mockResolvedValue(mockUser),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    find: jest.fn().mockResolvedValue([mockUser]),
    findByIdAndUpdate: jest.fn().mockResolvedValue(mockUser),
    findByIdAndDelete: jest.fn().mockResolvedValue(mockUser),
    findOneAndUpdate: jest.fn().mockResolvedValue(mockUser),
    findOneAndDelete: jest.fn().mockResolvedValue(mockUser),
    countDocuments: jest.fn().mockResolvedValue(1)
  };
  
  return {
    __esModule: true,
    default: mockMethods,
    ...mockMethods
  };
});

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Clean up after tests
afterAll(async () => {
  await mongoose.connection.close();
});
