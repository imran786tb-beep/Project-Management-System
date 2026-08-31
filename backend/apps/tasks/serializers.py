from rest_framework import serializers
from .models import Task, Subtask, TaskDependency, Label, Attachment
from apps.authentication.serializers import UserMinimalSerializer

class LabelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Label
        fields = ('id', 'project', 'name', 'color')

class SubtaskSerializer(serializers.ModelSerializer):
    assignee_detail = UserMinimalSerializer(source='assignee', read_only=True)

    class Meta:
        model = Subtask
        fields = ('id', 'task', 'title', 'is_completed', 'assignee', 'assignee_detail', 'due_date', 'order', 'created_at')

class TaskDependencySerializer(serializers.ModelSerializer):
    depends_on_key = serializers.CharField(source='depends_on.task_key', read_only=True)
    depends_on_title = serializers.CharField(source='depends_on.title', read_only=True)

    class Meta:
        model = TaskDependency
        fields = ('id', 'task', 'depends_on', 'depends_on_key', 'depends_on_title', 'dependency_type')

class AttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_detail = UserMinimalSerializer(source='uploaded_by', read_only=True)

    class Meta:
        model = Attachment
        fields = ('id', 'task', 'file', 'file_url', 'file_name', 'file_size', 'file_type', 'uploaded_by', 'uploaded_by_detail', 'uploaded_at')

class TaskSerializer(serializers.ModelSerializer):
    task_key = serializers.CharField(read_only=True)
    creator_detail = UserMinimalSerializer(source='creator', read_only=True)
    assignees_detail = UserMinimalSerializer(source='assignees', many=True, read_only=True)
    labels_detail = LabelSerializer(source='labels', many=True, read_only=True)
    subtasks = SubtaskSerializer(many=True, read_only=True)
    subtask_stats = serializers.SerializerMethodField()
    column_name = serializers.CharField(source='column.name', read_only=True)
    column_color = serializers.CharField(source='column.color', read_only=True)
    project_key = serializers.CharField(source='project.key', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    comment_count = serializers.SerializerMethodField()
    attachment_count = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = (
            'id', 'project', 'project_name', 'project_key', 'column', 'column_name', 'column_color',
            'task_number', 'task_key', 'title', 'description', 'priority', 'start_date', 'due_date',
            'story_points', 'order', 'is_archived', 'creator', 'creator_detail', 'assignees',
            'assignees_detail', 'labels', 'labels_detail', 'subtasks', 'subtask_stats',
            'comment_count', 'attachment_count', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'task_number', 'task_key', 'created_at', 'updated_at')

    def get_subtask_stats(self, obj):
        total = obj.subtasks.count()
        completed = obj.subtasks.filter(is_completed=True).count()
        return {'total': total, 'completed': completed}

    def get_comment_count(self, obj):
        return obj.comments.count()

    def get_attachment_count(self, obj):
        return obj.attachments.count()
