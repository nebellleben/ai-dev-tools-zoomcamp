from django.test import TestCase, Client
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
from .models import Task
from .forms import TaskForm


class TaskModelTest(TestCase):
    """Test cases for the Task model."""
    
    def setUp(self):
        """Set up test data."""
        self.task = Task.objects.create(
            title="Test Task",
            description="Test description",
            is_resolved=False
        )
    
    def test_task_creation(self):
        """Test that a task can be created."""
        self.assertEqual(self.task.title, "Test Task")
        self.assertEqual(self.task.description, "Test description")
        self.assertFalse(self.task.is_resolved)
        self.assertIsNotNone(self.task.created_at)
        self.assertIsNotNone(self.task.updated_at)
    
    def test_task_string_representation(self):
        """Test the string representation of a task."""
        # Unresolved task
        self.assertIn("○", str(self.task))
        self.assertIn("Test Task", str(self.task))
        
        # Resolved task
        self.task.is_resolved = True
        self.task.save()
        self.assertIn("✓", str(self.task))
    
    def test_task_is_overdue_with_past_due_date(self):
        """Test is_overdue() returns True for unresolved task with past due date."""
        past_date = timezone.now() - timedelta(days=1)
        self.task.due_date = past_date
        self.task.is_resolved = False
        self.task.save()
        self.assertTrue(self.task.is_overdue())
    
    def test_task_is_overdue_with_future_due_date(self):
        """Test is_overdue() returns False for task with future due date."""
        future_date = timezone.now() + timedelta(days=1)
        self.task.due_date = future_date
        self.task.is_resolved = False
        self.task.save()
        self.assertFalse(self.task.is_overdue())
    
    def test_task_is_overdue_without_due_date(self):
        """Test is_overdue() returns False when no due date is set."""
        self.task.due_date = None
        self.task.save()
        self.assertFalse(self.task.is_overdue())
    
    def test_task_is_overdue_when_resolved(self):
        """Test is_overdue() returns False even if due date passed but task is resolved."""
        past_date = timezone.now() - timedelta(days=1)
        self.task.due_date = past_date
        self.task.is_resolved = True
        self.task.save()
        self.assertFalse(self.task.is_overdue())
    
    def test_task_ordering(self):
        """Test that tasks are ordered by created_at descending (newest first)."""
        task1 = Task.objects.create(title="First Task")
        task2 = Task.objects.create(title="Second Task")
        task3 = Task.objects.create(title="Third Task")
        
        tasks = list(Task.objects.all()[:3])
        # Should be ordered newest first
        self.assertEqual(tasks[0].title, "Third Task")
        self.assertEqual(tasks[1].title, "Second Task")
        self.assertEqual(tasks[2].title, "First Task")


class TaskFormTest(TestCase):
    """Test cases for the TaskForm."""
    
    def test_valid_form(self):
        """Test form with valid data."""
        form_data = {
            'title': 'New Task',
            'description': 'Task description',
            'is_resolved': False
        }
        form = TaskForm(data=form_data)
        self.assertTrue(form.is_valid())
    
    def test_form_with_required_title(self):
        """Test that title is required."""
        form_data = {
            'description': 'Task description',
        }
        form = TaskForm(data=form_data)
        self.assertFalse(form.is_valid())
        self.assertIn('title', form.errors)
    
    def test_form_with_optional_fields(self):
        """Test form with optional fields (description, due_date)."""
        form_data = {
            'title': 'Task without optional fields',
        }
        form = TaskForm(data=form_data)
        self.assertTrue(form.is_valid())
    
    def test_form_saves_task(self):
        """Test that form can save a task."""
        form_data = {
            'title': 'Save Test Task',
            'description': 'Description',
            'is_resolved': True
        }
        form = TaskForm(data=form_data)
        self.assertTrue(form.is_valid())
        task = form.save()
        self.assertEqual(task.title, 'Save Test Task')
        self.assertTrue(task.is_resolved)


class TaskListViewTest(TestCase):
    """Test cases for the task list view."""
    
    def setUp(self):
        """Set up test data."""
        self.client = Client()
        self.task1 = Task.objects.create(title="Active Task 1", is_resolved=False)
        self.task2 = Task.objects.create(title="Active Task 2", is_resolved=False)
        self.task3 = Task.objects.create(title="Completed Task", is_resolved=True)
    
    def test_task_list_view_status_code(self):
        """Test that task list view returns 200."""
        response = self.client.get(reverse('todos:task_list'))
        self.assertEqual(response.status_code, 200)
    
    def test_task_list_view_uses_correct_template(self):
        """Test that task list view uses the correct template."""
        response = self.client.get(reverse('todos:task_list'))
        self.assertTemplateUsed(response, 'todos/home.html')
    
    def test_task_list_displays_all_tasks(self):
        """Test that all tasks are displayed."""
        response = self.client.get(reverse('todos:task_list'))
        self.assertContains(response, "Active Task 1")
        self.assertContains(response, "Active Task 2")
        self.assertContains(response, "Completed Task")
    
    def test_task_list_filter_active(self):
        """Test filtering tasks by active status."""
        response = self.client.get(reverse('todos:task_list'), {'filter': 'active'})
        self.assertContains(response, "Active Task 1")
        self.assertContains(response, "Active Task 2")
        self.assertNotContains(response, "Completed Task")
    
    def test_task_list_filter_completed(self):
        """Test filtering tasks by completed status."""
        response = self.client.get(reverse('todos:task_list'), {'filter': 'completed'})
        self.assertNotContains(response, "Active Task 1")
        self.assertNotContains(response, "Active Task 2")
        self.assertContains(response, "Completed Task")
    
    def test_task_list_filter_overdue(self):
        """Test filtering tasks by overdue status."""
        # Create an overdue task
        past_date = timezone.now() - timedelta(days=1)
        overdue_task = Task.objects.create(
            title="Overdue Task",
            due_date=past_date,
            is_resolved=False
        )
        
        response = self.client.get(reverse('todos:task_list'), {'filter': 'overdue'})
        self.assertContains(response, "Overdue Task")
    
    def test_task_list_statistics(self):
        """Test that statistics are displayed correctly."""
        response = self.client.get(reverse('todos:task_list'))
        self.assertEqual(response.context['total_tasks'], 3)
        self.assertEqual(response.context['active_tasks'], 2)
        self.assertEqual(response.context['completed_tasks'], 1)


class TaskCreateViewTest(TestCase):
    """Test cases for the task create view."""
    
    def setUp(self):
        """Set up test data."""
        self.client = Client()
    
    def test_task_create_view_get(self):
        """Test GET request to task create view."""
        response = self.client.get(reverse('todos:task_create'))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'todos/task_form.html')
        self.assertIsInstance(response.context['form'], TaskForm)
    
    def test_task_create_view_post_valid(self):
        """Test POST request with valid data creates a task."""
        form_data = {
            'title': 'New Task',
            'description': 'Task description',
            'is_resolved': False
        }
        response = self.client.post(reverse('todos:task_create'), data=form_data)
        
        # Should redirect to task list
        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, reverse('todos:task_list'))
        
        # Task should be created
        self.assertTrue(Task.objects.filter(title='New Task').exists())
    
    def test_task_create_view_post_invalid(self):
        """Test POST request with invalid data shows form errors."""
        form_data = {
            'description': 'Task without title',
        }
        response = self.client.post(reverse('todos:task_create'), data=form_data)
        
        # Should return 200 with form errors
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.context['form'].is_valid())
        
        # Task should not be created
        self.assertFalse(Task.objects.filter(description='Task without title').exists())


class TaskEditViewTest(TestCase):
    """Test cases for the task edit view."""
    
    def setUp(self):
        """Set up test data."""
        self.client = Client()
        self.task = Task.objects.create(
            title="Original Title",
            description="Original description",
            is_resolved=False
        )
    
    def test_task_edit_view_get(self):
        """Test GET request to task edit view."""
        response = self.client.get(reverse('todos:task_edit', args=[self.task.pk]))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'todos/task_form.html')
        self.assertEqual(response.context['task'], self.task)
        self.assertEqual(response.context['form'].instance, self.task)
    
    def test_task_edit_view_post_valid(self):
        """Test POST request with valid data updates the task."""
        form_data = {
            'title': 'Updated Title',
            'description': 'Updated description',
            'is_resolved': True
        }
        response = self.client.post(
            reverse('todos:task_edit', args=[self.task.pk]),
            data=form_data
        )
        
        # Should redirect to task list
        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, reverse('todos:task_list'))
        
        # Task should be updated
        self.task.refresh_from_db()
        self.assertEqual(self.task.title, 'Updated Title')
        self.assertEqual(self.task.description, 'Updated description')
        self.assertTrue(self.task.is_resolved)
    
    def test_task_edit_view_404(self):
        """Test that editing non-existent task returns 404."""
        response = self.client.get(reverse('todos:task_edit', args=[99999]))
        self.assertEqual(response.status_code, 404)


class TaskDeleteViewTest(TestCase):
    """Test cases for the task delete view."""
    
    def setUp(self):
        """Set up test data."""
        self.client = Client()
        self.task = Task.objects.create(title="Task to Delete")
    
    def test_task_delete_view_get(self):
        """Test GET request to task delete view shows confirmation."""
        response = self.client.get(reverse('todos:task_delete', args=[self.task.pk]))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'todos/task_confirm_delete.html')
        self.assertEqual(response.context['task'], self.task)
    
    def test_task_delete_view_post(self):
        """Test POST request deletes the task."""
        task_id = self.task.pk
        response = self.client.post(reverse('todos:task_delete', args=[task_id]))
        
        # Should redirect to task list
        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, reverse('todos:task_list'))
        
        # Task should be deleted
        self.assertFalse(Task.objects.filter(pk=task_id).exists())
    
    def test_task_delete_view_404(self):
        """Test that deleting non-existent task returns 404."""
        response = self.client.get(reverse('todos:task_delete', args=[99999]))
        self.assertEqual(response.status_code, 404)


class TaskToggleResolvedViewTest(TestCase):
    """Test cases for the task toggle resolved view."""
    
    def setUp(self):
        """Set up test data."""
        self.client = Client()
        self.task = Task.objects.create(title="Test Task", is_resolved=False)
    
    def test_toggle_resolved_from_false_to_true(self):
        """Test toggling unresolved task to resolved."""
        self.assertFalse(self.task.is_resolved)
        
        response = self.client.get(reverse('todos:task_toggle_resolved', args=[self.task.pk]))
        
        # Should redirect to task list
        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, reverse('todos:task_list'))
        
        # Task should be resolved
        self.task.refresh_from_db()
        self.assertTrue(self.task.is_resolved)
    
    def test_toggle_resolved_from_true_to_false(self):
        """Test toggling resolved task to unresolved."""
        self.task.is_resolved = True
        self.task.save()
        
        response = self.client.get(reverse('todos:task_toggle_resolved', args=[self.task.pk]))
        
        # Should redirect to task list
        self.assertEqual(response.status_code, 302)
        
        # Task should be unresolved
        self.task.refresh_from_db()
        self.assertFalse(self.task.is_resolved)
    
    def test_toggle_resolved_404(self):
        """Test that toggling non-existent task returns 404."""
        response = self.client.get(reverse('todos:task_toggle_resolved', args=[99999]))
        self.assertEqual(response.status_code, 404)


class TaskURLTest(TestCase):
    """Test cases for URL routing."""
    
    def test_task_list_url(self):
        """Test that task list URL is accessible."""
        url = reverse('todos:task_list')
        self.assertEqual(url, '/')
    
    def test_task_create_url(self):
        """Test that task create URL is accessible."""
        url = reverse('todos:task_create')
        self.assertEqual(url, '/create/')
    
    def test_task_edit_url(self):
        """Test that task edit URL is accessible."""
        url = reverse('todos:task_edit', args=[1])
        self.assertEqual(url, '/1/edit/')
    
    def test_task_delete_url(self):
        """Test that task delete URL is accessible."""
        url = reverse('todos:task_delete', args=[1])
        self.assertEqual(url, '/1/delete/')
    
    def test_task_toggle_resolved_url(self):
        """Test that task toggle resolved URL is accessible."""
        url = reverse('todos:task_toggle_resolved', args=[1])
        self.assertEqual(url, '/1/toggle/')
