from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Task, Subtask, TaskDependency, Label, Attachment
from .serializers import (
    TaskSerializer, SubtaskSerializer, TaskDependencySerializer, 
    LabelSerializer, AttachmentSerializer
)
from .filters import TaskFilter
from apps.collaboration.models import ActivityLog
from apps.notifications.models import Notification

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = TaskFilter
    search_fields = ['title', 'description']
    ordering_fields = ['priority', 'due_date', 'order', 'created_at']

    def get_queryset(self):
        user = self.request.user
        return Task.objects.filter(project__workspace__members__user=user).select_related('project', 'column', 'creator').prefetch_related('assignees', 'labels', 'subtasks').distinct()

    def perform_create(self, serializer):
        task = serializer.save(creator=self.request.user)
        # Log activity
        ActivityLog.objects.create(
            project=task.project,
            task=task,
            user=self.request.user,
            action_type='TASK_CREATED',
            description=f"Created task '{task.title}' ({task.task_key})"
        )

    def perform_update(self, serializer):
        task = serializer.save()
        ActivityLog.objects.create(
            project=task.project,
            task=task,
            user=self.request.user,
            action_type='TASK_UPDATED',
            description=f"Updated task '{task.title}'"
        )

    @action(detail=True, methods=['post'], url_path='move')
    def move_task(self, request, pk=None):
        task = self.get_object()
        target_column_id = request.data.get('column_id')
        new_order = request.data.get('order', 0)

        if target_column_id:
            old_column_name = task.column.name
            task.column_id = target_column_id
            task.order = new_order
            task.save()

            ActivityLog.objects.create(
                project=task.project,
                task=task,
                user=request.user,
                action_type='TASK_MOVED',
                description=f"Moved task '{task.title}' to {task.column.name} (from {old_column_name})"
            )

        serializer = self.get_serializer(task)
        return Response(serializer.data)

class SubtaskViewSet(viewsets.ModelViewSet):
    serializer_class = SubtaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Subtask.objects.all()

    def get_queryset(self):
        return Subtask.objects.filter(task__project__workspace__members__user=self.request.user).distinct()

class LabelViewSet(viewsets.ModelViewSet):
    serializer_class = LabelSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Label.objects.all()

    def get_queryset(self):
        return Label.objects.filter(project__workspace__members__user=self.request.user).distinct()

class TaskDependencyViewSet(viewsets.ModelViewSet):
    serializer_class = TaskDependencySerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = TaskDependency.objects.all()

class AttachmentViewSet(viewsets.ModelViewSet):
    serializer_class = AttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Attachment.objects.all()

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)
