import { useEffect, useMemo, useCallback } from "react";
import { format } from "date-fns";

// Helper function to calculate overall sentiment from answers
const calculateOverallSentiment = (answers = []) => {
  if (!answers.length) return null;
  
  const sentimentCounts = answers.reduce((acc, { sentiment }) => {
    if (!sentiment) return acc;
    acc[sentiment] = (acc[sentiment] || 0) + 1;
    return acc;
  }, { Positive: 0, Neutral: 0, Negative: 0 });
  
  // Get the sentiment with highest count
  const [overallSentiment] = Object.entries(sentimentCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([sentiment]) => sentiment);
    
  return overallSentiment || 'Neutral';
};

// Sentiment badge component
const SentimentBadge = ({ sentiment, size = 'md' }) => {
  if (!sentiment) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Unknown
      </span>
    );
  }

  const sentimentStr = String(sentiment).charAt(0).toUpperCase() + 
    String(sentiment).slice(1).toLowerCase();

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1'
  };

  const sentimentStyles = {
    Positive: 'bg-green-100 text-green-800',
    Neutral: 'bg-yellow-100 text-yellow-800',
    Negative: 'bg-red-100 text-red-800',
  };

  const style = sentimentStyles[sentimentStr] || 'bg-gray-100 text-gray-800';

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${style} ${sizeClasses[size]}`}>
      {sentimentStr}
    </span>
  );
};

// Helper function to process a single feedback item
const processFeedbackItem = (feedback, index) => {
  if (!feedback || typeof feedback !== 'object') {
    console.warn('Invalid feedback item:', feedback);
    return null;
  }
  
  // Extract answers, handling both array and single answer formats
  const answers = Array.isArray(feedback.answers) 
    ? feedback.answers 
    : (feedback.answer ? [feedback.answer] : []);
  
  const processed = {
    ...feedback,
    _id: feedback._id || `temp-${Date.now()}-${index}`,
    answers,
    createdAt: feedback.createdAt || new Date().toISOString(),
    // Calculate overall sentiment if not present
    overallSentiment: feedback.overallSentiment || calculateOverallSentiment(answers)
  };
  
  return processed;
};

const FeedbackTable = ({ feedbacks: feedbacksProp = [], loading = false }) => {
  // Define getAnswerText first to ensure consistent hook order
  const getAnswerText = useCallback((answers = []) => {
    // Ensure answers is an array
    const answerList = Array.isArray(answers) ? answers : [];
    
    if (!answerList.length) {
      return <div key="no-answers" className="text-gray-500 italic text-sm">No answers available</div>;
    }

    return answerList.map((answer, idx) => {
      // Skip invalid answers
      if (!answer || (!answer.text && typeof answer.vote === 'undefined' && typeof answer.rating === 'undefined')) {
        return null;
      }

      return (
        <div key={`${answer.questionId || idx}-${idx}`} className="mb-3 last:mb-0 p-2 bg-gray-50 rounded">
          <div className="flex justify-between items-start">
            <p className="font-medium text-sm text-gray-900">
              {answer.questionText || "Question"}
            </p>
            {answer.sentiment && (
              <div className="ml-2">
                <SentimentBadge sentiment={answer.sentiment} size="sm" />
              </div>
            )}
          </div>
          
          <div className="mt-1 text-sm text-gray-700">
            {answer.type === "vote" ? (
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  answer.vote ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}>
                  {answer.vote ? "Yes" : "No"}
                </span>
              </div>
            ) : answer.type === "rating" ? (
              <div className="flex items-center space-x-2">
                <span className="text-yellow-500">
                  {"★".repeat(answer.rating || 0)}
                  {"☆".repeat(5 - (answer.rating || 0))}
                </span>
                <span className="text-gray-600 text-xs">
                  ({answer.rating || 0}/5)
                </span>
              </div>
            ) : answer.text ? (
              <div className="mt-1 p-2 bg-white rounded border border-gray-200">
                {answer.text}
              </div>
            ) : (
              <span className="text-gray-400 italic text-xs">No response</span>
            )}
          </div>
        </div>
      );
    }).filter(Boolean); // Remove any null entries
  }, []);
  // Handle different feedback data formats
  const feedbacks = useMemo(() => {
    console.log('Processing feedbacksProp:', feedbacksProp);
    
    // If it's an array, return as is
    if (Array.isArray(feedbacksProp)) {
      console.log('Using direct array format with', feedbacksProp.length, 'items');
      return feedbacksProp;
    }
    
    // If it's an object with a feedbacks array (paginated response)
    if (feedbacksProp && typeof feedbacksProp === 'object') {
      if (Array.isArray(feedbacksProp.feedbacks)) {
        console.log('Extracting feedbacks array from paginated response with', feedbacksProp.feedbacks.length, 'items');
        return feedbacksProp.feedbacks;
      }
      
      // If it's a single feedback object, wrap it in an array
      console.log('Wrapping single feedback object in array');
      return [feedbacksProp];
    }
    
    // Fallback to empty array
    console.warn('No valid feedback data format, using empty array. Input was:', feedbacksProp);
    return [];
  }, [feedbacksProp]);
  
  // Process feedback to add overall sentiment
  const processedFeedbacks = useMemo(() => {
    try {
      let dataToProcess = feedbacks;
      
      // Handle different response formats
      if (!dataToProcess) {
        console.log('No feedback data provided');
        return [];
      }
      
      // If it's a paginated response with a feedbacks array
      if (dataToProcess.feedbacks && Array.isArray(dataToProcess.feedbacks)) {
        console.log('Processing paginated response with', dataToProcess.feedbacks.length, 'items');
        dataToProcess = dataToProcess.feedbacks;
      }
      
      // If it's an array, process each item
      if (Array.isArray(dataToProcess)) {
        console.log(`Processing ${dataToProcess.length} feedback items`);
        return dataToProcess
          .map((item, index) => processFeedbackItem(item, index))
          .filter(Boolean); // Remove any null/undefined items
      }
      
      // If it's a single feedback object
      if (typeof dataToProcess === 'object') {
        console.log('Processing single feedback item');
        const processed = processFeedbackItem(dataToProcess, 0);
        return processed ? [processed] : [];
      }
      
      console.log('No valid feedback data format found');
      return [];
    } catch (error) {
      console.error('Error processing feedbacks:', error);
      return [];
    }
  }, [feedbacks]);

  // Debug logging
  useEffect(() => {
    console.group('FeedbackTable Data Flow');
    console.log('Input:', {
      type: typeof feedbacksProp,
      isArray: Array.isArray(feedbacksProp),
      keys: feedbacksProp ? Object.keys(feedbacksProp) : []
    });
    
    console.log('Processed Feedbacks:', {
      count: processedFeedbacks.length,
      firstItem: processedFeedbacks[0] || 'No items',
      allItems: processedFeedbacks
    });
    
    console.groupEnd();
  }, [processedFeedbacks, feedbacksProp]);
  
  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Empty state
  if (!feedbacks || feedbacks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No feedback available yet. Submit a form to see feedback here.
      </div>
    );
  }

  const formatDate = (dateString) => {
    try {
      return dateString
        ? format(new Date(dateString), "MMM d, yyyy h:mm a")
        : "N/A";
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  return (
    <div className="flex flex-col">
      <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
          <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Feedback
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Sentiment
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processedFeedbacks.map((feedback) => (
                  <tr
                    key={feedback._id}
                    className="hover:bg-gray-50 border-b border-gray-200"
                  >
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {feedback.formId?.title && (
                          <h4 className="font-semibold text-gray-900">
                            {feedback.formId.title}
                          </h4>
                        )}
                        <div className="mt-1 space-y-2">
                          {getAnswerText(feedback.answers)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col items-start space-y-1">
                        <div className="font-medium">
                          <SentimentBadge sentiment={feedback.overallSentiment} size="md" />
                        </div>
                        {feedback.answers?.some(a => a.sentiment) && (
                          <div className="text-xs text-gray-500 mt-1">
                            Based on {feedback.answers.filter(a => a.sentiment).length} answer{feedback.answers.filter(a => a.sentiment).length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(feedback.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackTable;
