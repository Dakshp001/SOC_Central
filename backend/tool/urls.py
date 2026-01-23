# backend/tool/urls.py - FIXED VERSION WITH PROPER IMPORTS
from django.urls import path
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.views.decorators.csrf import csrf_exempt

# Simple health check for tool app
@csrf_exempt
def tool_health_check(request):
    return JsonResponse({
        "status": "ok",
        "service": "Tool API",
        "message": "Tool endpoints are working"
    })

# Test chatbot view
class TestChatbotView(APIView):
    def post(self, request):
        return Response({"message": "Test chatbot working", "query": request.data.get("query", "")})

# Import GSuite views first
try:
    from .gsuite.views import GSuiteUploadView, GSuiteActiveDataView
    GSUITE_VIEWS_AVAILABLE = True
    print("GSuite views imported successfully for inline definition")
except ImportError as e:
    print(f"GSuite views import failed: {e}")
    GSUITE_VIEWS_AVAILABLE = False
    # Create dummy views to prevent errors
    class GSuiteUploadView:
        pass
    class GSuiteActiveDataView:
        pass

# Define urlpatterns with GSuite patterns inline from the start
if GSUITE_VIEWS_AVAILABLE:
    urlpatterns = [
        path('health/', tool_health_check, name='tool-health'),
        path('test-chatbot/', TestChatbotView.as_view(), name='test-chatbot'),
        # GSuite patterns defined INLINE
        path('gsuite/upload/', GSuiteUploadView.as_view(), name='gsuite-upload-inline'),
        path('gsuite/active-data/', GSuiteActiveDataView.as_view(), name='gsuite-active-data-inline'),
    ]
    print(f"GSuite endpoints defined INLINE in urlpatterns: 2 endpoints")
else:
    urlpatterns = [
        path('health/', tool_health_check, name='tool-health'),
        path('test-chatbot/', TestChatbotView.as_view(), name='test-chatbot'),
    ]
    print("GSuite endpoints not available - skipped")

# Import and add universal views
try:
    from .views.universal import (
        ActiveDataView,
        FilteredDataView,
        DataManagementView,
        NotificationView,
        UniversalUploadView,
        ServiceChatbotView
    )
    
    universal_patterns = [
        path('active-data/', ActiveDataView.as_view(), name='active-data'),
        path('filtered-data/', FilteredDataView.as_view(), name='filtered-data'),
        path('manage-data/', DataManagementView.as_view(), name='manage-data'),
        path('notifications/', NotificationView.as_view(), name='notifications'),
        path('universal/upload/', UniversalUploadView.as_view(), name='universal-upload'),
        path('upload/', UniversalUploadView.as_view(), name='simple-upload'),
        path('service-chatbot/', ServiceChatbotView.as_view(), name='service-chatbot-universal'),
    ]
    
    # Add debug endpoints if available
    try:
        from .views.universal import FileDebugView, FileTypeDetectionView, ProcessorDebugView
        debug_patterns = [
            path('debug/', FileDebugView.as_view(), name='file-debug'),
            path('detect-type/', FileTypeDetectionView.as_view(), name='file-type-detection'),
            path('processor-debug/', ProcessorDebugView.as_view(), name='processor-debug'),
        ]
        universal_patterns.extend(debug_patterns)
        print(f"Debug endpoints loaded: {len(debug_patterns)} endpoints")
    except ImportError:
        print("Debug endpoints not available")
    urlpatterns.extend(universal_patterns)
    print(f"Universal tool endpoints loaded: {len(universal_patterns)} endpoints")
    
except ImportError as e:
    print(f"Universal views import failed: {e}")

# Import and add admin views
try:
    from .views.admin import (
        DatasetListView,
        DataStatsView,
        ResetAllDataView,
        DataCompanyTransferView,
        CompanySpecificUploadView
    )
    
    admin_patterns = [
        path('admin/datasets/', DatasetListView.as_view(), name='admin-datasets'),
        path('admin/stats/', DataStatsView.as_view(), name='admin-stats'),
        path('admin/reset-all/', ResetAllDataView.as_view(), name='admin-reset-all'),
        path('admin/transfer/', DataCompanyTransferView.as_view(), name='admin-transfer'),
        path('admin/company-upload/', CompanySpecificUploadView.as_view(), name='admin-company-upload'),
    ]
    urlpatterns.extend(admin_patterns)
    print(f"Admin endpoints loaded: {len(admin_patterns)} endpoints")
    
except ImportError as e:
    print(f"Admin views import failed: {e}")

# GSuite patterns were already added early - skip duplicate
print("GSuite endpoints already added early - skipping duplicate")
# (Removing original GSuite import to avoid conflicts)

# Import other tool views with error handling
tool_imports = [
    ('mdm', 'MDMUploadView'),
    ('seim', 'SIEMUploadView'),
    ('edr', 'EDRUploadView'),
    ('meraki', 'MerakiUploadView'),
    ('sonicwall', 'SonicWallUploadView'),
]

for tool_name, view_name in tool_imports:
    try:
        module = __import__(f'tool.{tool_name}.views', fromlist=[view_name])
        view_class = getattr(module, view_name)
        urlpatterns.append(
            path(f'{tool_name}/upload/', view_class.as_view(), name=f'{tool_name}-upload')
        )
        print(f"{tool_name.upper()} endpoint loaded")
    except (ImportError, AttributeError) as e:
        print(f"{tool_name.upper()} view not available: {e}")

# Add EDR Wazuh Live Data endpoint
try:
    from .edr.views import WazuhLiveDataView
    urlpatterns.append(
        path('edr/live-data/', WazuhLiveDataView.as_view(), name='edr-live-data')
    )
    print("EDR Wazuh Live Data endpoint loaded")
except (ImportError, AttributeError) as e:
    print(f"EDR Wazuh Live Data endpoint not available: {e}")

# Import and add ML endpoints
try:
    from django.urls import include
    from .ml import urls as ml_urls
    
    ml_patterns = [
        path('ml/', include(ml_urls)),
    ]
    urlpatterns.extend(ml_patterns)
    print(f"ML endpoints loaded: anomaly detection available")
    
except ImportError as e:
    print(f"ML views import failed: {e}")

# Import and add Service Dashboard endpoints
try:
    from .views.service_dashboard_views import ServiceDashboardView, ServiceChatbotView
    
    # Add service patterns directly to urlpatterns 
    urlpatterns.extend([
        path('service-dashboard/', ServiceDashboardView.as_view(), name='service-dashboard'),
        path('service-chatbot/', ServiceChatbotView.as_view(), name='service-chatbot'),
    ])
    
    print(f"Service Dashboard endpoints loaded: 2 endpoints")
    
except ImportError as e:
    print(f"Service Dashboard views import failed: {e}")
except Exception as e:
    print(f"Service Dashboard error: {e}")

# Import and add SOC Report endpoints
try:
    from .views.report_views import (
        soc_reports_view,
        soc_report_detail_view,
        generate_report_content_view,
        available_data_sources_view,
        export_report_view,
        report_templates_view
    )
    
    report_patterns = [
        path('reports/', soc_reports_view, name='soc-reports'),
        path('reports/<int:report_id>/', soc_report_detail_view, name='soc-report-detail'),
        path('reports/<int:report_id>/generate/', generate_report_content_view, name='generate-report-content'),
        path('reports/<int:report_id>/export/', export_report_view, name='export-report'),
        path('reports/data-sources/', available_data_sources_view, name='available-data-sources'),
        path('reports/templates/', report_templates_view, name='report-templates'),
    ]
    urlpatterns.extend(report_patterns)
    print(f"SOC Report endpoints loaded: {len(report_patterns)} endpoints")
    
except ImportError as e:
    print(f"SOC Report views import failed: {e}")

print(f"\nTotal endpoints loaded: {len(urlpatterns)}")
print("Available endpoints:")
for pattern in urlpatterns:
    if hasattr(pattern, 'name') and pattern.name:
        print(f"   - {pattern.pattern} ({pattern.name})")
    elif hasattr(pattern, 'pattern'):
        print(f"   - {pattern.pattern} (no name)")