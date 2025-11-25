from django.db import models
from django.utils import timezone


class Task(models.Model):
    """
    Model representing a TODO task.
    
    Fields:
    - title: The title/name of the task (required)
    - description: Optional detailed description of the task
    - due_date: Optional date and time when the task is due
    - is_resolved: Boolean flag indicating if the task is completed
    - created_at: Timestamp when the task was created (auto-set)
    - updated_at: Timestamp when the task was last updated (auto-updated)
    """
    title = models.CharField(max_length=200, help_text="Title of the task")
    description = models.TextField(blank=True, null=True, help_text="Detailed description of the task")
    due_date = models.DateTimeField(blank=True, null=True, help_text="Due date and time for the task")
    is_resolved = models.BooleanField(default=False, help_text="Whether the task is completed")
    created_at = models.DateTimeField(auto_now_add=True, help_text="When the task was created")
    updated_at = models.DateTimeField(auto_now=True, help_text="When the task was last updated")

    class Meta:
        ordering = ['-created_at']  # Order by newest first
        verbose_name = "Task"
        verbose_name_plural = "Tasks"

    def __str__(self):
        status = "✓" if self.is_resolved else "○"
        return f"{status} {self.title}"

    def is_overdue(self):
        """Check if the task is overdue (has a due date that has passed and is not resolved)."""
        if self.due_date and not self.is_resolved:
            return timezone.now() > self.due_date
        return False
