# backend/tool/views/__init__.py

from .universal import (
    UniversalUploadView,
    ToolSpecificUploadView,
    FileTypeDetectionView,
    FileDebugView,
    HealthCheckView
)

# Import all tool-specific views
try:
    from ..gsuite.views import GSuiteUploadView
except ImportError:
    GSuiteUploadView = None

try:
    from ..mdm.views import MDMUploadView
except ImportError:
    MDMUploadView = None

try:
    from ..seim.views import SIEMUploadView
except ImportError:
    SIEMUploadView = None

try:
    from ..edr.views import EDRUploadView
except ImportError:
    EDRUploadView = None

try:
    from ..sonicwall.views import SonicWallUploadView
except ImportError:
    SonicWallUploadView = None

try:
    from ..meraki.views import MerakiUploadView
except ImportError:
    MerakiUploadView = None

__all__ = [
    # Universal views
    'UniversalUploadView',
    'ToolSpecificUploadView', 
    'FileTypeDetectionView',
    'FileDebugView',
    'HealthCheckView',
    
    # Tool-specific views
    'GSuiteUploadView',
    'MDMUploadView',
    'SIEMUploadView',
    'EDRUploadView',
    'SonicWallUploadView',
    'MerakiUploadView'
]