// Base API URL - gets from environment variables or falls back to localhost
//const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
import { API_URL } from '../config/api';

/**
 * Fetches the instruction set from the API
 * 
 * @returns {Promise<Array>} Array of instruction objects with opcode, name, and description
 * @throws {Error} If the API request fails
 */
export const fetchInstructionSet = async () => {
  try {
    const response = await fetch(`${API_URL}/instruction-sets/`);
    if (!response.ok) {
      throw new Error('Failed to fetch instruction set');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching instruction set:', error);
    throw error;
  }
};

/**
 * Fetches example programs from the API
 * 
 * @returns {Promise<Array>} Array of example program objects with id, name, description, and code
 * @throws {Error} If the API request fails
 */
export const fetchExamplePrograms = async () => {
  try {
    const response = await fetch(`${API_URL}/example-programs/`);
    if (!response.ok) {
      throw new Error('Failed to fetch example programs');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching example programs:', error);
    throw error;
  }
};

/**
 * Creates a new simulation session on the server
 * Stores the session ID in localStorage for future reference
 * 
 * @returns {Promise<Object>} Session data including session_id
 * @throws {Error} If the API request fails
 */
export const createSession = async () => {
  try {
    const response = await fetch(`${API_URL}/sessions/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error('Failed to create session');
    }

    const sessionData = await response.json();
    // Store session ID in localStorage for persistence across page refreshes
    localStorage.setItem('simulatorSessionId', sessionData.session_id);
    return sessionData;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};

/**
 * Updates the code for an existing session on the server
 * Used to track what code users are running in the simulator
 * 
 * @param {string} code - The assembly code being executed
 * @returns {Promise<Object>} Response data with status and entries count
 * @throws {Error} If the API request fails or no session ID is found
 */
export const updateSessionCode = async (code) => {
  try {
    // Get the session ID from localStorage
    const sessionId = localStorage.getItem('simulatorSessionId');
    if (!sessionId) {
      console.warn('No session ID found');
      return;
    }

    const response = await fetch(`${API_URL}/sessions/${sessionId}/update_code/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code })
    });

    if (!response.ok) {
      throw new Error('Failed to update session code');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating session code:', error);
    throw error;
  }
};