/**
 * URL configuration for the 8-bit computer simulator
 */

// Get the base path from environment variables or use the homepage path in production
const BASE_PATH = process.env.NODE_ENV === 'production' ? '/eightbit-simulator' : '';

// Get the API URL from environment variables or use a fallback
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api' || `${BASE_PATH}/api`;

//// API endpoints 
//export const ENDPOINTS = {
//  INSTRUCTION_SET: `${API_URL}/instruction-set`,
//  EXAMPLE_PROGRAMS: `${API_URL}/examples`,
//  CREATE_SESSION: `${API_URL}/session/create`,
//  UPDATE_SESSION: `${API_URL}/session/update`,
//};