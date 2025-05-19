# /backend/eightbit_simulator/simulator/admin.py
# Author: Amith Lokugamage
# Last Modified: May 18, 2025
"""
 * Django Admin Configuration for 8-bit Computer Simulator
 * 
 * This file configures the Django admin interface for the simulator app,
 * enabling administrators to manage instruction sets and example programs.
 * 
 * Features:
 * - Custom admin interface for instruction sets
 * - Custom admin interface for example programs
 * - Search and display configuration for admin UI
"""

from django.contrib import admin
from .models import InstructionSet, ExampleProgram, SimulatorSession

# Register the InstructionSet model with the admin site
# This allows administrators to view and edit instructions in the Django admin interface
@admin.register(InstructionSet)
class InstructionSetAdmin(admin.ModelAdmin):
    # Configure the list display to show these fields in the admin list view
    list_display = ('name', 'opcode', 'description')
    # Configure search functionality to search by these fields
    search_fields = ('name', 'opcode')

# Register the ExampleProgram model with the admin site
# This allows administrators to view and edit example programs in the Django admin interface
@admin.register(ExampleProgram)
class ExampleProgramAdmin(admin.ModelAdmin):
    # Configure the list display to show these fields in the admin list view
    list_display = ('name', 'description')
    # Configure search functionality to search by these fields
    search_fields = ('name', 'description', 'code')

# Register the SimulatorSession model with the admin site
# This allows administrators to view user session information in the Django admin interface
@admin.register(SimulatorSession)
class SimulatorSession(admin.ModelAdmin):
    # Configure the list display to show these fields in the admin list view
    list_display = ('session_id','user_ip','start_time','last_activity','code_executed')
    # Configure search functionality to search by these fields
    search_fields = ('session_id','user_ip')

    def has_change_permission(self, request, obj=None):
        # Disable edit permission completely
        return False
    
    def has_add_permission(self, request):
        # Disable add permission if you don't want new records created via admin
        return False
    
    def has_delete_permission(self, request, obj=None):
        # Disable delete permission if you don't want records deleted via admin
        return False