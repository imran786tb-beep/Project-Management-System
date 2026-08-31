from django.db import models
from django.conf import settings
from apps.workspaces.models import Workspace, WorkspaceRole

class ProjectRole(models.TextChoices):
    OWNER = 'OWNER', 'Owner'
    ADMIN = 'ADMIN', 'Admin'
    MEMBER = 'MEMBER', 'Member'
    VIEWER = 'VIEWER', 'Viewer'

class Project(models.Model):
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='projects')
    name = models.CharField(max_length=100)
    key = models.CharField(max_length=10, help_text="Short key identifier like PRJ, DEV")
    description = models.TextField(blank=True, null=True)
    color = models.CharField(max_length=30, default='#6366F1') # Indigo default
    icon = models.CharField(max_length=50, default='FolderKanban')
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('workspace', 'key')

    def __str__(self):
        return f"{self.name} [{self.key}]"

class ProjectMember(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='project_memberships')
    role = models.CharField(max_length=20, choices=ProjectRole.choices, default=ProjectRole.MEMBER)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('project', 'user')

    def __str__(self):
        return f"{self.user.email} in {self.project.name} ({self.role})"

class BoardColumn(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='columns')
    name = models.CharField(max_length=60)
    color = models.CharField(max_length=30, default='#94A3B8') # Slate accent
    order = models.PositiveIntegerField(default=0)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.name} ({self.project.name})"
