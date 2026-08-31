from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model

from .models import Workspace, WorkspaceMember, WorkspaceInvitation, WorkspaceRole
from .serializers import WorkspaceSerializer, WorkspaceMemberSerializer, WorkspaceInvitationSerializer
from .permissions import IsWorkspaceMember, IsWorkspaceAdminOrOwner

User = get_user_model()

class WorkspaceViewSet(viewsets.ModelViewSet):
    serializer_class = WorkspaceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Workspace.objects.filter(members__user=self.request.user).distinct()

    def perform_create(self, serializer):
        workspace = serializer.save(owner=self.request.user)
        # Owner automatically added as OWNER member
        WorkspaceMember.objects.create(
            workspace=workspace,
            user=self.request.user,
            role=WorkspaceRole.OWNER
        )

    @action(detail=True, methods=['get', 'post'], url_path='members')
    def members(self, request, pk=None):
        workspace = self.get_object()
        if request.method == 'GET':
            members = workspace.members.all()
            serializer = WorkspaceMemberSerializer(members, many=True)
            return Response(serializer.data)

        elif request.method == 'POST':
            # Only OWNER or ADMIN can manage member roles
            requester_membership = workspace.members.filter(user=request.user).first()
            if not requester_membership or requester_membership.role not in [WorkspaceRole.OWNER, WorkspaceRole.ADMIN]:
                return Response(
                    {'detail': 'Only workspace Owners and Admins can manage member roles.'},
                    status=status.HTTP_403_FORBIDDEN
                )

            user_id = request.data.get('user_id')
            role = request.data.get('role', WorkspaceRole.MEMBER)
            user = get_object_or_404(User, id=user_id)

            # Prevent demoting the sole owner
            if role != WorkspaceRole.OWNER:
                existing = workspace.members.filter(user=user).first()
                if existing and existing.role == WorkspaceRole.OWNER:
                    owner_count = workspace.members.filter(role=WorkspaceRole.OWNER).count()
                    if owner_count <= 1:
                        return Response(
                            {'detail': 'Cannot demote the sole workspace Owner. Assign another Owner first.'},
                            status=status.HTTP_400_BAD_REQUEST
                        )

            member, created = WorkspaceMember.objects.update_or_create(
                workspace=workspace,
                user=user,
                defaults={'role': role}
            )

            # Create Notification for the user whose role changed
            if user != request.user:
                from apps.notifications.models import Notification, NotificationVerb
                Notification.objects.create(
                    recipient=user,
                    sender=request.user,
                    verb=NotificationVerb.STATUS_CHANGED,
                    target_type='WORKSPACE',
                    target_id=workspace.id,
                    title=f'Workspace Role Updated',
                    message=f'Your role in {workspace.name} was changed to {role} by {request.user.full_name or request.user.username}.'
                )

            serializer = WorkspaceMemberSerializer(member)
            return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=True, methods=['delete'], url_path='members/(?P<user_id>[^/.]+)')
    def remove_member(self, request, pk=None, user_id=None):
        workspace = self.get_object()
        member = get_object_or_404(WorkspaceMember, workspace=workspace, user_id=user_id)
        if member.role == WorkspaceRole.OWNER and workspace.members.filter(role=WorkspaceRole.OWNER).count() == 1:
            return Response({'detail': 'Cannot remove the sole workspace owner.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create notification before deletion
        if member.user != request.user:
            from apps.notifications.models import Notification, NotificationVerb
            Notification.objects.create(
                recipient=member.user,
                sender=request.user,
                verb=NotificationVerb.STATUS_CHANGED,
                target_type='WORKSPACE',
                target_id=workspace.id,
                title=f'Removed from Workspace',
                message=f'You were removed from {workspace.name} by {request.user.full_name or request.user.username}.'
            )

        member.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], url_path='invite')
    def invite_member(self, request, pk=None):
        workspace = self.get_object()
        email = request.data.get('email')
        role = request.data.get('role', WorkspaceRole.MEMBER)

        if not email:
            return Response({'email': ['Email is required.']}, status=status.HTTP_400_BAD_REQUEST)

        # Check if already member
        existing_user = User.objects.filter(email=email).first()
        if existing_user and workspace.members.filter(user=existing_user).exists():
            return Response({'detail': 'User is already a member of this workspace.'}, status=status.HTTP_400_BAD_REQUEST)

        invitation, _ = WorkspaceInvitation.objects.update_or_create(
            workspace=workspace,
            email=email,
            defaults={'role': role, 'invited_by': request.user, 'status': 'PENDING'}
        )
        
        # Auto accept if user exists for demo convenience
        if existing_user:
            WorkspaceMember.objects.get_or_create(
                workspace=workspace,
                user=existing_user,
                defaults={'role': role}
            )
            invitation.status = 'ACCEPTED'
            invitation.save()

            # Create notification for invited user
            from apps.notifications.models import Notification, NotificationVerb
            Notification.objects.create(
                recipient=existing_user,
                sender=request.user,
                verb=NotificationVerb.INVITED,
                target_type='WORKSPACE',
                target_id=workspace.id,
                title=f'Invited to {workspace.name}',
                message=f'{request.user.full_name or request.user.username} invited you as {role} to {workspace.name}.'
            )

        serializer = WorkspaceInvitationSerializer(invitation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
