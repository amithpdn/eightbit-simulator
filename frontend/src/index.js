// /frontend/src/index.js
// Author: Amith Lokugamage 
// Last Modified: May 19, 2025
/**
 * Application Entry Point
 * 
 * This is the main entry point for the 8-bit computer simulator React application.
 * It renders the root App component into the DOM and configures development tools
 * like StrictMode and web vitals reporting.
 * 
 * Features:
 * - React application bootstrapping
 * - StrictMode for highlighting potential problems in development
 * - Web vitals performance measurement
 * 
 * @module index
 */

// Import React core libraries
import React from 'react';
import ReactDOM from 'react-dom/client';

// Import global styles
import './index.css';

// Import the root application component
import App from './App';

// Import performance measurement utility
import reportWebVitals from './reportWebVitals';

// Create a root container by targeting the root div from public/index.html
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the application wrapped in StrictMode
// StrictMode performs additional checks and warnings during development
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Initialize performance measurement
// This helps track key performance metrics like loading and interaction times
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();