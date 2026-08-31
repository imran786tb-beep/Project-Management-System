from rest_framework import serializers
from .models import Workspace, WorkspaceMember, WorkspaceInvitation
from apps.authentication.serializers import UserMinimalSerializer

class WorkspaceMemberSerializer(serializers.ModelSerializer):
    user = UserMinimalSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = WorkspaceMember
        fields = ('id', 'workspace', 'user', 'user_id', 'role', 'joined_at')
        read_only_fields = ('id', 'joined_at')

class WorkspaceSerializer(serializers.ModelSerializer):
    owner = UserMinimalSerializer(read_only=True)
    members_count = serializers.SerializerMethodField()
    my_role = serializers.SerializerMethodField()

    class Meta:
        model = Workspace
        fields = ('id', 'name', 'slug', 'description', 'owner', 'icon', 'members_count', 'my_role', 'created_at', 'updated_at')
        read_only_fields = ('id', 'slug', 'owner', 'created_at', 'updated_at')

    def get_members_count(self, obj):
        return obj.members.count()

    def get_my_role(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            member = obj.members.filter(user=request.user).first()
            return member.role if member else None
        return None

class WorkspaceInvitationSerializer(serializers.ModelSerializer):
    invited_by = UserMinimalSerializer(read_only=True)
    workspace_name = serializers.CharField(source='workspace.name', read_only=True)

    class Meta:
        model = WorkspaceInvitation
        fields = ('id', 'workspace', 'workspace_name', 'email', 'role', 'token', 'status', 'invited_by', 'created_at')
        read_only_fields = ('id', 'token', 'status', 'invited_by', 'created_at')
