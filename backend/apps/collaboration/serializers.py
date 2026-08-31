from rest_framework import serializers
from .models import Comment, Reaction, ActivityLog
from apps.authentication.serializers import UserMinimalSerializer

class ReactionSerializer(serializers.ModelSerializer):
    user_detail = UserMinimalSerializer(source='user', read_only=True)

    class Meta:
        model = Reaction
        fields = ('id', 'comment', 'task', 'user', 'user_detail', 'emoji', 'created_at')

class CommentSerializer(serializers.ModelSerializer):
    author_detail = UserMinimalSerializer(source='author', read_only=True)
    mentions_detail = UserMinimalSerializer(source='mentions', many=True, read_only=True)
    reactions = ReactionSerializer(many=True, read_only=True)
    replies_count = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = (
            'id', 'task', 'author', 'author_detail', 'content', 'parent',
            'mentions', 'mentions_detail', 'reactions', 'replies_count',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'author', 'created_at', 'updated_at')

    def get_replies_count(self, obj):
        return obj.replies.count()

class ActivityLogSerializer(serializers.ModelSerializer):
    user_detail = UserMinimalSerializer(source='user', read_only=True)

    class Meta:
        model = ActivityLog
        fields = ('id', 'project', 'task', 'user', 'user_detail', 'action_type', 'description', 'created_at')
