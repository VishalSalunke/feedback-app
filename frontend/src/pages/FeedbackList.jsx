import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { feedbackAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import FeedbackTable from '../components/FeedbackTable';
import { format } from 'date-fns';

const FeedbackList = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    sentiment: '',
    startDate: '',
    endDate: '',
    search: ''
  });

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        setLoading(true);
        const response = await feedbackAPI.getAll(filters);
        console.log('Raw API Response:', response);
        
        // Handle Axios response object
        const responseData = response?.data || response;
        console.log('Response data:', responseData);
        
        // Handle both direct array response and paginated response with feedbacks array
        let feedbacksData = [];
        
        if (Array.isArray(responseData)) {
          feedbacksData = responseData;
        } else if (responseData && Array.isArray(responseData.feedbacks)) {
          feedbacksData = responseData.feedbacks;
        } else if (responseData && typeof responseData === 'object') {
          // If it's a single feedback object
          feedbacksData = [responseData];
        }
        
        console.log('Extracted feedbacks:', feedbacksData);
        setFeedbacks(feedbacksData);
      } catch (err) {
        setError('Failed to load feedbacks');
        console.error('Error fetching feedbacks:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      sentiment: '',
      startDate: '',
      endDate: '',
      search: ''
    });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="bg-white shadow">
          <div className="px-4 py-6 sm:px-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Feedback List</h1>
            <div className="flex space-x-3">
              <button
                onClick={resetFilters}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {/* Filters */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  name="search"
                  id="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Search feedback..."
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="sentiment" className="block text-sm font-medium text-gray-700 mb-1">Sentiment</label>
                <select
                  id="sentiment"
                  name="sentiment"
                  value={filters.sentiment}
                  onChange={handleFilterChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">All Sentiments</option>
                  <option value="Positive">Positive</option>
                  <option value="Neutral">Neutral</option>
                  <option value="Negative">Negative</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  name="startDate"
                  id="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  name="endDate"
                  id="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
          
          {/* Feedback Table */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                {loading ? 'Loading...' : `Showing ${feedbacks.length} feedback entries`}
              </h2>
              <div className="flex space-x-2">
                <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Export CSV
                </button>
              </div>
            </div>
            
            <div className="mt-4">
              <FeedbackTable 
                feedbacks={feedbacks}
                loading={loading}
              />
            </div>
            
            {!loading && feedbacks.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No feedback found matching your criteria.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackList;
