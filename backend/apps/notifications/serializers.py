from rest_framework import serializers
from .models import Notification
from apps.authentication.serializers import UserMinimalSerializer

class NotificationSerializer(serializers.ModelSerializer):
    sender_detail = UserMinimalSerializer(source='sender', read_only=True)

    class Meta:
        model = Notification
        fields = ('id', 'recipient', 'sender', 'sender_detail', 'verb', 'target_type', 'target_id', 'title', 'message', 'read', 'created_at')
        read_only_fields = ('id', 'created_at')
