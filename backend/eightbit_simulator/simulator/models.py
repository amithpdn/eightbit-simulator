from django.db import models
import uuid

class InstructionSet(models.Model):
    """
    Represents a CPU instruction in the 8-bit computer architecture
    
    Each instruction has a name, opcode (in hex), and a description
    of what the instruction does.
    """
    name = models.CharField(max_length=100)       # Instruction name (e.g., "LDA", "ADD")
    opcode = models.CharField(max_length=8)       # Hex representation of the opcode
    description = models.TextField()              # Human-readable description of the instruction
    
    def __str__(self):
        """String representation for admin and debugging"""
        return f"{self.name} ({self.opcode})"

class ExampleProgram(models.Model):
    """
    Represents an example program for the simulator
    
    Contains a name, description, and the actual assembly code
    that users can load into the simulator.
    """
    name = models.CharField(max_length=100)       # Program name displayed in the UI
    description = models.TextField()              # Description of what the program does
    code = models.TextField()                     # The actual assembly code

    name = models.CharField(max_length=100)
    description = models.TextField()
    code = models.TextField()
    
    def __str__(self):
        """String representation for admin and debugging"""
        return self.name


class SimulatorSession(models.Model):
    """
    Tracks user sessions with the simulator
    
    Records information about when users interact with the simulator,
    what code they execute, and allows for usage analytics.
    """
    # Using UUID as primary key for better security and uniqueness
    session_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_ip = models.GenericIPAddressField()                                               # IP address of the user (for analytics)
    start_time = models.DateTimeField(auto_now_add=True)                                   # When the session started
    last_activity = models.DateTimeField(auto_now=True)                                    # When the session was last active
    code_executed = models.TextField(blank=True, null=True)                                # JSON string of code executed during the session

    
    def __str__(self):
        """String representation for admin and debugging"""
        return f"Session {self.session_id} - {self.start_time}"