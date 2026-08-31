from django.db import models
from django.conf import settings
from apps.projects.models import Project, BoardColumn

class TaskPriority(models.TextChoices):
    LOW = 'LOW', 'Low'
    MEDIUM = 'MEDIUM', 'Medium'
    HIGH = 'HIGH', 'High'
    URGENT = 'URGENT', 'Urgent'

class Label(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='labels')
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=30, default='#3B82F6')

    class Meta:
        unique_together = ('project', 'name')

    def __str__(self):
        return f"{self.name} ({self.project.key})"

class Task(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    column = models.ForeignKey(BoardColumn, on_delete=models.CASCADE, related_name='tasks')
    task_number = models.PositiveIntegerField(editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    priority = models.CharField(max_length=20, choices=TaskPriority.choices, default=TaskPriority.MEDIUM)
    start_date = models.DateField(blank=True, null=True)
    due_date = models.DateField(blank=True, null=True)
    story_points = models.PositiveIntegerField(default=1)
    order = models.PositiveIntegerField(default=0)
    is_archived = models.BooleanField(default=False)
    
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_tasks')
    assignees = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name='assigned_tasks')
    labels = models.ManyToManyField(Label, blank=True, related_name='tasks')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', '-created_at']

    def save(self, *args, **kwargs):
        if not self.task_number:
            last_task = Task.objects.filter(project=self.project).order_by('-task_number').first()
            self.task_number = (last_task.task_number + 1) if last_task else 1
        super().save(*args, **kwargs)

    @property
    def task_key(self):
        return f"{self.project.key}-{self.task_number}"

    def __str__(self):
        return f"[{self.task_key}] {self.title}"

class Subtask(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='subtasks')
    title = models.CharField(max_length=255)
    is_completed = models.BooleanField(default=False)
    assignee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    due_date = models.DateField(blank=True, null=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.title} ({'✓' if self.is_completed else '✗'})"

class DependencyType(models.TextChoices):
    BLOCKS = 'BLOCKS', 'Blocks'
    BLOCKED_BY = 'BLOCKED_BY', 'Blocked By'

class TaskDependency(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='dependencies')
    depends_on = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='dependent_on_me')
    dependency_type = models.CharField(max_length=20, choices=DependencyType.choices, default=DependencyType.BLOCKED_BY)

    class Meta:
        unique_together = ('task', 'depends_on')

    def __str__(self):
        return f"{self.task.task_key} {self.dependency_type} {self.depends_on.task_key}"

class Attachment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='attachments/%Y/%m/', blank=True, null=True)
    file_url = models.TextField(blank=True, null=True, help_text="External or base64 file representation")
    file_name = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField(default=0, help_text="Size in bytes")
    file_type = models.CharField(max_length=50, blank=True, null=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.file_name} on {self.task.task_key}"
