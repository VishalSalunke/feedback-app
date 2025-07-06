/* global jest, describe, it, expect, beforeAll, afterAll, beforeEach */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { MemoryRouter, BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import Login from '../pages/Login';

// Mock the useNavigate hook
const mockNavigate = jest.fn();

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock the login function
const mockLogin = jest.fn();

// Mock the AuthContext module
jest.mock('../context/AuthContext', () => ({
  __esModule: true,
  ...jest.requireActual('../context/AuthContext'),
  useAuth: jest.fn(),
}));

// Import the mocked AuthContext after setting up the mock
import * as AuthContext from '../context/AuthContext';

// Mock the API module
const mockApiLogin = jest.fn();

jest.mock('../services/api', () => ({
  authAPI: {
    login: (email, password) => mockApiLogin(email, password),
  },
}));

// Set up the default mock implementation for useAuth
beforeEach(() => {
  mockLogin.mockClear();
  mockNavigate.mockClear();
  
  AuthContext.useAuth.mockImplementation(() => ({
    login: mockLogin,
    currentUser: null,
    loading: false,
    error: null,
  }));
});

// Helper function to render components with router and auth context
const renderWithRouter = (ui, { route = '/login' } = {}) => {
  window.history.pushState({}, 'Test page', route);
  return render(
    <AuthProvider>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </AuthProvider>,
    { wrapper: MemoryRouter }
  );
};

describe('Login Component', () => {
  let originalConsoleError;

  beforeAll(() => {
    // Mock console.error to avoid seeing error logs in test output
    originalConsoleError = console.error;
    console.error = jest.fn();
  });

  afterAll(() => {
    // Restore console.error
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Reset localStorage
    window.localStorage.clear();
  });

  it('renders login form', () => {
    renderWithRouter(<Login />);
    
    expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('validates form fields', async () => {
    // Mock a successful login response
    mockLogin.mockResolvedValueOnce({ success: true });
    
    // Render the component
    renderWithRouter(<Login />);
    
    // Get form element and inputs
    const form = screen.getByTestId('login-form');
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    // Submit empty form
    await act(async () => {
      fireEvent.submit(form);
    });
    
    // Should show validation error
    expect(screen.getByText('Please fill in all fields')).toBeInTheDocument();
    
    // Fill in only email
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.submit(form);
    });
    
    // Should still show validation error
    expect(screen.getByText('Please fill in all fields')).toBeInTheDocument();
    
    // Fill in both fields and submit
    await act(async () => {
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.submit(form);
    });
    
    // Should call login with correct credentials
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('handles login success', async () => {
    // Arrange
    mockLogin.mockResolvedValueOnce({ success: true });
    
    // Mock the useAuth hook
    AuthContext.useAuth.mockImplementation(() => ({
      login: mockLogin,
      currentUser: null,
      loading: false,
      error: null,
    }));
    
    renderWithRouter(<Login />);
    
    // Fill in the form
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const form = screen.getByTestId('login-form');
    
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
    });
    
    // Submit the form
    await act(async () => {
      fireEvent.submit(form);
    });
    
    // Wait for the login function to resolve
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Assert login was called with correct credentials
    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    
    // Wait for the next tick to allow navigation to occur
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Assert navigation occurred
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });
  
  it('displays error message on login failure', async () => {
    // Arrange
    const errorMessage = 'Login failed. Please check your credentials.';
    mockLogin.mockResolvedValueOnce({ 
      success: false,
      error: errorMessage
    });
    
    // Mock the useAuth hook
    AuthContext.useAuth.mockImplementation(() => ({
      login: mockLogin,
      currentUser: null,
      loading: false,
      error: null,
    }));
    
    renderWithRouter(<Login />);
    
    // Act
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/email address/i), { 
        target: { value: 'wrong@example.com' } 
      });
      fireEvent.change(screen.getByLabelText(/password/i), { 
        target: { value: 'wrongpassword' } 
      });
      fireEvent.submit(screen.getByTestId('login-form'));
    });
    
    // Wait for the login function to resolve
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Assert
    expect(mockLogin).toHaveBeenCalledWith('wrong@example.com', 'wrongpassword');
    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
  });
});
