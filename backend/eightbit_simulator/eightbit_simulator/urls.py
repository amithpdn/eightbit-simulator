# /backend/eightbit_simulator/eightbit_simulator/urls.py
# Author: Amith Lokugamage
# Last Modified: May 18, 2025
"""
 * URL Configuration for 8-bit Computer Simulator
 * 
 * This file defines the URL patterns for the simulator application,
 * including API endpoints and administrative interfaces.
 * 
 * Features:
 * - API URL configuration using Django REST Framework routers
 * - Registration of viewsets for simulator components
 * - Admin site URL configuration
"""

from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from simulator.views import InstructionSetViewSet, ExampleProgramViewSet, SimulatorSessionViewSet


# Configure the REST API router
router = DefaultRouter()
router.register(r'instruction-sets', InstructionSetViewSet)
router.register(r'example-programs', ExampleProgramViewSet)
router.register(r'sessions', SimulatorSessionViewSet)

urlpatterns = [
    # Django admin site
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/', include(router.urls)),
]