from django.contrib import admin
from .models import InstructionSet, ExampleProgram

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
