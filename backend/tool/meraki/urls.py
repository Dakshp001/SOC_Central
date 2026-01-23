# backend/tool/meraki/urls.py
# URL patterns for Meraki network analytics endpoints

from django.urls import path
from .views import (
    MerakiUploadView,
    MerakiKPIDetailView,
    MerakiAnalyticsView,
    MerakiHealthCheckView
)

urlpatterns = [
    # Main upload endpoint
    path('upload/', MerakiUploadView.as_view(), name='meraki-upload'),
    
    # KPI detail endpoints for different data types
    path('kpi/<str:kpi_type>/', MerakiKPIDetailView.as_view(), name='meraki-kpi-detail'),
    
    # Advanced analytics endpoint
    path('analytics/', MerakiAnalyticsView.as_view(), name='meraki-analytics'),
    
    # Health check endpoint
    path('health/', MerakiHealthCheckView.as_view(), name='meraki-health'),
]

# Available KPI types:
# - ssids: Top SSIDs by usage
# - devices: Top devices  
# - device_models: Top device models by usage
# - clients: Top clients by usage
# - manufacturers: Top manufacturers by usage
# - operating_systems: Top operating systems by usage
# - app_categories: Top application categories
# - applications: Top applications by usage
# - sessions_time: Number of sessions over time
# - usage_time: Usage over time
# - clients_daily: Clients per day