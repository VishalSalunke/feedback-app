import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formsAPI, feedbackAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import SentimentChart from '../components/SentimentChart';
import FeedbackTable from '../components/FeedbackTable';

const Dashboard = () => {
  const [forms, setForms] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalForms, setTotalForms] = useState(0);
  const [showAllForms, setShowAllForms] = useState(false);
  const formsPerPage = 10; // Show more forms by default

  // Navigate to forms list page
  const navigateToFormsList = () => {
    window.location.href = '/forms';
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching data from APIs...');
        
        // Fetch forms with pagination
        console.log('Fetching forms - Page:', currentPage, 'Per Page:', formsPerPage);
        const response = await formsAPI.getForms(currentPage, formsPerPage);
        console.log('Raw Forms API Response:', response);
        
        // Handle forms response - extract data from Axios response
        const responseData = response?.data || response;
        console.log('Response data structure:', JSON.stringify(responseData, null, 2));
        
        let formsData = [];
        let totalCount = 0;
        let totalPages = 1;
        
        // Extract forms array and pagination info
        if (Array.isArray(responseData)) {
          // Case 1: Direct array response
          formsData = responseData;
          totalCount = responseData.length;
          totalPages = Math.ceil(totalCount / formsPerPage);
          console.log('Using direct forms array from response');
        } else if (responseData && Array.isArray(responseData.forms)) {
          // Case 2: { forms: [], total: number, pages: number }
          formsData = responseData.forms;
          totalCount = responseData.total || responseData.forms.length;
          totalPages = responseData.pages || Math.ceil(totalCount / formsPerPage);
          console.log('Using forms array from response.forms');
        } else if (responseData && Array.isArray(responseData.data)) {
          // Case 3: { data: [], total: number, pages: number }
          formsData = responseData.data;
          totalCount = responseData.total || responseData.data.length;
          totalPages = responseData.pages || Math.ceil(totalCount / formsPerPage);
          console.log('Using forms array from response.data');
        } else if (responseData && responseData.data && Array.isArray(responseData.data.forms)) {
          // Case 4: { data: { forms: [], total: number, pages: number } }
          formsData = responseData.data.forms;
          totalCount = responseData.data.total || responseData.data.forms.length;
          totalPages = responseData.data.pages || Math.ceil(totalCount / formsPerPage);
          console.log('Using forms array from response.data.forms');
        } else if (responseData && responseData.data && Array.isArray(responseData.data.data)) {
          // Case 5: { data: { data: [], total: number, last_page: number } } (Laravel style)
          formsData = responseData.data.data;
          totalCount = responseData.data.total || responseData.data.data.length;
          totalPages = responseData.data.last_page || Math.ceil(totalCount / formsPerPage);
          console.log('Using forms array from response.data.data (Laravel style)');
        } else if (responseData && responseData.data) {
          // Case 6: Handle other data structures that might contain docs (Mongoose style)
          formsData = responseData.data.docs || [];
          totalCount = responseData.data.total || formsData.length;
          totalPages = responseData.data.pages || Math.ceil(totalCount / formsPerPage);
          console.log('Using docs array from response.data.docs');
        }
        
        // Calculate total pages
        const calculatedTotalPages = Math.ceil(totalCount / formsPerPage);
        setTotalForms(totalCount);
        setTotalPages(calculatedTotalPages);
        console.log(`Total forms: ${totalCount}, Total pages: ${calculatedTotalPages}`);
        
        // Fetch feedbacks with error handling
        let feedbacksData = [];
        try {
          const feedbacksResponse = await feedbackAPI.getAll();
          console.log('Raw Feedbacks API Response:', feedbacksResponse);
          
          // Extract data from Axios response
          const feedbacksResponseData = feedbacksResponse?.data || feedbacksResponse;
          console.log('Feedbacks Response Data:', feedbacksResponseData);
          
          // Handle different response structures
          if (Array.isArray(feedbacksResponseData)) {
            feedbacksData = feedbacksResponseData;
            console.log('Using direct feedbacks array from response');
          } else if (feedbacksResponseData && Array.isArray(feedbacksResponseData.feedbacks)) {
            feedbacksData = feedbacksResponseData.feedbacks;
            console.log('Using feedbacks array from response.feedbacks');
          } else if (feedbacksResponseData && Array.isArray(feedbacksResponseData.data)) {
            feedbacksData = feedbacksResponseData.data;
            console.log('Using feedbacks array from response.data');
          } else if (feedbacksResponseData && feedbacksResponseData.data && Array.isArray(feedbacksResponseData.data.feedbacks)) {
            feedbacksData = feedbacksResponseData.data.feedbacks;
            console.log('Using feedbacks array from response.data.feedbacks');
          } else if (feedbacksResponseData && typeof feedbacksResponseData === 'object') {
            // If it's a single feedback object, wrap it in an array
            feedbacksData = [feedbacksResponseData];
            console.log('Wrapping single feedback object in array');
          }
          
          // Log the processed feedback data
          console.log('Processed feedbacks data:', {
            count: feedbacksData.length,
            firstItem: feedbacksData[0] ? {
              id: feedbacksData[0]._id,
              hasOverallSentiment: 'overallSentiment' in feedbacksData[0],
              hasSentiment: 'sentiment' in feedbacksData[0],
              hasAnswers: Array.isArray(feedbacksData[0].answers)
            } : 'No feedback items',
            allSentiments: [...new Set(feedbacksData.map(f => f.overallSentiment || f.sentiment))]
          });
          
        } catch (error) {
          console.error('Error fetching feedbacks:', error);
          setError('Failed to load feedback data. Please try again later.');
        }
        
        console.log('Processed Forms Data:', formsData);
        console.log('Processed Feedbacks Data:', feedbacksData);
        
        // Debug: Log the first feedback item's structure if available
        if (feedbacksData.length > 0) {
          console.log('First feedback item structure:', {
            keys: Object.keys(feedbacksData[0]),
            sample: feedbacksData[0]
          });
          
          // Debug: Log all unique sentiment values
          const sentiments = [...new Set(feedbacksData.map(f => f.overallSentiment || f.sentiment))];
          console.log('Available sentiment values in data:', sentiments);
        }
        
        setForms(formsData);
        setFeedbacks(feedbacksData);
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Failed to load dashboard data';
        setError(errorMessage);
        console.error('Error fetching data:', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate stats with better error handling and data structure support
  const stats = [
    { 
      name: 'Total Forms', 
      value: Array.isArray(forms) ? forms.length : 0 
    },
    { 
      name: 'Total Feedback', 
      value: Array.isArray(feedbacks) ? feedbacks.length : 0 
    },
    { 
      name: 'Positive Feedback', 
      value: Array.isArray(feedbacks) ? feedbacks.filter(f => {
        if (!f) return false;
        // Check for sentiment in different possible locations
        const sentiment = f.overallSentiment || f.sentiment || 
                         (f.answers && f.answers[0]?.sentiment);
        return sentiment === 'Positive';
      }).length : 0
    },
    { 
      name: 'Feedback with Answers', 
      value: Array.isArray(feedbacks) ? feedbacks.filter(f => 
        f && f.answers && f.answers.length > 0
      ).length : 0
    },
  ];
  
  // Debug: Log the calculated stats and sample data
  console.log('Calculated stats:', stats);
  if (feedbacks.length > 0) {
    console.log('Sample feedback item:', {
      id: feedbacks[0]._id,
      hasAnswers: Array.isArray(feedbacks[0].answers),
      answerCount: feedbacks[0].answers?.length || 0,
      sentiment: feedbacks[0].overallSentiment || feedbacks[0].sentiment,
      firstAnswerSentiment: feedbacks[0].answers?.[0]?.sentiment
    });
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="bg-white shadow">
          <div className="px-4 py-6 sm:px-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          </div>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 gap-5 mt-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            {stats.map((stat) => (
              <div key={stat.name} className="px-4 py-5 bg-white rounded-lg overflow-hidden shadow">
                <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {loading ? (
                    <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  ) : (
                    stat.value
                  )}
                </dd>
              </div>
            ))}
          </div>

          {/* Sentiment Chart */}
          <div className="mt-8">
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Feedback Sentiment</h2>
              <div className="h-80">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <SentimentChart data={feedbacks} />
                )}
              </div>
            </div>
          </div>

          {/* Most Recent Feedback */}
          <div className="mt-8">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Most Recent Feedback</h2>
                <Link
                  to="/feedbacks"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  View all feedback
                </Link>
              </div>
              <div className="mt-4">
                {loading ? (
                  <div className="animate-pulse h-20 bg-gray-200 rounded"></div>
                ) : feedbacks.length > 0 ? (
                  <div className="space-y-4">
                    {(() => {
                      // Sort feedbacks by date (newest first) and take the first one
                      const sortedFeedbacks = [...feedbacks].sort((a, b) => 
                        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
                      );
                      const latestFeedback = sortedFeedbacks[0];
                      
                      return (
                        <div key={latestFeedback._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-sm font-medium text-gray-900 mb-1">
                                {latestFeedback.formId?.title || 'Form'}
                              </h3>
                              <p className="text-sm text-gray-600 mb-2">
                                {new Date(latestFeedback.createdAt).toLocaleString()}
                              </p>
                              <div className="space-y-3">
                                {latestFeedback.answers?.map((answer, idx) => (
                                  <div key={idx} className="text-sm text-gray-700 border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                                    <p className="font-medium text-gray-900">{answer.question || 'Question'}</p>
                                    <p className="text-gray-700 mb-1">{answer.answer || 'No answer provided'}</p>
                                    {answer.sentiment && (
                                      <div className="mt-1">
                                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" 
                                              style={{
                                                backgroundColor: answer.sentiment === 'Positive' ? '#D1FAE5' : 
                                                              answer.sentiment === 'Negative' ? '#FEE2E2' : '#FEF3C7',
                                                color: answer.sentiment === 'Positive' ? '#065F46' : 
                                                      answer.sentiment === 'Negative' ? '#B91C1C' : '#92400E',
                                              }}>
                                          {answer.sentiment}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <Link
                                to={`/feedbacks/${latestFeedback._id}`}
                                className="text-sm font-medium text-blue-600 hover:text-blue-500"
                              >
                                View Details
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No feedback available yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Your Forms */}
          <div className="mt-8">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Your Forms</h2>
                <Link
                  to="/forms/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Create New Form
                </Link>
              </div>
              
              {loading ? (
                <div className="animate-pulse space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : forms.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No forms found. Create your first form to get started.
                </div>
              ) : (
                <>
                  <ul className="divide-y divide-gray-200">
                    {forms.map((form) => (
                      <li key={form._id} className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">
                              <Link to={`/forms/${form._id}`} className="hover:text-blue-600">
                                {form.title}
                              </Link>
                              <p className="text-sm text-gray-500">
                                {form.questions?.length || 0} question{form.questions?.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="ml-2 flex-shrink-0 flex">
                            <Link
                              to={`/forms/${form._id}/responses`}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                            >
                              View Responses
                            </Link>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between">
                      <div className="flex-1 flex justify-between sm:hidden">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                            currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                            currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          Next
                        </button>
                      </div>
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700">
                            Showing <span className="font-medium">{(currentPage - 1) * formsPerPage + 1}</span> to{' '}
                            <span className="font-medium">
                              {Math.min(currentPage * formsPerPage, totalForms)}
                            </span>{' '}
                            of <span className="font-medium">{totalForms}</span> forms
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              disabled={currentPage === 1}
                              className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                                currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              <span className="sr-only">Previous</span>
                              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                            
                            {/* Page numbers */}
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }
                              
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setCurrentPage(pageNum)}
                                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                    currentPage === pageNum 
                                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' 
                                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                            
                            <button
                              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                              disabled={currentPage === totalPages}
                              className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                                currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              <span className="sr-only">Next</span>
                              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* View All Forms Link */}
                  <div className="mt-4 text-center">
                    <Link 
                      to="/forms" 
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.href = '/forms';
                      }}
                    >
                      View all {totalForms} forms
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
