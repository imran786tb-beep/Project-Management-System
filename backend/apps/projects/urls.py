from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, BoardColumnViewSet

router = DefaultRouter()
router.register(r'columns', BoardColumnViewSet, basename='board-column')
router.register(r'', ProjectViewSet, basename='project')

urlpatterns = [
    path('', include(router.urls)),
]
