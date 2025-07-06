import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import { AuthProvider } from '../context/AuthContext';
import * as api from '../services/api';

// Mock the API calls
jest.mock('../services/api', () => ({
  formsAPI: {
    getAll: jest.fn(),
  },
  feedbackAPI: {
    getAll: jest.fn(),
  },
}));

const mockForms = [
  {
    _id: '1',
    title: 'Test Form',
    questions: [{ text: 'Question 1', type: 'text' }],
  },
];

const mockFeedbacks = [
  {
    _id: '1',
    formId: '1',
    answers: [
      {
        questionText: 'How was your experience?',
        type: 'rating',
        rating: 4,
      },
    ],
    overallSentiment: 'Positive',
    createdAt: new Date().toISOString(),
  },
];

const renderWithProviders = (ui, { route = '/dashboard' } = {}) => {
  window.history.pushState({}, 'Test page', route);
  
  const Wrapper = ({ children }) => (
    <AuthProvider>
      <MemoryRouter initialEntries={[route]}>
        {children}
      </MemoryRouter>
    </AuthProvider>
  );

  return render(ui, { wrapper: Wrapper });
};

describe('Dashboard', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup mock implementations
    api.formsAPI.getAll.mockResolvedValue(mockForms);
    api.feedbackAPI.getAll.mockResolvedValue(mockFeedbacks);
  });

  it('renders loading state initially', async () => {
    renderWithProviders(<Dashboard />);
    
    // Check for loading indicator
    expect(screen.getByRole('status')).toBeInTheDocument();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(api.formsAPI.getAll).toHaveBeenCalledTimes(1);
      expect(api.feedbackAPI.getAll).toHaveBeenCalledTimes(1);
    });
  });

  it('displays stats after loading', async () => {
    renderWithProviders(<Dashboard />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Total Forms')).toBeInTheDocument();
      expect(screen.getByText('Total Feedback')).toBeInTheDocument();
      expect(screen.getByText('Positive Feedback')).toBeInTheDocument();
    });
  });

  it('displays the sentiment chart', async () => {
    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Feedback Sentiment')).toBeInTheDocument();
      // Check if the chart container is rendered
      expect(document.querySelector('.recharts-wrapper')).toBeInTheDocument();
    });
  });

  it('displays recent feedback table', async () => {
    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Recent Feedback')).toBeInTheDocument();
      // Check if the feedback table is rendered with data
      expect(screen.getByText('How was your experience?')).toBeInTheDocument();
      expect(screen.getByText('Positive')).toBeInTheDocument();
    });
  });

  it('displays forms list', async () => {
    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Your Forms')).toBeInTheDocument();
      expect(screen.getByText('Test Form')).toBeInTheDocument();
      expect(screen.getByText('1 question')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    const errorMessage = 'Failed to load data';
    api.formsAPI.getAll.mockRejectedValueOnce(new Error(errorMessage));
    
    renderWithProviders(<Dashboard />);
    
    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });
});
