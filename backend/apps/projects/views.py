from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Project, ProjectMember, BoardColumn, ProjectRole
from .serializers import ProjectSerializer, ProjectMemberSerializer, BoardColumnSerializer
from apps.workspaces.models import WorkspaceMember

class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        workspace_id = self.request.query_params.get('workspace_id')
        queryset = Project.objects.filter(workspace__members__user=user)
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)
        return queryset.distinct()

    def perform_create(self, serializer):
        project = serializer.save()
        # Add creator as OWNER member
        ProjectMember.objects.create(project=project, user=self.request.user, role=ProjectRole.OWNER)

        # Create default columns: To Do, In Progress, Review, Done
        default_columns = [
            {'name': 'To Do', 'color': '#94A3B8', 'order': 0, 'is_default': True},
            {'name': 'In Progress', 'color': '#3B82F6', 'order': 1, 'is_default': False},
            {'name': 'In Review', 'color': '#F59E0B', 'order': 2, 'is_default': False},
            {'name': 'Completed', 'color': '#10B981', 'order': 3, 'is_default': False},
        ]
        for col in default_columns:
            BoardColumn.objects.create(project=project, **col)

    @action(detail=True, methods=['get', 'post'], url_path='columns')
    def columns(self, request, pk=None):
        project = self.get_object()
        if request.method == 'GET':
            cols = project.columns.all()
            serializer = BoardColumnSerializer(cols, many=True)
            return Response(serializer.data)

        elif request.method == 'POST':
            serializer = BoardColumnSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(project=project)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'], url_path='members')
    def members(self, request, pk=None):
        project = self.get_object()
        members = project.members.all()
        serializer = ProjectMemberSerializer(members, many=True)
        return Response(serializer.data)

class BoardColumnViewSet(viewsets.ModelViewSet):
    serializer_class = BoardColumnSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = BoardColumn.objects.all()

    def get_queryset(self):
        return BoardColumn.objects.filter(project__workspace__members__user=self.request.user).distinct()
