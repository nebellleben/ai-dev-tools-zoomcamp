from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.utils import timezone
from .models import Task
from .forms import TaskForm


def task_list(request):
    """Display a list of all tasks."""
    tasks = Task.objects.all()
    
    # Filter options
    filter_type = request.GET.get('filter', 'all')
    if filter_type == 'active':
        tasks = tasks.filter(is_resolved=False)
    elif filter_type == 'completed':
        tasks = tasks.filter(is_resolved=True)
    elif filter_type == 'overdue':
        tasks = [task for task in tasks if task.is_overdue()]
    
    context = {
        'tasks': tasks,
        'filter_type': filter_type,
        'total_tasks': Task.objects.count(),
        'active_tasks': Task.objects.filter(is_resolved=False).count(),
        'completed_tasks': Task.objects.filter(is_resolved=True).count(),
    }
    return render(request, 'todos/home.html', context)


def task_create(request):
    """Create a new task."""
    if request.method == 'POST':
        form = TaskForm(request.POST)
        if form.is_valid():
            task = form.save()
            messages.success(request, f'Task "{task.title}" created successfully!')
            return redirect('todos:task_list')
    else:
        form = TaskForm()
    
    return render(request, 'todos/task_form.html', {
        'form': form,
        'title': 'Create New Task'
    })


def task_edit(request, pk):
    """Edit an existing task."""
    task = get_object_or_404(Task, pk=pk)
    
    if request.method == 'POST':
        form = TaskForm(request.POST, instance=task)
        if form.is_valid():
            task = form.save()
            messages.success(request, f'Task "{task.title}" updated successfully!')
            return redirect('todos:task_list')
    else:
        form = TaskForm(instance=task)
    
    return render(request, 'todos/task_form.html', {
        'form': form,
        'task': task,
        'title': 'Edit Task'
    })


def task_delete(request, pk):
    """Delete a task."""
    task = get_object_or_404(Task, pk=pk)
    
    if request.method == 'POST':
        task_title = task.title
        task.delete()
        messages.success(request, f'Task "{task_title}" deleted successfully!')
        return redirect('todos:task_list')
    
    return render(request, 'todos/task_confirm_delete.html', {'task': task})


def task_toggle_resolved(request, pk):
    """Toggle the resolved status of a task."""
    task = get_object_or_404(Task, pk=pk)
    task.is_resolved = not task.is_resolved
    task.save()
    
    status = 'completed' if task.is_resolved else 'reopened'
    messages.success(request, f'Task "{task.title}" marked as {status}!')
    return redirect('todos:task_list')
