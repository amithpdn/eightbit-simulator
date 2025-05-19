// /frontend/src/components/EightBitSimulator.js
// Author: Amith Lokugamage 
// Last Modified: May 19, 2025
/**
 * 8-bit Computer Simulator Component
 * 
 * This is the main UI component for the 8-bit computer simulator application.
 * It provides an interactive interface for writing and executing assembly code,
 * visualizing CPU components, and displaying memory contents in real-time.
 * 
 * Features:
 * - Interactive assembly code editor with syntax highlighting
 * - Visual CPU simulation with component highlighting
 * - ROM and RAM memory visualization
 * - Example program library with one-click loading
 * - Variable clock speed execution control
 * - Educational disclaimers and terms
 * 
 * @module EightBitSimulator
 */

import React, { useState, useEffect, useRef } from 'react';
import CPU from '../lib/cpu';
import DOMPurify from 'dompurify';
import {
  fetchInstructionSet,
  fetchExamplePrograms,
  createSession,
  updateSessionCode
} from '../api/simulatorApi';

/**
 * Main component for the 8-bit computer simulator interface
 * Manages state, UI rendering, and interactions with the CPU simulator
 * 
 * @returns {JSX.Element} The rendered simulator interface
 */
const EightBitSimulator = () => {
  // -------------------------------------------------------------------------
  // State variables
  // -------------------------------------------------------------------------
  const [sessionId, setSessionId] = useState(null);                    // Unique session ID for API calls
  const [assemblyCode, setAssemblyCode] = useState('');                // Current assembly code in editor
  const [examples, setExamples] = useState([]);                        // Available example programs
  const [instructionSet, setInstructionSet] = useState([]);            // Available CPU instructions
  const [selectedExample, setSelectedExample] = useState('');          // Currently selected example program
  const [showInstructionSet, setShowInstructionSet] = useState(false); // Controls instruction set modal visibility
  const [clockSpeed, setClockSpeed] = useState(1);                     // CPU clock speed in Hz
  const [currentLine, setCurrentLine] = useState(0);                   // Currently executing line for highlighting
  
  // Comprehensive CPU state object for visualization and tracking
  const [cpuState, setCpuState] = useState({
    registerA: 0,                          // Accumulator register - primary working register
    registerB: 0,                          // Secondary register (not actively used in current implementation)
    programCounter: 0,                     // Current execution position in memory
    instructionRegister: 0,                // Current instruction being executed
    outputRegister: 0,                     // Output value display
    flags: { zero: false, carry: false },  // Status flags for conditional operations
    rom: Array(256).fill(0),               // Read-Only Memory (program storage) - 256 bytes
    ram: Array(256).fill(0),               // Random Access Memory (data storage) - 256 bytes
    activeComponents: {                    // Tracks active components for visualization
      alu: false,                          // Arithmetic Logic Unit
      ram: false,                          // RAM access indicator
      rom: false,                          // ROM access indicator
      register_a: false,                   // Register A activity
      register_b: false,                   // Register B activity
      instruction_register: false,         // Instruction Register activity
      program_counter: true,               // Program Counter starts active
      output_register: false               // Output Register activity
    },
    currentSourceLine: 0                   // Current source line being executed (for highlighting)
  });
  
  // UI and execution state variables
  const [isRunning, setIsRunning] = useState(false);              // Whether CPU is currently executing
  const [isEditing, setIsEditing] = useState(true);               // Editor mode (edit vs. view)
  const [showTerms, setShowTerms] = useState(false);              // Controls terms of use modal visibility
  const [showImprovements, setShowImprovements] = useState(false); // Controls improvements modal visibility
  
  // Disclaimer acceptance tracking using localStorage for persistence
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(() => {
    // Check if user has previously accepted the disclaimer using localStorage
    return localStorage.getItem('hasAcceptedDisclaimer') === 'true';
  });

  // -------------------------------------------------------------------------
  // Refs - persistent values that don't cause re-renders
  // -------------------------------------------------------------------------
  
  // Create CPU instance using useRef to maintain a single instance between renders
  const cpuRef = useRef(new CPU());

  // -------------------------------------------------------------------------
  // Effects - side effects and lifecycle hooks
  // -------------------------------------------------------------------------
  
  /**
   * Create a session when the component first mounts
   * This logs the user session and enables tracking code execution
   */
  useEffect(() => {
    const initSession = async () => {
      try {
        const session = await createSession();
        setSessionId(session.session_id);
      } catch (error) {
        console.error('Failed to initialize session:', error);
      }
    };

    initSession();
  }, []);

  /**
   * Check if user has previously seen the disclaimer
   * Runs once on component mount
   */
  useEffect(() => {
    const accepted = localStorage.getItem('hasAcceptedDisclaimer') === 'true';
    setHasAcceptedDisclaimer(accepted);
  }, []);

  /**
   * Fetch instruction set and example programs from API
   * Provides fallback data if API fails to ensure simulator still works
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch instruction set and example programs in parallel for efficiency
        const [instructionSetData, examplesData] = await Promise.all([
          fetchInstructionSet(),
          fetchExamplePrograms()
        ]);

        setInstructionSet(instructionSetData);
        setExamples(examplesData);
      } catch (error) {
        // Provide fallback data if API fails to ensure app works offline
        console.error('Failed to fetch data:', error);
        
        // Fallback instruction set
        setInstructionSet([
          { opcode:'0000', name: 'NOP', description: 'No Operation' },
          { opcode:'0001', name: 'LDA', description: 'Load value from memory address into A register' },
          { opcode:'0010', name: 'ADD', description: 'Add value from memory address to A register' },
          //{ opcode:'0011', name: 'SUB', description: 'Subtract value from memory address from A register' },
          //{ opcode:'0100', name: 'STA', description: 'Store A register to memory address' },
          //{ opcode:'0101', name: 'LDI', description: 'Load immediate value into A register' },
          //{ opcode:'0110', name: 'JMP', description: 'Jump to memory address' },
          //{ opcode:'0111', name: 'JC', description: 'Jump if carry flag is set' },
          //{ opcode:'1000', name: 'JZ', description: 'Jump if zero flag is set' },
          //{ opcode:'1001', name: 'OUT', description: 'Output Register A to the output register' },
          //{ opcode:'1111', name: 'HLT', description: 'Halt program execution' },
        ]);
        
        // Fallback example programs (first example shown, others omitted for brevity)
        setExamples([
          { id: 1, name: 'Add Two Numbers', code: '; Add 2 numbers at 20 and 21\n; Result stored at address 22\n; Initialize the values to add\nLDI 6     ; Load immediate value 6 (first number)\nSTA 20    ; Store at address 20\nLDI 7     ; Load immediate value 7 (second number)\nSTA 21    ; Store at address 21\nLDI 0     ; Initialize result to 0\nSTA 22    ; Store result\n; Main program\nLDA 20    ; Load value in RAM location A to Register A\nADD 21    ; Add RegisterA and RAM location 21\nSTA 22    ; Store result in RAM location 22\nOUT       ; Output value in RegisterA to Output Register\nHLT       ; Halt execution\n\n' },
          { id: 2, name: 'Multiply Two Numbers', code: '; Multiply two numbers with embedded values\n; Values embedded in program\n; Result stored at address 22\n\n; Initialize the values to multiply\nLDI 6     ; Load immediate value 6 (first number)\nSTA 20    ; Store at address 20\nLDI 7     ; Load immediate value 7 (second number)\nSTA 21    ; Store at address 21\nLDI 1     ; Load immediate value 1 (decrement)\nSTA 40    ; Store counter at address 40\n\n; Start multiplication\nLDI 0     ; Initialize result to 0\nSTA 22    ; Store result\nLDA 21    ; Load second number\nJZ END    ; If zero, skip multiplication\nLDI 0     ; Initialize counter\nSTA 23    ; Store counter\n\nLOOP:\nLDA 23    ; Load counter\nADD 20    ; Add first number\nSTA 23    ; Update counter\nLDA 22    ; Load result\nADD 1     ; Add 1 to result\nSTA 22    ; Store result\nLDA 21    ; Load second number\nSUB 40    ; Decrement\nSTA 21    ; Update second number\nJZ END    ; If zero, we are done\nJMP LOOP  ; Repeat\n\nEND:\nLDA 23    ; Load results to register A\nOUT       ; Output value in RegisterA to Output Register\nHLT       ; Halt execution\n' },
          { id: 3, name: 'Fibonacci Sequence', code: '; Generate Fibonacci sequence with embedded starting values\n; First two values embedded in program\n; Store subsequent values starting at address 32\n; Limited to 10 iterations\n\n; Initialize first two Fibonacci numbers\nLDI 1     ; Load immediate value 1 (first Fibonacci number)\nSTA 30    ; Store at address 30\nLDI 1     ; Load immediate value 1 (second Fibonacci number)\nSTA 31    ; Store at address 31\n\n; Initialize counter\nLDI 9     ; Load immediate value 10 (loop count)\nSTA 40    ; Store counter at address 40\nLDI 1     ; Load immediate value 1 (decrement)\nSTA 41    ; Store counter at address 41\n\n; Start main sequence\nLDA 30    ; Load first value\nSTA 32    ; Store as previous\nLDA 31    ; Load second value\nSTA 33    ; Store as previous\n\nLOOP:\nLDA 32    ; Load previous\nADD 33    ; Add previous\nSTA 34    ; Store new value\nLDA 33    ; Move previous to previous\nSTA 32\nLDA 34    ; Move new value to previous\nSTA 33\n\n; Decrement counter\nLDA 40    ; Load counter\nSUB 41    ; Subtract 1\nSTA 40    ; Store updated counter\nJZ END    ; If counter is zero, end program\nJMP LOOP  ; Otherwise, repeat\n\nEND:\nLDA 33    ; Load results to register A\nOUT       ; Output value in RegisterA to OutRegister\nHLT       ; Halt execution\n\n' },
          //{ id: 4, name: 'Factorial Calculator', code: '; Calculate factorial of a number\n; Input at address 20\n; Result stored at address 21\n; Initialize values\nLDI 5     ; Calculate factorial of 5\nSTA 20    ; Store input number\nLDI 1     ; Initialize result to 1\nSTA 21\nLDI 1     ; Decrement value\nSTA 30\n; Main factorial calculation\nLOOP:\nLDA 20    ; Load current number\nJZ END    ; If zero, we are done\nSTA 22    ; Store as multiplier\nLDA 21    ; Load running product\nSTA 23    ; Store temporarily\nLDI 0     ; Initialize multiplication result\nSTA 21\n; Multiply loop\nMULLOOP:\nLDA 22    ; Check if multiplier is zero\nJZ NEXTFACT ; If zero, multiplication complete\nLDA 21    ; Load current product\nADD 23    ; Add original value (multiplication by repeated addition)\nSTA 21    ; Store running product\nLDA 22    ; Load multiplier\nSUB 30    ; Decrement\nSTA 22    ; Store updated multiplier\nJMP MULLOOP\nNEXTFACT:\nLDA 20    ; Load counter\nSUB 30    ; Decrement\nSTA 20    ; Update counter\nJMP LOOP  ; Process next factor\nEND:\nLDA 21    ; Load final result\nOUT       ; Output the result\nHLT       ; Halt execution\n\n' },
          //{ id: 5, name: 'Binary Counter (0-255)', code: '; Simple binary counter from 0 to 255 with output\n; Initialize counter\nLDI 0     ; Start from 0\nSTA 20\nLDI 1     ; Increment value\nSTA 21\n; Main counting loop\nLOOP:\nLDA 20    ; Load current value\nOUT       ; Display current value\nADD 21    ; Add increment\nSTA 20    ; Store incremented value\nJC END    ; If overflow (exceeds 255), we are done\nJMP LOOP  ; Continue counting\nEND:\nHLT       ; Halt execution\n\n' },
          //{ id: 6, name: 'Sum of First N Numbers', code: '; Calculate sum of first N numbers (arithmetic series)\n; N stored at address 20\n; Result stored at address 21\n; Initialize values\nLDI 10    ; Sum first 10 numbers\nSTA 20\nLDI 0     ; Initialize sum to 0\nSTA 21\nLDI 1     ; Counter starts at 1\nSTA 22\nLDI 1     ; Increment value\nSTA 30\n; Main summation loop\nLOOP:\nLDA 22    ; Load current number\nADD 21    ; Add to running sum\nSTA 21    ; Store updated sum\nLDA 22    ; Load counter\nADD 30    ; Increment\nSTA 22    ; Store updated counter\n; Check if we have reached N\nSUB 20    ; Compare with N\nJC LOOP   ; If less than N, continue\nJZ LOOP   ; If equal to N, do one more iteration\nEND:\nLDA 21    ; Load final sum\nOUT       ; Output the result\nHLT       ; Halt execution\n\n' },
          //{ id: 7, name: 'Count Down Timer', code: '; Simple countdown timer from value to zero\n; Initial value at address 30\n; Initialize counter\nLDI 20    ; Start from 20\nSTA 30\nLDI 1     ; Decrement value\nSTA 31\n; Main countdown loop\nLOOP:\nLDA 30    ; Load current value\nOUT       ; Display current value\nSUB 31    ; Subtract decrement\nSTA 30    ; Store decremented value\nJZ END    ; If zero, we are done\nJMP LOOP  ; Continue countdown\nEND:\nLDA 30    ; Load final zero\nOUT       ; Show final state\nHLT       ; Halt execution\n\n' },
          //{ id: 8, name: 'Square Calculator (for small numbers)', code: '; Calculate square of a number\n; Input at address 20\n; Result stored at address 21\n; Initialize value\nLDI 6     ; Number to square\nSTA 20\nLDI 0     ; Initialize result to 0\nSTA 21\n; Copy input for loop counter\nLDA 20\nSTA 22    ; Counter\nLDI 1     ; Decrement value\nSTA 23\n; Main squaring loop (repeated addition)\nLOOP:\nLDA 22    ; Check if counter is zero\nJZ END    ; If done, exit\nLDA 21    ; Load running sum\nADD 20    ; Add original number\nSTA 21    ; Store updated sum\nLDA 22    ; Load counter\nSUB 23    ; Decrement\nSTA 22    ; Update counter\nJMP LOOP  ; Continue\nEND:\nLDA 21    ; Load final result\nOUT       ; Output the result\nHLT       ; Halt execution\n\n' },
          //{ id: 9, name: 'Alternate Counter (counts up and down)', code: '; Alternate counting up and down\n; Counter at address 30\n; Direction flag at address 31 (0=up, 1=down)\n; Initialize values\nLDI 0     ; Start from 0\nSTA 30\nLDI 0     ; Start counting up\nSTA 31\nLDI 1     ; Increment/decrement value\nSTA 32\nLDI 10    ; Upper limit\nSTA 33\n; Main counting loop\nLOOP:\nLDA 30    ; Load current counter\nOUT       ; Display current value\nLDA 31    ; Check direction\nJZ COUNTUP ; If 0, count up\n; Count down\nLDA 30    ; Load counter\nSUB 32    ; Decrement\nSTA 30    ; Update counter\nJZ SWITCHUP ; If reached 0, switch to up\nJMP LOOP  ; Continue\nCOUNTUP:\nLDA 30    ; Load counter\nADD 32    ; Increment\nSTA 30    ; Update counter\nSUB 33    ; Compare with upper limit\nJZ SWITCHDOWN ; If reached limit, switch to down\nJMP LOOP  ; Continue\nSWITCHDOWN:\nLDI 1     ; Set direction to down\nSTA 31\nJMP LOOP\nSWITCHUP:\nLDI 0     ; Set direction to up\nSTA 31\nJMP LOOP\nEND:\nHLT       ; Halt execution (never reached in this program)\n\n' },
          //{ id: 10, name: 'Simple Division Algorithm', code: '; Divide two numbers (integer division)\n; Dividend at address 20, divisor at address 21\n; Quotient stored at address 22, remainder at address 23\n; Initialize values\nLDI 25    ; Dividend\nSTA 20\nLDI 4     ; Divisor\nSTA 21\nLDI 0     ; Initialize quotient\nSTA 22\nLDA 20    ; Copy dividend to remainder\nSTA 23\nLDI 1     ; Increment for quotient\nSTA 24\n; Main division loop\nLOOP:\nLDA 23    ; Load remainder\nSUB 21    ; Subtract divisor\nJC END    ; If negative, division complete\nSTA 23    ; Store new remainder\nLDA 22    ; Load quotient\nADD 24    ; Increment quotient\nSTA 22    ; Store updated quotient\nJMP LOOP  ; Continue division\nEND:\nLDA 22    ; Load quotient\nOUT       ; Output result\nHLT       ; Halt execution\n' },
        ]);
      }
    };

    fetchData();
  }, []);

  /**
   * Update current line highlighting during CPU execution
   * Only runs at slower speeds where visual feedback is useful to humans
   */
  useEffect(() => {
    // Only run this effect when the CPU is running & when it's visible to naked eyes
    // Higher speeds (>20Hz) are too fast for visual tracking
    if (!isRunning || clockSpeed > 20) return;

    // Create an interval to check the CPU's current line
    const intervalId = setInterval(() => {
      // Directly access the CPU's current line property
      const cpuCurrentLine = cpuRef.current.currentSourceLine;

      // Only update state if different to avoid unnecessary re-renders
      if (cpuCurrentLine !== currentLine) {
        setCurrentLine(cpuCurrentLine);
      }
    }, 50); // Check every 50ms (faster than human perception of ~100ms)

    // Clean up interval on unmount or dependencies change
    return () => clearInterval(intervalId);
  }, [isRunning, currentLine, clockSpeed]);

  /**
   * Update CPU state when clock speed changes
   * Ensures CPU runs at the correctly selected speed
   */
  useEffect(() => {
    cpuRef.current.setClockSpeed(clockSpeed);
  }, [clockSpeed]);

  /**
   * Update UI state from CPU when running
   * Uses requestAnimationFrame for smoother, more efficient updates
   */
  useEffect(() => {
    let animationFrameId;

    const updateCPUState = () => {
      // Get current CPU state for UI updates
      setCpuState(cpuRef.current.getState());

      // Continue animation loop if still running
      if (isRunning) {
        animationFrameId = requestAnimationFrame(updateCPUState);
      }
    };

    // Start animation loop if CPU is running
    if (isRunning) {
      animationFrameId = requestAnimationFrame(updateCPUState);
    }

    // Cleanup animation frame on unmount or when stopped
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isRunning]);

  // -------------------------------------------------------------------------
  // Utility Functions
  // -------------------------------------------------------------------------
  
  /**
   * Initialize RAM with zeros for clean state when loading examples
   * Ensures consistent starting conditions for programs
   */
  const initializeRamForExample = () => {
    const cpu = cpuRef.current;

    // Clear RAM to all zeros
    for (let i = 0; i < cpu.ram.length; i++) {
      cpu.ram[i] = 0;
    }

    // Update state to show the initialized RAM in UI
    setCpuState(cpu.getState());
  };

  /**
   * Assemble code and load it into the CPU
   * Converts assembly language to machine code and prepares for execution
   * 
   * @returns {Array<number>} The assembled machine code program
   */
  const assembleCode = () => {
    // Convert assembly code to machine code
    const program = cpuRef.current.assembleCode(assemblyCode);
    
    // Load the program into the CPU's ROM
    cpuRef.current.loadProgram(program);
    
    // Update the CPU state display
    setCpuState(cpuRef.current.getState());
    
    // Initialize RAM with zeros for a clean execution state
    initializeRamForExample();
    
    return program;
  };

  /**
   * Execute all instructions automatically
   * Prepares and starts the CPU execution process
   */
  const executeAll = () => {
    // Reset the line counter first
    setCurrentLine(0);

    // If currently in edit mode, switch to view mode to show line highlighting
    if (isEditing) {
      setIsEditing(false);
    }

    // Assemble and load the program
    assembleCode();

    // Record the code being executed for analytics
    updateSessionCode(assemblyCode).catch(console.error);

    // Start program execution
    cpuRef.current.run();
    setIsRunning(true);
  };

  /**
   * Load example code into the editor
   * Finds and loads the selected example program
   */
  const loadExampleCode = () => {
    if (!selectedExample) return;

    // Find the selected example by ID
    const example = examples.find(ex => ex.id === parseInt(selectedExample));
    if (example) {
      // Set the code in the editor
      setAssemblyCode(example.code);

      // Optionally assemble immediately to initialize RAM
      // Slight delay ensures UI update completes first
      setTimeout(() => {
        assembleCode();
      }, 100);
    }
  };

  /**
   * Format a byte as an 8-digit binary string (e.g., "00001111" instead of "1111")
   * 
   * @param {number} value - The byte value to format
   * @returns {string} Formatted binary string with leading zeros
   */
  const formatBinary = (value) => {
    return value.toString(2).padStart(8, '0');
  };

  /**
   * Format a byte as a 2-digit hex string (e.g., "0F" instead of "f")
   * 
   * @param {number} value - The byte value to format
   * @returns {string} Formatted uppercase hex string with leading zero if needed
   */
  const formatHex = (value) => {
    return value.toString(16).padStart(2, '0').toUpperCase();
  };
  
  // Download the current assembly code as a file
  const downloadProgram = () => {

    // Create a timestamp in the format yyyy-MM-dd-HH:mm:ss
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    // Format the timestamp
    const timestamp = `${year}_${month}_${day}_${hours}_${minutes}_${seconds}`;

    // Create a blob with the assembly code
    const blob = new Blob([assemblyCode], { type: 'text/plain' });

    // Create a download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Set the filename with the timestamp
    a.download = `8-bit-computer-simulator-${timestamp}.asm`;
    document.body.appendChild(a);
    a.click();

    // Clean up once the download is complete
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  };


  // Since most syntax highlighters are not compatible with assembly, I will use a custom function to highlight the assembly code
  // Need sanitization to prevent XSS attacks since we allow user input
  const highlightAssembly = (code) => {
    if (!code) return [<div key="empty">Enter your assembly code here or select an example code to load...</div>];
    const lines = code.split('\n');
    // Calculate the width needed for line numbers (number of digits)
    const lineNumberWidth = String(lines.length).length;

    return lines.map((line, lineIndex) => {
      // Sanitize the incoming line first to prevent XSS attacks
      const sanitizedLine = DOMPurify.sanitize(line);

      // Split the line at the first semicolon to separate code from comments
      const parts = sanitizedLine.split(';');
      const codePart = parts[0];
      const commentPart = parts.slice(1).join(';');

      // Start building the code part with highlighting
      let highlightedCode = codePart;

      // Highlight instructions (keywords)
      highlightedCode = highlightedCode.replace(
        /\b(NOP|LDA|ADD|SUB|STA|LDI|JMP|JC|JZ|OUT|HLT)\b/gi,
        '<span style="color: #2563EB; font-weight: bold;">$1</span>'
      );

      // Highlight numbers
      highlightedCode = highlightedCode.replace(
        /\b(\d+)\b/g,
        '<span style="color: #D946EF;">$1</span>'
      );

      // Highlight labels (words followed by colon)
      highlightedCode = highlightedCode.replace(
        /^(\s*\w+):/gm,
        '<span style="color: #F59E0B; font-weight: bold;">$1:</span>'
      );

      // Build the final line with comment highlighting if present
      let finalLine = highlightedCode;
      if (commentPart) {
        finalLine += `<span style="color: #10B981;">;</span><span style="color: #10B981; font-style: italic;">${commentPart}</span>`;
      }

      // Final sanitization of the HTML created
      // This is critical for XSS protection after I added custom HTML tags
      const sanitizedFinalLine = DOMPurify.sanitize(finalLine);

      // The line number + 1 to start from 1 instead of 0
      const lineNumber = lineIndex + 1;

      return (
        <div
          key={lineIndex}
          style={{
            //backgroundColor: lineIndex === currentLine ? 'rgba(59, 130, 246, 0.3)' : 'transparent', // Light indigo background
            backgroundColor: lineIndex === currentLine ? 'rgba(0, 240, 255, 0.3' : 'transparent', // Light indigo background
            display: 'flex',
            textAlign: 'left',
            whiteSpace: 'pre',
            fontFamily: 'monospace',
            lineHeight: '1.5'
          }}
        >
          {/* Line number */}
          <div
            style={{
              color: '#6B7280', // Gray-500
              textAlign: 'right',
              paddingRight: '8px',
              userSelect: 'none',
              borderRight: '1px solid #E5E7EB', // Gray-200
              marginRight: '8px',
              minWidth: `${lineNumberWidth + 1}em`
            }}
          >
            {lineNumber}
          </div>
          {/* Code content */}
          <div
            style={{
              textAlign: 'left',
              paddingRight: '16px',
              flexGrow: 1
            }}
            // Safe to use dangerouslySetInnerHTML here only because it is sanitized with DOMPurify
            dangerouslySetInnerHTML={{ __html: sanitizedFinalLine }}
          />
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col w-full min-h-screen pt-4 px-4 bg-gray-50">
      <div className="m-2">
        {/* Controls Section */}
        <div className="flex flex-wrap gap-4 mt-2 p-3 bg-white rounded-lg shadow-sm">
          {/* Examples List dropdown */}
          <div className="flex items-center">
            <label htmlFor="ex_prog" className='hidden'>Select Example Program:</label>
            <select
              id="ex_prog"
              className={`border p-2 ${isRunning ? 'bg-indigo-300 text-indigo-100 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'} rounded-l focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              value={selectedExample}
              onChange={(e) => setSelectedExample(e.target.value)}
              disabled={isRunning}
            >
              <option value="">Select Example</option>
              {examples.map(ex => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </select>
            <button
              className={`p-2 rounded-r ${!selectedExample || isRunning
                ? 'bg-amber-300 text-amber-100 cursor-not-allowed'
                : 'bg-amber-600 text-white hover:bg-amber-700 focus:ring-2 focus:ring-amber-500'
                }`}
              onClick={loadExampleCode}
              disabled={!selectedExample || isRunning}
            >
              Load
            </button>
          </div>

          {/* Execute Code Button */}
          <button
            className={`p-2 px-4 rounded shadow-sm ${isRunning || !assemblyCode.trim()
              ? 'bg-indigo-300 text-indigo-100 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              }`}
            onClick={executeAll}
            disabled={isRunning || !assemblyCode.trim()}
          >
            Execute Code
          </button>

          {/* Reset Button */}
          <button
            className="bg-red-600 text-white p-2 px-4 rounded shadow-sm hover:bg-red-700 focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            onClick={() => {
              // Reset the CPU
              cpuRef.current.reset();

              // Update state
              setCpuState(cpuRef.current.getState());

              // Optionally clear the current line highlight
              setCurrentLine(0);

              // Stop execution if running
              if (isRunning) {
                setIsRunning(false);
              }
            }}
          >
            Reset
          </button>

          {/* Clock Speed Control */}
          <div className="flex items-center">
            <span className="bg-indigo-600 text-white p-2 rounded-l shadow-sm flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Clock Speed
            </span>
            <label htmlFor="clk_speed" className='hidden'>Clock Speed:</label>
            <select
              id="clk_speed"
              className="border-0 p-2 bg-amber-500 hover:bg-amber-600 text-white rounded-r shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50"
              value={clockSpeed}
              onChange={(e) => setClockSpeed(parseFloat(e.target.value))}
            >
              {/* Available clock speeds in Hz */}
              {[0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000].map(speed => (
                <option key={speed} value={speed}>{speed} Hz</option>
              ))}
            </select>
          </div>

          {/* Check Instruction Set Button */}
          <button
            className="bg-emerald-600 text-white p-2 rounded shadow-sm hover:bg-emerald-700 focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            onClick={() => setShowInstructionSet(true)}
          >
            Instruction Set
          </button>
        </div>

        {/* Instruction Set Modal - displayed when showInstructionSet is true */}
        {showInstructionSet && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-2/3 max-h-3/4 overflow-auto">
              <h2 className="text-xl font-bold mb-4 text-indigo-900">Instruction Set</h2>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-indigo-100">
                    <th className="p-2 border border-indigo-200">Opcode</th>
                    <th className="p-2 border border-indigo-200">Instruction</th>
                    <th className="p-2 border border-indigo-200">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {instructionSet.map((instr, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="p-2 text-center border border-indigo-100 font-mono">{instr.opcode}</td>
                      <td className="p-2 text-center border border-indigo-100 font-mono font-semibold text-indigo-700">{instr.name}</td>
                      <td className="p-2 border border-indigo-100">{instr.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                className="mt-4 bg-indigo-600 text-white p-2 px-4 rounded hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => setShowInstructionSet(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main simulator layout - 3 column grid */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Assembly Code Editor Column */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-4 rounded-lg shadow-lg flex flex-col" style={{ height: '100%' }}>
          <h2 className="text-white text-xl mb-3 text-center font-bold">Assembly Code Editor</h2>
          {isEditing ? (
            // Edit mode - shows textarea with editable code
            // Edit mode - shows textarea with editable code and synced line numbers
            <div className="flex-grow w-full bg-white rounded-md shadow-inner overflow-hidden relative">
              <div className="flex h-full">
                {/* Line numbers in a scrollable container that will sync with main textarea */}
                <div
                  className="bg-gray-50 border-r border-gray-200 text-gray-500 font-mono text-right pr-2 pt-4 select-none"
                  style={{ minWidth: '2.5em', overflowY: 'hidden' }}
                >
                  {assemblyCode.split('\n').map((_, i) => (
                    <div className="font-mono" key={i} style={{ height: '1.4rem', width: '100%', fontSize: '12px' }}>{i + 1}</div>
                  ))}
                  {/* Add an extra line at the bottom to ensure proper scrolling */}
                  <div style={{ height: '16px' }}></div>
                </div>

                {/* Code textarea that will control scrolling */}
                <textarea
                  id="assembly_code_editor"
                  className="font-mono text-sm flex-grow bg-white overflow-auto p-4 pl-2"
                  value={assemblyCode}
                  onChange={(e) => setAssemblyCode(e.target.value)}
                  disabled={isRunning}
                  placeholder="Enter your assembly code here or select an example code to load..."
                  style={{
                    resize: 'none',
                    lineHeight: '1.6',
                    height: '100%',
                    border: 'none',
                    outline: 'none'
                  }}
                  // When the textarea scrolls, update the line numbers div scroll position
                  onScroll={(e) => {
                    const lineNumbersDiv = e.target.previousSibling;
                    lineNumbersDiv.scrollTop = e.target.scrollTop;
                  }}
                />
              </div>
            </div>
          ) : (
            // View mode - shows syntax highlighted code with line execution highlighting
            <div
              className="flex-grow w-full bg-white rounded-md shadow-inner overflow-auto"
              onClick={() => !isRunning && setIsEditing(true)}
            >
              <div
                className="font-mono text-sm"
                style={{
                  margin: 0,
                  padding: '16px',
                  paddingRight: '32px',
                  backgroundColor: 'white',
                  textAlign: 'left',
                  display: 'block'
                }}
              >
                {highlightAssembly(assemblyCode)}
              </div>
            </div>
          )}

          {/* Code editor controls */}
          <div className="mt-3 flex justify-between">
            <div>
              {isEditing ? (
                <button
                  className={`p-2 rounded ${isRunning
                    ? 'bg-emerald-300 text-emerald-100 cursor-not-allowed'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500'
                    }`}
                  onClick={() => setIsEditing(false)}
                  disabled={isRunning}
                >
                  View Mode
                </button>
              ) : (
                <button
                  className={`p-2 rounded ${isRunning
                    ? 'bg-emerald-300 text-emerald-100 cursor-not-allowed'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500'
                    }`}
                  onClick={() => setIsEditing(true)}
                  disabled={isRunning}
                >
                  Edit Mode
                </button>
              )}
            </div>
            <div>

              <button
                className={`p-2 rounded mr-2 ${isRunning || !assemblyCode.trim()
                  ? 'bg-gray-500 text-gray-100 cursor-not-allowed'
                  : 'bg-gray-800 text-white hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 px-4'
                  }`}
                onClick={() => setAssemblyCode('')}
                disabled={isRunning || !assemblyCode.trim()}
              >
                Clear
              </button>
              <button
                className={`p-2 rounded mr-2 ${isRunning || !assemblyCode.trim()
                  ? 'bg-purple-300 text-purple-100 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-2 focus:ring-purple-500'
                  }`}
                onClick={downloadProgram}
                disabled={isRunning || !assemblyCode.trim()}
              >
                Download
              </button>
            </div>
          </div>
        </div>

        {/* Memory Display Column */}
        <div className="flex flex-col gap-6">
          {/* ROM Content */}
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-4 rounded-lg shadow-lg flex flex-col flex-1">
            <h2 className="text-white text-xl mb-3 text-center font-bold">ROM Memory</h2>
            <div className="bg-white rounded-md shadow-inner flex-grow p-3 font-mono text-sm overflow-auto">
              <div className="grid grid-cols-9 gap-1">
                {/* Add row headers */}
                <div className="flex items-center justify-center font-bold border-b-2 border-r-2 border-gray-200 text-gray-700">Addr</div>
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className="flex items-center justify-center font-bold border-b-2 border-gray-200 text-gray-700">
                    +{i.toString(16).toUpperCase()}
                  </div>
                ))}

                {/* ROM memory display grid */}
                {Array.from({ length: 8 }, (_, row) => (
                  <React.Fragment key={row}>
                    {/* Row address label */}
                    <div className="flex items-center justify-center font-bold border-r-2 border-gray-200 text-gray-700">
                      {(row * 8).toString(16).padStart(2, '0').toUpperCase()}
                    </div>
                    {/* ROM content cells */}
                    {Array.from({ length: 8 }, (_, col) => {
                      const index = row * 8 + col;
                      return (
                        <div
                          key={col}
                          className={`flex items-center justify-center border ${index === cpuState.programCounter
                            ? 'bg-purple-100 border-purple-500 font-bold text-purple-800'
                            : 'border-gray-200 text-gray-700'
                            }`}
                          title={`Address: ${index.toString(16).padStart(2, '0').toUpperCase()}`}
                        >
                          {formatHex(cpuState.rom[index])}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* RAM Content */}
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-4 rounded-lg shadow-lg flex flex-col flex-1">
            <h2 className="text-white text-xl mb-3 text-center font-bold">RAM Memory</h2>
            <div className="bg-white rounded-md shadow-inner flex-grow p-3 font-mono text-sm overflow-auto">
              <div className="grid grid-cols-9 gap-1">
                {/* Header row */}
                <div className="flex items-center justify-center font-bold border-b-2 border-r-2 border-gray-200 text-gray-700">Addr</div>
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className="flex items-center justify-center font-bold border-b-2 border-gray-200 text-gray-700">
                    +{i.toString(16).toUpperCase()}
                  </div>
                ))}

                {/* RAM memory display grid */}
                {Array.from({ length: 8 }, (_, row) => (
                  <React.Fragment key={row}>
                    {/* Row address label */}
                    <div className="flex items-center justify-center font-bold border-r-2 border-gray-200 text-gray-700">
                      {(row * 8).toString(16).padStart(2, '0').toUpperCase()}
                    </div>
                    {/* RAM content cells with highlighting for current accessed address */}
                    {Array.from({ length: 8 }, (_, col) => {
                      const index = row * 8 + col;
                      return (
                        <div
                          key={col}
                          className={`flex items-center justify-center border ${index === cpuState.currentRamAddress
                            ? 'bg-emerald-100 border-emerald-500 font-bold text-emerald-800'
                            : 'border-gray-200 text-gray-700'
                            }`}
                        >
                          {formatHex(cpuState.ram[index])}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CPU Visualization Column */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-4 rounded-lg shadow-lg flex flex-col">
          <h2 className="text-white text-xl mb-3 text-center font-bold">CPU Simulator</h2>
          <div className="bg-white rounded-md shadow-inner p-4 flex-grow flex flex-col">
            {/* CPU Flags Display */}
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200 mb-4 grid place-items-center">
              <p className="font-mono text-gray-700 flex items-center gap-2">
                Flags:
                <span className={`${cpuState.flags.zero
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-gray-100 text-gray-500 border border-gray-300'
                  } py-1 px-2 rounded-md flex items-center font-mono text-sm`}>
                  <span className={`inline-block w-2 h-2 rounded-full mr-1 ${cpuState.flags.zero ? 'bg-emerald-500' : 'bg-gray-400'
                    }`}></span>
                  Zero: {cpuState.flags.zero ? '1' : '0'}
                </span>
                <span className={`ml-2 ${cpuState.flags.carry
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-gray-100 text-gray-500 border border-gray-300'
                  } py-1 px-2 rounded-md flex items-center font-mono text-sm`}>
                  <span className={`inline-block w-2 h-2 rounded-full mr-1 ${cpuState.flags.carry ? 'bg-amber-500' : 'bg-gray-400'
                    }`}></span>
                  Carry: {cpuState.flags.carry ? '1' : '0'}
                </span>
              </p>
            </div>

            {/* CPU Diagram SVG */}
            <div className="flex-grow">
              <svg viewBox="0 0 400 400" className="w-full h-full">
                {/* CPU Box */}
                <rect x="90" y="10" width="160" height="310" fill="#E4EEFE" stroke="#1E40AF" strokeWidth="2" rx="4" />
                <text x="170" y="30" textAnchor="middle" fontFamily="Courier New" fontWeight="bold" fontSize="20" fill="#3B82F6">CPU</text>

                {/* Register A */}
                <rect x="100" y="40" width="140" height="30" fill={cpuState.activeComponents.register_a ? "#3B82F6" : "#BFDBFE"} stroke="#1E40AF" strokeWidth="2" rx="2" />
                <text x="170" y="60" textAnchor="middle" fontFamily="Courier New" fill={cpuState.activeComponents.register_a ? "white" : "#1E40AF"}>Register A:0x{formatHex(cpuState.registerA)}</text>

                {/* Register B */}
                <rect x="100" y="80" width="140" height="30" fill={cpuState.activeComponents.register_b ? "#3B82F6" : "#BFDBFE"} stroke="#1E40AF" strokeWidth="2" rx="2" />
                <text x="170" y="100" textAnchor="middle" fontFamily="Courier New" fill={cpuState.activeComponents.register_b ? "white" : "#1E40AF"}>Register B:0x{formatHex(cpuState.registerB)}</text>

                {/* Output Register */}
                <rect x="100" y="200" width="140" height="30" fill={cpuState.activeComponents.output_register ? "#F59E0B" : "#FEF3C7"} stroke="#B45309" strokeWidth="2" rx="2" />
                <text x="170" y="220" textAnchor="middle" fontFamily="Courier New" fill={cpuState.activeComponents.output_register ? "white" : "#B45309"}>Output:0x{formatHex(cpuState.outputRegister)}</text>

                {/* Instruction Register */}
                <rect x="100" y="240" width="140" height="30" fill={cpuState.activeComponents.instruction_register ? "#3B82F6" : "#BFDBFE"} stroke="#1E40AF" strokeWidth="2" rx="2" />
                <text x="170" y="260" textAnchor="middle" fontFamily="Courier New" fill={cpuState.activeComponents.instruction_register ? "white" : "#1E40AF"}>IR:0x{formatHex(cpuState.instructionRegister)}</text>

                {/* Program Counter */}
                <rect x="100" y="280" width="140" height="30" fill={cpuState.activeComponents.program_counter ? "#3B82F6" : "#BFDBFE"} stroke="#1E40AF" strokeWidth="2" rx="2" />
                <text x="170" y="300" textAnchor="middle" fontFamily="Courier New" fill={cpuState.activeComponents.program_counter ? "white" : "#1E40AF"}>PC:0x{formatHex(cpuState.programCounter)}</text>

                {/* ROM */}
                <rect x="30" y="355" width="100" height="40" fill={cpuState.activeComponents.rom ? "#8B5CF6" : "#DDD6FE"} stroke="#7C3AED" strokeWidth="2" rx="3" />
                <text x="80" y="385" textAnchor="middle" fontFamily="Courier New" fontWeight="bold" fill={cpuState.activeComponents.rom ? "white" : "#7C3AED"}>ROM</text>

                {/* RAM */}
                <rect x="220" y="355" width="100" height="40" fill={cpuState.activeComponents.ram ? "#34D399" : "#A7F3D0"} stroke="#10B981" strokeWidth="2" rx="3" />
                <text x="270" y="385" textAnchor="middle" fontFamily="Courier New" fontWeight="bold" fill={cpuState.activeComponents.ram ? "white" : "#10B981"}>RAM</text>

                {/* Bus connections */}
                <line x1="80" y1="355" x2="170" y2="320" stroke="#7C3AED" strokeWidth="2" />
                <line x1="270" y1="355" x2="170" y2="320" stroke="#10B981" strokeWidth="2" />
                <line x1="240" y1="215" x2="290" y2="215" stroke="#B45309" strokeWidth="2" />

                {/* ALU Component */}
                <polygon
                  points="170,120 140,140 140,170 170,190 200,170 200,140"
                  fill={cpuState.activeComponents.alu ? "#3B82F6" : "#BFDBFE"}
                  stroke="#1E40AF"
                  strokeWidth="2"
                />
                <text x="170" y="150" textAnchor="middle" fontFamily="Courier New" fontWeight="bold" fill={cpuState.activeComponents.alu ? "white" : "#1E40AF"}>ALU</text>

                {/* Display ALU operation when active */}
                {cpuState.activeComponents.alu && (
                  <text x="170" y="170" textAnchor="middle" fill="white" fontFamily="Courier New" fontSize="10" fontStyle="italic" fontWeight="bold">
                    Op:{cpuState.alu.operation}
                  </text>
                )}

                {/* Output Display */}
                <rect x="270" y="150" width="105" height="100" fill={cpuState.activeComponents.output_register ? "#F59E0B" : "#FEF3C7"} stroke="#B45309" strokeWidth="2" rx="2" />
                {/* Title */}
                <text
                  x="320"
                  y="170"
                  textAnchor="middle"
                  fill={cpuState.activeComponents.output_register ? "white" : "#B45309"}
                  fontWeight="bold"
                  fontSize="14"
                  fontFamily="Courier New"
                >
                  OP Display
                </text>
                {/* Hex value */}
                <text
                  x="280"
                  y="195"
                  textAnchor="left"
                  fill={cpuState.activeComponents.output_register ? "white" : "#B45309"}
                  fontFamily="Courier New"
                  fontSize="12"
                  letterSpacing="-0.5"
                >
                  Hex:0x
                  <tspan fontWeight="bold" dx="2">{formatHex(cpuState.outputRegister)}</tspan>
                </text>
                {/* Decimal value */}
                <text
                  x="280"
                  y="215"
                  textAnchor="left"
                  fill={cpuState.activeComponents.output_register ? "white" : "#B45309"}
                  fontFamily="Courier New"
                  fontSize="12"
                  letterSpacing="-0.5"
                >
                  Dec:
                  <tspan fontWeight="bold" dx="2">{cpuState.outputRegister}</tspan>
                </text>
                {/* Binary value */}
                <text
                  x="280"
                  y="235"
                  textAnchor="left"
                  fill={cpuState.activeComponents.output_register ? "white" : "#B45309"}
                  fontFamily="Courier New"
                  fontSize="12"
                  letterSpacing="-0.5"
                >
                  Bin:
                  <tspan fontWeight="bold" dx="2">{formatBinary(cpuState.outputRegister)}</tspan>
                </text>


              </svg>
            </div>
          </div>

        </div>
      </div>

      {/* Terms of Use Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-3/4 max-h-3/4 overflow-auto">
            <h2 className="text-xl font-bold mb-4 text-indigo-900">Terms of Use</h2>

            <div className="mb-4">
              <h3 className="font-bold text-indigo-800">Educational Purpose</h3>
              <p className="text-gray-700">
                This 8-bit computer simulator is provided strictly for educational purposes.
                It is designed to help users understand basic computer architecture principles
                and assembly language programming in a simplified environment.
              </p>
            </div>

            <div className="mb-4">
              <h3 className="font-bold text-indigo-800">Intellectual Property Notice</h3>
              <p className="text-gray-700">
                This simulator is an independent educational tool. The instruction set and architecture
                are simplified models designed for educational purposes and are not intended to infringe
                on any proprietary systems.
              </p>
              <p className="mt-2 text-gray-700">
                Any similarities to existing computer systems are coincidental or represent
                commonly understood computer architecture concepts that are in the public domain
                or are standard industry knowledge.
              </p>
            </div>

            <div className="mb-4">
              <h3 className="font-bold text-indigo-800">Disclaimer</h3>
              <p className="text-gray-700">
                This simulator is provided "as is", without warranty of any kind. The creators
                are not responsible for any damage or issues that may arise from its use.
              </p>
              <p className="mt-2 text-gray-700">
                This tool is not affiliated with any commercial product or company and is not
                a replacement for professional computer architecture training.
              </p>
            </div>

            <div className="mb-4">
              <h3 className="font-bold text-indigo-800">License</h3>
              <p className="text-gray-700">
                All code, examples, and content within this simulator are released under the MIT License.
                You are free to use, modify, and distribute this for educational purposes.
              </p>
            </div>

            <button
              className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => setShowTerms(false)}
            >
              I Understand
            </button>
          </div>
        </div>
      )}

      {/* First-time Disclaimer Modal */}
      {!hasAcceptedDisclaimer && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl">
            <h2 className="text-2xl font-bold mb-4 text-indigo-900">Educational Purpose Disclaimer</h2>

            <div className="mb-6 text-gray-700">
              <p className="mb-3">
                Welcome to the 8-Bit Computer Simulator. This application is designed
                <strong> exclusively for educational purposes</strong> to help understand
                the basics of computer architecture and assembly programming.
              </p>

              <p className="mb-3">
                Important notes:
              </p>

              <ul className="list-disc pl-6 mb-3">
                <li>This simulator is a teaching and learning tool only</li>
                <li>It is not intended for commercial use</li>
                <li>It is not affiliated with any commercial product or company</li>
                <li>The instruction set is a simplified educational model</li>
                <li>All code examples are released under the MIT License</li>
              </ul>

              <p>
                By clicking "I Understand" below, you acknowledge that you are using
                this simulator for educational purposes only.
              </p>
            </div>

            <div className="flex justify-center">
              <button
                className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => {
                  localStorage.setItem('hasAcceptedDisclaimer', 'true');
                  setHasAcceptedDisclaimer(true);
                }}
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Possible Improvements Modal */}
      {showImprovements && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-3/4 max-h-3/4 overflow-auto">
            <h2 className="text-xl font-bold mb-4 text-indigo-900 mt-5">Possible Improvements</h2>

            <div className="mb-6 mx-20">
              <p className="mb-3 text-gray-700">
                The 8-bit computer simulator is a great educational tool, but there are many ways it could be enhanced.
                Here are some potential improvements that could be made:
              </p>

              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li className="p-1 hover:bg-indigo-50 rounded">
                  <span className="font-semibold text-indigo-700">Add more instructions</span>:
                  Implement more CPU instructions like bitwise operations, stack operations, etc.
                </li>

                <li className="p-1 hover:bg-indigo-50 rounded">
                  <span className="font-semibold text-indigo-700">Memory visualization</span>:
                  Add a visual representation of memory access and data movement.
                </li>

                <li className="p-1 hover:bg-indigo-50 rounded">
                  <span className="font-semibold text-indigo-700">Add I/O capabilities</span>:
                  Implement simulated I/O devices like a display, keyboard input, etc.
                </li>

                <li className="p-1 hover:bg-indigo-50 rounded">
                  <span className="font-semibold text-indigo-700">Debugging tools</span>:
                  Add breakpoints, step-by-step execution, and variable inspection.
                </li>

                <li className="p-1 hover:bg-indigo-50 rounded">
                  <span className="font-semibold text-indigo-700">Assembly editor improvements</span>:
                  Syntax highlighting, error checking, and autocompletion.
                </li>

                <li className="p-1 hover:bg-indigo-50 rounded">
                  <span className="font-semibold text-indigo-700">Save/load programs</span>:
                  Allow users to save their programs and load them later.
                </li>

                <li className="p-1 hover:bg-indigo-50 rounded">
                  <span className="font-semibold text-indigo-700">Improved visualization</span>:
                  Create animations for the data flow between components.
                </li>

                <li className="p-1 hover:bg-indigo-50 rounded">
                  <span className="font-semibold text-indigo-700">Performance metrics</span>:
                  Add execution statistics like cycle count, instruction frequency, etc.
                </li>
              </ul>
            </div>

            <div className="bg-indigo-50 p-4 rounded-lg mb-4 mx-20">
              <p className="text-indigo-800">
                <span className="font-bold">Interested in contributing?</span> The source code for this simulator
                is available on <a href="#" className="text-indigo-600 hover:text-indigo-800 underline">GitHub</a>.
                Pull requests for any of these improvements would be welcome!
              </p>
            </div>

            <button
              className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => setShowImprovements(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Footer Information */}
      <div className="mt-8 pt-4 border-t border-gray-200 text-center text-gray-600 text-sm bg-white shadow-inner p-4 rounded-lg">
        <p>© {new Date().getFullYear()} 8-Bit Computer Simulator. All rights reserved.</p>
        <p className="mt-1">
          This simulator is provided for educational purposes only and is not intended for commercial use.
        </p>
        <p className="mt-1">
          This is an educational tool designed to teach basic computer architecture principles.
          It is not affiliated with any commercial product or company.
        </p>
        <p className="mt-1"> Refers to the_
          <button
            className="text-indigo-600 hover:text-indigo-800 underline focus:outline-none"
            onClick={() => setShowTerms(true)}
          >
            Terms of Use
          </button> for more information. | All sample programs and code are released under the MIT License.
        </p>
        <p className="mt-1"> Refers to the_
          <button
            className="text-indigo-600 hover:text-indigo-800 underline focus:outline-none"
            onClick={() => setShowImprovements(true)}
          >
            Possible Improvements
          </button> for more information about potential improvements.
        </p>
        <p className="mt-1">Icons created by <button
          className="text-indigo-600 hover:text-indigo-800 underline focus:outline-none">
          <a
            href="https://www.flaticon.com/authors/ranksol-graphics"
            title="ui icons"
            target="_blank"
            rel="noopener noreferrer"
          >
            ranksol graphics </a></button>- Flaticon</p>
      </div>
    </div>
  );
};

export default EightBitSimulator;