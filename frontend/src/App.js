import logo from './logo.svg';
import './App.css';
import React from 'react';
import EightBitSimulator from './components/EightBitSimulator';


function App() {
  return (
    <div className="App h-screen">
      <header className="bg-indigo-800 text-white p-4 shadow-lg">
        <div className="container mx-auto flex items-center justify-center">
          <img src={logo} alt="8-bit Computer Simulator Logo" className="h-[75px] w-[75px] mr-3 mr-5" />
          <h1 className="text-2xl font-bold text-center ml-5">8-bit Computer Simulator</h1></div>
      </header>
      <main className="h-full">
        <EightBitSimulator />
      </main>
    </div>
  );
}

export default App;




