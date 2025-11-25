from django import forms
from .models import Task


class TaskForm(forms.ModelForm):
    """Form for creating and editing Task instances."""
    
    class Meta:
        model = Task
        fields = ['title', 'description', 'due_date', 'is_resolved']
        widgets = {
            'title': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Enter task title',
                'required': True
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': 'Enter task description (optional)'
            }),
            'due_date': forms.DateTimeInput(attrs={
                'class': 'form-control',
                'type': 'datetime-local'
            }, format='%Y-%m-%dT%H:%M'),
            'is_resolved': forms.CheckboxInput(attrs={
                'class': 'form-check-input'
            })
        }
        labels = {
            'title': 'Task Title',
            'description': 'Description',
            'due_date': 'Due Date',
            'is_resolved': 'Mark as Resolved'
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Set the input format for datetime-local
        if self.instance and self.instance.due_date:
            self.initial['due_date'] = self.instance.due_date.strftime('%Y-%m-%dT%H:%M')

