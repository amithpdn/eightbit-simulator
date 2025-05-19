# /backend/eightbit_simulator/simulator/views.py
# Author: Amith Lokugamage
# Last Modified: May 18, 2025
"""
* API Views for the 8-bit Computer Simulator
*
* This file defines the API endpoints for the simulator application using Django REST Framework.
* It provides access to instruction sets, example programs, and session management functionality.
*
* Features:
* - Read-only endpoints for instruction set and example program data
* - Session creation and management endpoint
* - Custom action for recording executed code in a session
"""

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import InstructionSet, ExampleProgram, SimulatorSession
from .serializers import (
    InstructionSetSerializer,
    ExampleProgramSerializer,
    SimulatorSessionSerializer,
)
# import re


class InstructionSetViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for instruction set data

    Provides read-only access to the instruction set information.
    Uses ReadOnlyModelViewSet since instructions should not be created or modified via the API.
    """

    queryset = InstructionSet.objects.all()  # All instruction set entries
    serializer_class = (
        InstructionSetSerializer  # Serializer for converting to/from JSON
    )


class ExampleProgramViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for example programs

    Provides read-only access to example programs.
    Uses ReadOnlyModelViewSet since examples should not be created or modified via the API.
    """

    queryset = ExampleProgram.objects.all()  # All example programs
    serializer_class = (
        ExampleProgramSerializer  # Serializer for converting to/from JSON
    )


class SimulatorSessionViewSet(viewsets.ModelViewSet):
    """
    API endpoint for simulator sessions

    Manages user sessions with the simulator, including creating new sessions
    and recording executed code for analytics purposes.
    """

    queryset = SimulatorSession.objects.all()  # All simulator sessions
    serializer_class = (
        SimulatorSessionSerializer  # Serializer for converting to/from JSON
    )

    def create(self, request):
        """
        Create a new simulator session

        Overrides the default create method to automatically capture the user's IP address
        and create a session entry in the database.

        Args:
            request: The HTTP request object

        Returns:
            Response with the created session data and 201 status code
        """
        # Get client IP address
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[
                0
            ]  # Extract first IP if multiple IPs in header
        else:
            ip = request.META.get("REMOTE_ADDR")

        # Create session with the captured IP
        session = SimulatorSession(user_ip=ip)
        session.save()

        # Return the serialized session data
        serializer = self.serializer_class(session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def update_code(self, request, pk=None):
        """
        Custom action to update the code executed in a session

        Appends the newly executed code to the session's code history,
        storing it as a JSON array of objects with timestamps.

        Args:
            request: The HTTP request object containing the code
            pk: Primary key (session_id) of the session to update

        Returns:
            Response with status and entry count, or error if session not found
        """
        try:
            import json
            from datetime import datetime

            # Find the session by its primary key (session_id)
            session = SimulatorSession.objects.get(session_id=pk)

            # Get existing code history (or initialize empty list)
            if session.code_executed:
                try:
                    code_history = json.loads(session.code_executed)
                except json.JSONDecodeError:
                    # If existing data isn't valid JSON, start fresh
                    code_history = []
            else:
                code_history = []

            # Add new code entry with timestamp
            code_history.append(
                {
                    "timestamp": datetime.now().isoformat(),
                    "code": request.data.get("code"),
                }
            )

            # Save updated history back to database
            session.code_executed = json.dumps(code_history)
            session.save()

            return Response({"status": "code updated", "entries": len(code_history)})
        except SimulatorSession.DoesNotExist:
            return Response(
                {"error": "Session not found"}, status=status.HTTP_404_NOT_FOUND
            )
