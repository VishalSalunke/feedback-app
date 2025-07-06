import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const CreateForm = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    questions: [
      { text: '', type: 'text' }
    ]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formUrl, setFormUrl] = useState('');

  const handleTitleChange = (e) => {
    setFormData({
      ...formData,
      title: e.target.value
    });
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value
    };
    setFormData({
      ...formData,
      questions: updatedQuestions
    });
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        { text: '', type: 'text' }
      ]
    });
  };

  const removeQuestion = (index) => {
    if (formData.questions.length === 1) return; // Keep at least one question
    
    const updatedQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      questions: updatedQuestions
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.title.trim()) {
      setError('Please enter a form title');
      return;
    }

    for (let i = 0; i < formData.questions.length; i++) {
      if (!formData.questions[i].text.trim()) {
        setError(`Question ${i + 1} cannot be empty`);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setError('');
      setSuccess('');
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/forms`,
        formData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log('Form creation response:', response);
      
      if (response.data && (response.data._id || response.data.form?._id)) {
        const formId = response.data._id || response.data.form._id;
        setSuccess('Form created successfully!');
        const publicUrl = `${window.location.origin}/form/${formId}`; // Note: Changed from /forms/ to /form/ to match public route
        setFormUrl(publicUrl);
      } else {
        throw new Error('Unexpected response format from server');
      }
      
    } catch (err) {
      console.error('Error creating form:', err);
      setError(err.response?.data?.message || 'Failed to create form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formUrl);
    alert('URL copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h1 className="text-2xl font-semibold text-gray-900">Create New Feedback Form</h1>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
                {error}
              </div>
            )}
            
            {success ? (
              <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-md">
                <p className="font-medium">{success}</p>
                <div className="mt-2 flex items-center">
                  <input
                    type="text"
                    readOnly
                    value={formUrl}
                    className="flex-1 p-2 border border-gray-300 rounded-l-md"
                  />
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Copy
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSuccess('');
                    setFormData({
                      title: '',
                      questions: [{ text: '', type: 'text' }]
                    });
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Create Another Form
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Form Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={handleTitleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                    placeholder="Enter form title"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">Questions</h2>
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Add Question
                    </button>
                  </div>

                  {formData.questions.map((question, index) => (
                    <div key={index} className="border border-gray-200 rounded-md p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-sm font-medium text-gray-700">Question {index + 1}</h3>
                        {formData.questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeQuestion(index)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      
                      <div className="mb-3">
                        <label htmlFor={`question-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                          Question Text *
                        </label>
                        <input
                          type="text"
                          id={`question-${index}`}
                          value={question.text}
                          onChange={(e) => handleQuestionChange(index, 'text', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                          placeholder="Enter your question"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor={`type-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                          Answer Type *
                        </label>
                        <select
                          id={`type-${index}`}
                          value={question.type}
                          onChange={(e) => handleQuestionChange(index, 'type', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        >
                          <option value="text">Text Answer</option>
                          <option value="vote">Vote (Thumbs Up/Down)</option>
                          <option value="rating">Rating (1-5 Stars)</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Form'}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateForm;
