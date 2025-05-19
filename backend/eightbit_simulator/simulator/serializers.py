# /backend/eightbit_simulator/simulator/serializers.py
# Author: Amith Lokugamage
# Last Modified: May 18, 2025
"""
* API Serializers for the 8-bit Computer Simulator
*
* This file defines the serializers that convert between Django model instances
* and JSON representations for the REST API.
*
* Features:
* - Serializers for instruction sets, example programs, and user sessions
* - Field validation and format conversion
* - Definition of read-only fields for automatic values
"""

from rest_framework import serializers
from .models import InstructionSet, ExampleProgram, SimulatorSession


class InstructionSetSerializer(serializers.ModelSerializer):
    """
    Serializer for the InstructionSet model

    Converts InstructionSet model instances to JSON for the API,
    and validates incoming data when creating/updating instructions.
    """

    class Meta:
        model = InstructionSet  # The model to serialize
        fields = "__all__"  # Include all fields from the model


class ExampleProgramSerializer(serializers.ModelSerializer):
    """
    Serializer for the ExampleProgram model

    Converts ExampleProgram model instances to JSON for the API,
    and validates incoming data when creating/updating example programs.
    """

    class Meta:
        model = ExampleProgram  # The model to serialize
        fields = "__all__"  # Include all fields from the model


class SimulatorSessionSerializer(serializers.ModelSerializer):
    """
    Serializer for the SimulatorSession model

    Converts SimulatorSession model instances to JSON for the API,
    and validates incoming data when creating/updating sessions.
    """

    class Meta:
        model = SimulatorSession  # The model to serialize
        fields = "__all__"  # Include all fields from the model
        read_only_fields = (
            "session_id",
            "start_time",
        )  # These fields are auto-generated and shouldn't be modified
