import axios from 'axios';
import { API_URL } from '../config';
import { getAuthHeader } from './auth';

const feedbackAPI = {
  getAll: async (filters = {}) => {
    try {
      const response = await axios.get(`${API_URL}/api/feedback/feedbacks`, {
        headers: getAuthHeader(),
        params: filters
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      throw error;
    }
  },

  getStats: async () => {
    try {
      const response = await axios.get(`${API_URL}/api/feedback/stats`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching feedback stats:', error);
      throw error;
    }
  },

  submit: async (formId, answers) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/feedback`,
        { formId, answers },
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }
};

export default feedbackAPI;
