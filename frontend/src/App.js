// /frontend/src/App.js
// Author: Amith Lokugamage 
// Last Modified: May 18, 2025
/**
 * Main Application Component
 * 
 * Root component for the 8-bit computer simulator application.
 * Defines the layout structure including header and main content area.
 * 
 * Features:
 * - Application header with logo and title
 * - Main content container with the simulator component
 * - Responsive layout using Tailwind CSS
 * 
 * @module App
 */

import logo from './logo.svg';
import './App.css';
import React from 'react';
import EightBitSimulator from './components/EightBitSimulator';


function App() {
  return (
    <div className="App h-screen">
      {/* Application Header */}
      <header className="bg-indigo-800 text-white p-4 shadow-lg">
        <div className="container mx-auto flex items-center justify-center">
          <img src={logo} alt="8-bit Computer Simulator Logo" className="h-[75px] w-[75px] mr-3 mr-5" />
          <h1 className="text-2xl font-bold text-center ml-5">8-bit Computer Simulator</h1></div>
      </header>
      
      {/* Main Content Area */}
      <main className="h-full">
        <EightBitSimulator />
      </main>
    </div>
  );
}

export default App;