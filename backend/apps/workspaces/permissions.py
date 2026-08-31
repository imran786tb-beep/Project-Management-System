from rest_framework import permissions
from .models import WorkspaceMember, WorkspaceRole

class IsWorkspaceMember(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        workspace = getattr(obj, 'workspace', obj)
        return WorkspaceMember.objects.filter(workspace=workspace, user=request.user).exists()

class IsWorkspaceAdminOrOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        workspace = getattr(obj, 'workspace', obj)
        return WorkspaceMember.objects.filter(
            workspace=workspace, 
            user=request.user, 
            role__in=[WorkspaceRole.OWNER, WorkspaceRole.ADMIN]
        ).exists()
