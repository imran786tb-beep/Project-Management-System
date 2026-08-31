from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def api_root_view(request):
    return JsonResponse({
        "name": "CodeAlpha-PMS Platform API",
        "status": "online",
        "version": "1.0.0",
        "endpoints": {
            "admin": "/admin/",
            "auth": "/api/auth/",
            "workspaces": "/api/workspaces/",
            "projects": "/api/projects/",
            "tasks": "/api/tasks/",
            "collaboration": "/api/collaboration/",
            "notifications": "/api/notifications/"
        }
    })

urlpatterns = [
    path('', api_root_view, name='api-root'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.authentication.urls')),
    path('api/workspaces/', include('apps.workspaces.urls')),
    path('api/projects/', include('apps.projects.urls')),
    path('api/tasks/', include('apps.tasks.urls')),
    path('api/collaboration/', include('apps.collaboration.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
