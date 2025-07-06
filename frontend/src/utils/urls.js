/**
 * URL and environment configuration utilities
 */

// Environment detection
const isProduction = import.meta.env.PROD;
const isDevelopment = !isProduction;

// Base URLs
const LOCAL_API_URL = 'http://localhost:3030';
const PROD_API_URL = import.meta.env.VITE_API_BASE_URL || '';

// API base URL with fallback
const API_BASE = isProduction && PROD_API_URL 
  ? PROD_API_URL 
  : LOCAL_API_URL;

/**
 * Get the base URL for API requests
 * @returns {string} The base API URL
 */
export const getApiBaseUrl = () => {
  return API_BASE;
};

/**
 * Get the full URL for an API endpoint
 * @param {string} path - The API endpoint path (e.g., '/api/forms')
 * @returns {string} The full API URL
 */
export const getApiUrl = (path) => {
  const base = getApiBaseUrl();
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
};

/**
 * Get the public URL for a form
 * @param {string} formId - The form ID
 * @returns {string} The public form URL
 */
export const getFormUrl = (formId) => {
  if (!formId) return '';
  return `${window.location.origin}/form/${formId}`;
};

/**
 * Get the URL for the form builder (admin view)
 * @param {string} formId - The form ID
 * @returns {string} The form builder URL
 */
export const getFormBuilderUrl = (formId) => {
  if (!formId) return '';
  return `${window.location.origin}/forms/edit/${formId}`;
};

// Log environment info in development
if (isDevelopment) {
  console.log('Environment:', {
    isProduction,
    isDevelopment,
    apiBaseUrl: getApiBaseUrl(),
    publicUrl: window.location.origin,
  });
}

export default {
  isProduction,
  isDevelopment,
  getApiBaseUrl,
  getApiUrl,
  getFormUrl,
  getFormBuilderUrl,
};
