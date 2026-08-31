from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaskViewSet, SubtaskViewSet, LabelViewSet, TaskDependencyViewSet, AttachmentViewSet

router = DefaultRouter()
router.register(r'labels', LabelViewSet, basename='label')
router.register(r'subtasks', SubtaskViewSet, basename='subtask')
router.register(r'dependencies', TaskDependencyViewSet, basename='task-dependency')
router.register(r'attachments', AttachmentViewSet, basename='attachment')
router.register(r'', TaskViewSet, basename='task')

urlpatterns = [
    path('', include(router.urls)),
]
