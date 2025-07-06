import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formsAPI, feedbackAPI } from '../../services/api';

// Thumbs up/down component for boolean votes
const BooleanVote = ({ value, onChange }) => {
  return (
    <div className="flex space-x-4">
      <button
        type="button"
        className={`p-2 rounded-full ${value === true ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
        onClick={() => onChange(true)}
      >
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
        </svg>
      </button>
      <button
        type="button"
        className={`p-2 rounded-full ${value === false ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}`}
        onClick={() => onChange(false)}
      >
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
        </svg>
      </button>
    </div>
  );
};

// Star rating component (1-5)
const StarRating = ({ value, onChange }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`text-2xl ${star <= (hover || value) ? 'text-yellow-400' : 'text-gray-300'}`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
        >
          ★
        </button>
      ))}
    </div>
  );
};

const FeedbackForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formData, setFormData] = useState({});

  // Fetch form data
  useEffect(() => {
    const fetchForm = async () => {
      try {
        setLoading(true);
        const response = await formsAPI.getForm(id);
        setForm(response.data);
        
        // Initialize form data with empty values
        const initialData = {};
        if (response.data.questions) {
          response.data.questions.forEach((_, index) => {
            initialData[`question_${index}`] = '';
          });
        }
        setFormData(initialData);
      } catch (err) {
        console.error('Error fetching form:', err);
        setError('Failed to load form. Please check the URL and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [id]);

  const handleInputChange = (index, value) => {
    setFormData(prev => ({
      ...prev,
      [`question_${index}`]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      // Validate form data and prepare answers
      const answers = [];
      form.questions.forEach((question, index) => {
        const answerValue = formData[`question_${index}`];
        
        // Check for required fields
        if (question.required) {
          if (answerValue === undefined || answerValue === null || answerValue === '') {
            throw new Error(`Please provide an answer for: ${question.text}`);
          }
          // Additional validation for rating type
          if (question.type === 'rating' && (isNaN(answerValue) || answerValue < 1 || answerValue > 5)) {
            throw new Error(`Please provide a valid rating (1-5) for: ${question.text}`);
          }
        }

        // Skip if no answer and not required
        if (!answerValue && answerValue !== 0 && !question.required) {
          return;
        }

        // Format answer based on question type
        const answer = {
          questionId: question._id,
          questionText: question.text,
          type: question.type
        };

        // Set the appropriate field based on question type
        if (question.type === 'text') {
          answer.text = answerValue || '';
        } else if (question.type === 'vote') {
          answer.vote = answerValue === 'true';
        } else if (question.type === 'rating') {
          answer.rating = Number(answerValue);
        }

        answers.push(answer);
      });

      console.log('Submitting feedback:', { formId: id, answers });
      
      const response = await feedbackAPI.submitFeedback({
        formId: id,
        answers
      });

      console.log('Feedback submission response:', response);
      setSubmitSuccess(true);
    } catch (err) {
      console.error('Error submitting feedback:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        stack: err.stack
      });
      
      let errorMessage = 'Failed to submit feedback. Please try again.';
      
      if (err.response) {
        // Server responded with an error status
        if (err.response.status === 400) {
          errorMessage = 'Invalid form data. Please check your answers and try again.';
        } else if (err.response.status === 401) {
          errorMessage = 'Session expired. Please refresh the page and try again.';
        } else if (err.response.status === 404) {
          errorMessage = 'Form not found. The form may have been deleted or is no longer available.';
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.message) {
        // Other errors (network, etc.)
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="mt-3 text-lg font-medium text-gray-900">Error</h3>
            <p className="mt-2 text-sm text-gray-500">{error}</p>
            <div className="mt-6">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="mt-3 text-lg font-medium text-gray-900">Thank You!</h3>
          <p className="mt-2 text-sm text-gray-500">Your feedback has been submitted successfully.</p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h1 className="text-2xl font-bold text-gray-900">{form?.title || 'Feedback Form'}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Please provide your feedback below
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
            {form?.questions?.map((question, index) => (
              <div key={question._id} className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {question.text}
                  <span className="text-red-500">*</span>
                </label>
                
                {question.type === 'text' ? (
                  <div className="mt-1">
                    <textarea
                      rows={3}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                      value={formData[`question_${index}`] || ''}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      required={question.required}
                      placeholder={question.required ? 'Required' : 'Optional'}
                    />
                  </div>
                ) : question.type === 'vote' ? (
                  <div className="mt-2">
                    <div className="mt-2">
                      <BooleanVote
                        value={formData[`question_${index}`] === 'true'}
                        onChange={(value) => handleInputChange(index, value.toString())}
                      />
                      <div className="mt-2 text-sm text-gray-500">
                        {formData[`question_${index}`] === 'true' 
                          ? 'You selected: Thumbs Up' 
                          : formData[`question_${index}`] === 'false' 
                            ? 'You selected: Thumbs Down' 
                            : 'Please select your vote'}
                      </div>
                      <input
                        type="hidden"
                        value={formData[`question_${index}`] || ''}
                        required={question.required}
                      />
                    </div>
                  </div>
                ) : question.type === 'rating' ? (
                  <div className="mt-2">
                    <div className="mt-2">
                      <StarRating
                        value={parseInt(formData[`question_${index}`]) || 0}
                        onChange={(value) => handleInputChange(index, value.toString())}
                      />
                      <div className="mt-1 text-sm text-gray-500">
                        {formData[`question_${index}`] 
                          ? `You rated: ${formData[`question_${index}`]} ${formData[`question_${index}`] === '1' ? 'star' : 'stars'}`
                          : 'Please select a rating (1-5)'}
                      </div>
                      <input
                        type="hidden"
                        value={formData[`question_${index}`] || ''}
                        required={question.required}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            ))}

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : 'Submit Feedback'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FeedbackForm;
