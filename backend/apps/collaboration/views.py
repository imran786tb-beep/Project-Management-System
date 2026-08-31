from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Comment, Reaction, ActivityLog
from .serializers import CommentSerializer, ReactionSerializer, ActivityLogSerializer
from apps.notifications.models import Notification

class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        task_id = self.request.query_params.get('task')
        queryset = Comment.objects.filter(task__project__workspace__members__user=user)
        if task_id:
            queryset = queryset.filter(task_id=task_id)
        return queryset.select_related('author').prefetch_related('mentions', 'reactions', 'replies').distinct()

    def perform_create(self, serializer):
        comment = serializer.save(author=self.request.user)

        # Notify task assignees
        task = comment.task
        for assignee in task.assignees.exclude(id=self.request.user.id):
            Notification.objects.create(
                recipient=assignee,
                sender=self.request.user,
                verb='COMMENTED',
                target_type='TASK',
                target_id=task.id,
                title=f"New comment on {task.task_key}",
                message=f"{self.request.user.full_name} commented: '{comment.content[:60]}...'"
            )

        # Notify mentions
        mentions = comment.mentions.exclude(id=self.request.user.id)
        for mentioned_user in mentions:
            Notification.objects.create(
                recipient=mentioned_user,
                sender=self.request.user,
                verb='MENTIONED',
                target_type='TASK',
                target_id=task.id,
                title=f"You were mentioned in {task.task_key}",
                message=f"{self.request.user.full_name} mentioned you in a comment."
            )

        ActivityLog.objects.create(
            project=task.project,
            task=task,
            user=self.request.user,
            action_type='COMMENT_ADDED',
            description=f"Commented on {task.task_key}: '{comment.content[:40]}...'"
        )

class ReactionViewSet(viewsets.ModelViewSet):
    serializer_class = ReactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Reaction.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        project_id = self.request.query_params.get('project')
        queryset = ActivityLog.objects.filter(project__workspace__members__user=user)
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset.distinct()
