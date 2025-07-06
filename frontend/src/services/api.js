import axios from "axios";

// Use environment variable with fallback to local development URL
const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3030/api";

console.log("API Base URL:", API_URL); // For debugging

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(
      `API Request: ${config.method?.toUpperCase()} ${config.url}`,
      config.params || ""
    );
    return config;
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error("API Error:", {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post("/auth/login", { email, password }),

  // Add other auth-related API calls here
};

// Forms API
export const formsAPI = {
  // Get all forms with pagination
  getForms: (page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc") =>
    api.get("/forms", {
      params: {
        page,
        limit,
        sortBy,
        sortOrder,
      },
    }),

  // Get a single form by ID
  getForm: (id) => api.get(`/forms/${id}`),

  // Create a new form
  createForm: (formData) => api.post("/forms", formData),
};

// Feedback API
export const feedbackAPI = {
  // Get all feedback with pagination and filtering
  getAll: async (filters = {}) => {
    try {
      console.log("Fetching feedback with filters:", filters);
      const response = await api.get("/feedback/feedbacks", {
        params: filters,
      });

      // Log the response structure for debugging
      console.log("Feedback API Response Structure:", {
        hasData: !!response.data,
        hasDataData: !!response.data?.data,
        isDataArray: Array.isArray(response.data?.data),
        dataKeys: response.data ? Object.keys(response.data) : [],
      });

      // Return the data in a consistent format
      return {
        ...response,
        data: response.data?.data || response.data || [],
      };
    } catch (error) {
      console.error("Error in feedbackAPI.getAll:", error);
      throw error;
    }
  },

  // Get feedback statistics
  getStats: () => api.get("/feedback/stats"),

  // Submit feedback for a form
  submitFeedback: (data) => api.post("/feedback", data),
};

export default api;
