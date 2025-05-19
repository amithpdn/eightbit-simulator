// \frontend\src\api\cpu.js

// CPU simulator core logic

class CPU {
  constructor() {
    // CPU components initialization
    this.registerA = 0;              // Accumulator register
    this.registerB = 0;              // Secondary register (not actively used in current implementation)
    this.programCounter = 0;         // Tracks current execution position in memory
    this.instructionRegister = 0;    // Holds the current instruction being executed
    this.flags = {
      zero: false,                   // Set when a result is zero
      carry: false                   // Set when an operation causes overflow/underflow
    };
    this.outputRegister = 0;         // Holds output value from the OUT instruction
    
    // ALU (Arithmetic Logic Unit) state tracking
    this.alu = {
      operation: 'NONE',  // Current operation (ADD, SUB, etc.)
      inputA: 0,          // Input from Register A
      inputB: 0,          // Input from Register B or memory
      result: 0,          // Result of operation
      active: false       // Whether ALU is currently active
    };

    // Mapping between program counter and source code line numbers
    // Used for highlighting current line in the editor
    this.pcToLineMap = {};
    this.currentSourceLine = 0;

    // Memory components
    this.rom = new Uint8Array(256);  // 256 bytes of ROM (program storage)
    this.ram = new Uint8Array(256);  // 256 bytes of RAM (data storage)
    this.currentRamAddress = null;   // Tracks current RAM address being accessed

    // Instruction set definition
    // Format: [opcode, operand_count, execution_function]
    this.instructionSet = {

      // No Operation - does nothing
      NOP: [0x00, 0, () => {
        this.activeComponents = {
          alu: false,
          ram: false,
          rom: true,
          register_a: false,
          register_b: false,
          instruction_register: true,
          program_counter: true,
          output_register: false
        };

      }],

      // Load Accumulator - loads value from RAM address into Register A
      LDA: [0x01, 1, (addr) => {

        this.activeComponents = {
          alu: false,
          ram: true,
          rom: true,
          register_a: true,
          register_b: false,
          instruction_register: true,
          program_counter: true,
          output_register: false
        };

        this.currentRamAddress = addr;    // Track current RAM address being accessed
        this.registerA = this.ram[addr];  // Load value from RAM into Register A
        this.updateFlags(this.registerA); // Update zero flag based on loaded value
      }],

      // Add - adds value from RAM address to Register A
      ADD: [0x02, 1, (addr) => {

        this.activeComponents = {
          alu: true,
          ram: true,
          rom: true,
          register_a: true,
          register_b: false,
          instruction_register: true,
          program_counter: true,
          output_register: false
        };

        this.currentRamAddress = addr;

        // Set up ALU for addition operation
        this.alu.operation = 'ADD';
        this.alu.inputA = this.registerA;
        this.alu.inputB = this.ram[addr];

        // Perform addition and mask to 8 bits (0-255)
        this.alu.result = (this.alu.inputA + this.alu.inputB) & 0xFF;
        
        // Update register with result
        this.registerA = this.alu.result;

        // Update flags
        this.flags.carry = (this.alu.inputA + this.alu.inputB) > 255;  // Set carry if result exceeded 8 bits
        this.updateFlags(this.registerA);                              // Update zero flag
      }],

      // Subtract - subtracts value from RAM address from Register A
      SUB: [0x03, 1, (addr) => {

        this.activeComponents = {
          alu: true,
          ram: true,
          rom: true,
          register_a: true,
          register_b: false,
          instruction_register: true,
          program_counter: true,
          output_register: false
        };

        this.currentRamAddress = addr;

        // Set up ALU for subtraction operation
        this.alu.operation = 'SUB';
        this.alu.inputA = this.registerA;
        this.alu.inputB = this.ram[addr];

         // Perform subtraction and mask to 8 bits (0-255)
        this.alu.result = (this.alu.inputA - this.alu.inputB) & 0xFF;
        this.alu.active = true;

        // Update register with result
        this.registerA = this.alu.result;

        // Update flags
        this.flags.carry = (this.alu.inputA - this.alu.inputB) < 0;     // Set carry if result was negative
        this.updateFlags(this.registerA);                               // Update zero flag
      }],

      // Store Accumulator - stores value from Register A into RAM address      
      STA: [0x04, 1, (addr) => {

        this.activeComponents = {
          alu: false,
          ram: true,
          rom: true,
          register_a: true,
          register_b: false,
          instruction_register: true,
          program_counter: true,
          output_register: false
        };

        this.ram[addr] = this.registerA;   // Store value from Register A to RAM
      }],

      // Load Immediate - loads immediate value into Register A
      LDI: [0x05, 1, (value) => {

        this.activeComponents = {
          alu: false,
          ram: false,
          rom: true,
          register_a: true,
          register_b: false,
          instruction_register: true,
          program_counter: true,
          output_register: false
        };

        this.registerA = value;                // Load immediate value into Register A
        this.updateFlags(this.registerA);      // Update zero flag

      }],

      // Jump - sets program counter to specified address
      JMP: [0x06, 1, (addr) => {
        this.activeComponents = {
          alu: false,
          ram: false,
          rom: true,
          register_a: false,
          register_b: false,
          instruction_register: true,
          program_counter: true,
          output_register: false
        };

        this.programCounter = addr;  // Jump to specified address
      }],

      // Jump if Carry - jumps if carry flag is set
      JC: [0x07, 1, (addr) => {

        this.activeComponents = {
          alu: false,
          ram: false,
          rom: true,
          register_a: false,
          register_b: false,
          instruction_register: true,
          program_counter: true,
          output_register: false
        };

        if (this.flags.carry) this.programCounter = addr;   // Jump only if carry flag is set
      }],

      // Jump if Zero - jumps if zero flag is set
      JZ: [0x08, 1, (addr) => {
        this.activeComponents = {
          alu: false,
          ram: false,
          rom: true,
          register_a: false,
          register_b: false,
          instruction_register: true,
          program_counter: true,
          output_register: false
        };

        if (this.flags.zero) this.programCounter = addr;    // Jump only if zero flag is set
      }],

      // Output - copies Register A value to output register
      OUT: [0x09, 0, () => {

        this.activeComponents = {
          alu: false,
          ram: false,
          rom: true,
          register_a: true,
          register_b: false,
          instruction_register: true,
          program_counter: true,
          output_register: true
        };

        this.outputRegister = this.registerA;    // Output value from Register A
      }],

      // Halt - stops program execution
      HLT: [0x0F, 0, () => {
        this.activeComponents = {
          alu: false,
          ram: false,
          rom: true,
          register_a: false,
          register_b: false,
          instruction_register: true,
          program_counter: true,
          output_register: false
        };

        return 'HALT';   // Return HALT signal to stop execution
      }]
    };

    // Active components tracking for visualization
    // Used to highlight active components in the UI
    this.activeComponents = {
      alu: false,
      ram: false,
      rom: false,
      register_a: false,
      register_b: false,
      instruction_register: false,
      program_counter: false,
      output_register: false
    };

    this.clockSpeed = 1;   // Default clock speed in Hz
    this.running = false;  // Execution state
    this.timer = null;     // Timer for continuous execution
  }

  // Update the zero flag based on register value
  updateFlags(value) {
    this.flags.zero = (value === 0);    // Set zero flag if value is zero
  }

  // Reset the CPU to initial state
  reset() {
    // Reset all registers and flags
    this.registerA = 0;
    this.registerB = 0;
    this.programCounter = 0;
    this.instructionRegister = 0;
    this.flags.zero = false;
    this.flags.carry = false;
    this.running = false;
    this.outputRegister = 0;

    // Reset line tracking
    this.currentSourceLine = 0;

    // Clear ROM
    for (let i = 0; i < this.rom.length; i++) {
      this.rom[i] = 0;
    }
    // Clear RAM
    for (let i = 0; i < this.ram.length; i++) {
      this.ram[i] = 0;
    }

    // Stop any running execution
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    // Reset active components visualization
    Object.keys(this.activeComponents).forEach(key => {
      this.activeComponents[key] = false;
    });
    this.activeComponents.program_counter = true;       // PC is initially active
  }

  // Load program into ROM
  loadProgram(program) {

    // Store the line mapping before reset
    const savedMapping = { ...this.pcToLineMap };

    // Reset CPU state
    this.reset();

    // Restore the line mapping after reset
    this.pcToLineMap = savedMapping;

    // Clear ROM
    for (let i = 0; i < this.rom.length; i++) {
      this.rom[i] = 0;
    }

    // Clear RAM
    for (let i = 0; i < this.ram.length; i++) {
      this.ram[i] = 0;
    }

    // Load program into ROM
    for (let i = 0; i < program.length && i < this.rom.length; i++) {
      this.rom[i] = program[i];
    }
  }

  // Assemble code from assembly to machine code
  assembleCode(code) {
    const lines = code.trim().split('\n');
    const machineCode = [];

    // Clear the existing mapping
    this.pcToLineMap = {};

    // First pass - collect labels
    const labels = {};
    let currentAddress = 0;

    // Filter out empty lines and comments for line tracking
    const codeLines = lines.filter((line, index) => {
      const trimmedLine = line.trim();
      return !(trimmedLine === '' || trimmedLine.startsWith(';'));
    });

    // Map line indices to their actual positions in the original code
    // This creates a mapping between filtered code lines and original line numbers
    const lineIndexMap = {};
    let codeLineIndex = 0;
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!(trimmedLine === '' || trimmedLine.startsWith(';'))) {
        lineIndexMap[codeLineIndex] = index;
        codeLineIndex++;
      }
    });

    // Build Program Count to source line mapping using labels
    codeLines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Check for labels (e.g., "LOOP:")
      if (trimmedLine.includes(':')) {
        const labelParts = trimmedLine.split(':');
        const labelName = labelParts[0].trim();
        labels[labelName] = currentAddress;   // Store label address

        // Map this address to the source line
        this.pcToLineMap[currentAddress] = lineIndexMap[index];

        // If there's code after the label, process it
        const remainingCode = labelParts[1].trim();
        if (remainingCode) {
          const parts = remainingCode.split(/\s+/);
          const instruction = parts[0].toUpperCase();
          if (this.instructionSet[instruction]) {
            // Increment address based on instruction size (opcode + operands)
            currentAddress += 1 + this.instructionSet[instruction][1];
          }
        }
      } else {
        // Map this Program Count address to the source line number
        this.pcToLineMap[currentAddress] = lineIndexMap[index];

        // Process the instruction to determine its size
        const parts = trimmedLine.split(/\s+/);
        const instruction = parts[0].toUpperCase();
        if (this.instructionSet[instruction]) {
          // Increment address based on instruction size (opcode + operands)
          currentAddress += 1 + this.instructionSet[instruction][1];
        }
      }
    });

    // Second pass - generate machine code
    codeLines.forEach((line) => {
      const trimmedLine = line.trim();

      // Handle labels
      let instructionLine = trimmedLine;
      if (trimmedLine.includes(':')) {
        const labelParts = trimmedLine.split(':');
        instructionLine = labelParts[1].trim();
        if (!instructionLine) return;               // Skip if only a label with no instruction
      }

      // Parse instruction
      const parts = instructionLine.split(/\s+/);
      const instruction = parts[0].toUpperCase();
      let operand = parts.length > 1 ? parts[1] : null;

      // Check if instruction exists
      if (!this.instructionSet[instruction]) {
        console.error(`Unknown instruction: ${instruction}`);
        return;
      }

      // Add opcode to machine code
      const opcode = this.instructionSet[instruction][0];
      machineCode.push(opcode);

      // Add operand if needed
      if (this.instructionSet[instruction][1] > 0 && operand) {
        // Check if operand is a label
        if (isNaN(operand) && labels[operand] !== undefined) {
          operand = labels[operand];                                   // Replace label with its address
        }

        // Add operand value to machine code (ensure it's within 8-bit range)
        machineCode.push(parseInt(operand) & 0xFF);
      }

      // Track the address for next instruction
      currentAddress += 1 + (this.instructionSet[instruction][1] > 0 ? 1 : 0);
    });

    return machineCode;
  }

  // Execute a single instruction cycle
  step() {

    // Get source line for current Program Counter
    this.currentSourceLine = this.pcToLineMap[this.programCounter] || 0;

    // Reset active components for visualization
    Object.keys(this.activeComponents).forEach(key => {
      this.activeComponents[key] = false;
    });

    // FETCH CYCLE - Read from ROM into instruction register
    this.activeComponents.rom = true;
    this.activeComponents.program_counter = true;
    this.instructionRegister = this.rom[this.programCounter];
    this.activeComponents.instruction_register = true;

    // DECODE CYCLE - Determine which instruction to execute
    let instruction = null;
    let operand = null;

    // Find the instruction based on opcode
    for (const [name, details] of Object.entries(this.instructionSet)) {
      if (details[0] === this.instructionRegister) {
        instruction = name;

        // Increment Program Counter and get operand if needed
        if (details[1] > 0) {
          this.programCounter++;
          operand = this.rom[this.programCounter];
        }

        break;
      }
    }

    // Increment Program Counter for next instruction
    this.programCounter++;

    // If instruction not found, treat as NOP
    if (!instruction) {
      return;
    }

    // EXECUTE CYCLE - Run the instruction
    this.activeComponents.alu = true;
    const [_, __, executeFn] = this.instructionSet[instruction];

    // Activate relevant components based on instruction
    if (['LDA', 'ADD', 'SUB', 'LDI'].includes(instruction)) {
      this.activeComponents.register_a = true;
      if (['LDA', 'ADD', 'SUB'].includes(instruction)) {
        this.activeComponents.ram = true;
      }
    } else if (instruction === 'STA') {
      this.activeComponents.register_a = true;
      this.activeComponents.ram = true;
    } else if (instruction === 'OUT') {
      this.activeComponents.output_register = true;
      this.activeComponents.register_a = true;
    }

    // Execute the instruction
    const result = executeFn(operand);

    // Return HALT if needed to stop execution
    return result === 'HALT' ? 'HALT' : null;
  }

  // Run the program continuously
  run() {
    if (this.running) return;      // Don't start if already running

    this.running = true;



    // Set up interval based on clock speed
    this.timer = setInterval(() => {
      const result = this.step();

      // Stop execution if HALT instruction is encountered or program end is reached
      if (result === 'HALT' || this.programCounter >= this.rom.length) {
        this.stop();
      }
    }, 1000 / this.clockSpeed); // Convert Hz to milliseconds
  }

  // Stop program execution
  stop() {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // Set clock speed in Hz
  setClockSpeed(speed) {
    this.clockSpeed = speed;

    // Update the timer if running
    if (this.running && this.timer) {
      clearInterval(this.timer);
      this.run();
    }
  }

  // Get current state for display
  getState() {
    return {
      registerA: this.registerA,
      registerB: this.registerB,
      programCounter: this.programCounter,
      instructionRegister: this.instructionRegister,
      flags: { ...this.flags },
      rom: [...this.rom],
      ram: [...this.ram],
      alu: { ...this.alu },
      activeComponents: { ...this.activeComponents },
      currentRamAddress: this.currentRamAddress,
      outputRegister: this.outputRegister,
      currentSourceLine: this.currentSourceLine
    };
  }
}


export default CPU;