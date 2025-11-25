from django.contrib import admin
from .models import Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'is_resolved', 'due_date', 'created_at', 'updated_at']
    list_filter = ['is_resolved', 'created_at', 'due_date']
    search_fields = ['title', 'description']
    list_editable = ['is_resolved']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    
    fieldsets = (
        ('Task Information', {
            'fields': ('title', 'description')
        }),
        ('Status & Dates', {
            'fields': ('is_resolved', 'due_date')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']

