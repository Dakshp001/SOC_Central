from django.contrib import admin
from .models import SecurityDataUpload, ProcessingLog

@admin.register(SecurityDataUpload)
class SecurityDataUploadAdmin(admin.ModelAdmin):
    list_display = ['tool_type', 'file_name', 'status', 'uploaded_at', 'file_size']
    list_filter = ['tool_type', 'status', 'uploaded_at']
    search_fields = ['file_name', 'tool_type']
    readonly_fields = ['uploaded_at', 'processed_at']
    
    def get_readonly_fields(self, request, obj=None):
        # Convert readonly_fields to a proper list of strings
        base_readonly = [
            field if isinstance(field, str) else field.__name__ 
            for field in self.readonly_fields
        ]
        
        if obj:  # Editing existing object
            additional_readonly = ['tool_type', 'file_name', 'file_size']
            return base_readonly + additional_readonly
        return base_readonly

@admin.register(ProcessingLog)
class ProcessingLogAdmin(admin.ModelAdmin):
    list_display = ['upload', 'level', 'message', 'timestamp']
    list_filter = ['level', 'timestamp']
    search_fields = ['message']