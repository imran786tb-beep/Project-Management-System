from rest_framework import serializers
from .models import Project, ProjectMember, BoardColumn
from apps.authentication.serializers import UserMinimalSerializer

class BoardColumnSerializer(serializers.ModelSerializer):
    task_count = serializers.SerializerMethodField()

    class Meta:
        model = BoardColumn
        fields = ('id', 'project', 'name', 'color', 'order', 'is_default', 'task_count', 'created_at')
        read_only_fields = ('id', 'created_at')

    def get_task_count(self, obj):
        return obj.tasks.filter(is_archived=False).count()

class ProjectMemberSerializer(serializers.ModelSerializer):
    user = UserMinimalSerializer(read_only=True)

    class Meta:
        model = ProjectMember
        fields = ('id', 'project', 'user', 'role', 'joined_at')

class ProjectSerializer(serializers.ModelSerializer):
    members_count = serializers.SerializerMethodField()
    columns = BoardColumnSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = ('id', 'workspace', 'name', 'key', 'description', 'color', 'icon', 'is_archived', 'members_count', 'columns', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_members_count(self, obj):
        return obj.members.count()
