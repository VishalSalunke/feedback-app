module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    '/node_modules/(?!(@babel|mongodb|mongoose|bcryptjs|jsonwebtoken|cors|dotenv|express|supertest|jest|nodemon)/)'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^models/(.*)$': '<rootDir>/models/$1',
    '^routes/(.*)$': '<rootDir>/routes/$1',
    '^middleware/(.*)$': '<rootDir>/middleware/$1'
  }
};
