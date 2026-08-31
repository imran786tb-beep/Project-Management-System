from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CommentViewSet, ReactionViewSet, ActivityLogViewSet

router = DefaultRouter()
router.register(r'comments', CommentViewSet, basename='comment')
router.register(r'reactions', ReactionViewSet, basename='reaction')
router.register(r'activity', ActivityLogViewSet, basename='activity')

urlpatterns = [
    path('', include(router.urls)),
]
