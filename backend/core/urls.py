# backend/core/urls.py - FIXED WITH PROPER IMPORTS

from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.utils import timezone
from django.conf import settings
from django.conf.urls.static import static

# 🔥 ADD THESE IMPORTS
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

@api_view(['GET', 'OPTIONS'])
@permission_classes([AllowAny])
def root_health_check(request):
    """Root health check for Render deployment"""
    return Response({
        'status': 'ok',
        'service': 'SOC Central Backend',
        'timestamp': timezone.now().isoformat(),
        'message': 'Backend service is running',
        'version': '1.0.0',
        'cors_test': 'CORS should work if headers are present'
    })

urlpatterns = [
    path('', root_health_check, name='root-health'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/tool/', include('tool.urls')),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)