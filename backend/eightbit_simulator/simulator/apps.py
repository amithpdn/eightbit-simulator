# /backend/eightbit_simulator/simulator/apps.py
# Author: Amith Lokugamage
# Last Modified: May 18, 2025
"""
* Django App Configuration for 8-bit Computer Simulator
*
* This file configures the Django app for the simulator,
* providing metadata about the application.
*
* Features:
* - App name and label configuration
* - Default field type for auto-created primary keys
"""

from django.apps import AppConfig


class SimulatorConfig(AppConfig):
    # Use BigAutoField for primary keys (larger range than AutoField)
    default_auto_field = "django.db.models.BigAutoField"

    # Application name used in settings.INSTALLED_APPS
    name = "simulator"
