from django.urls import re_path
from .consumers import ProjectConsumer, NotificationConsumer, WorkspaceConsumer

websocket_urlpatterns = [
    re_path(r'ws/projects/(?P<project_id>\w+)/$', ProjectConsumer.as_asgi()),
    re_path(r'ws/workspace/(?P<workspace_id>\w+)/$', WorkspaceConsumer.as_asgi()),
    re_path(r'ws/notifications/$', NotificationConsumer.as_asgi()),
]
