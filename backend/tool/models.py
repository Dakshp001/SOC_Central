# backend/tool/models.py - FIXED VERSION

from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import json
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

class SecurityDataUpload(models.Model):
    TOOL_CHOICES = [
        ('gsuite', 'G Suite'),
        ('mdm', 'MDM'),
        ('siem', 'SIEM'),
        ('edr', 'EDR'),
        ('meraki', 'Meraki'),
        ('sonicwall', 'SonicWall'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('active', 'Active'),
    ]
    
    # Basic upload info
    tool_type = models.CharField(max_length=20, choices=TOOL_CHOICES)
    file_name = models.CharField(max_length=255)
    file_size = models.IntegerField()
    file_hash = models.CharField(max_length=64, blank=True, db_index=True)  # SHA-256 hash for duplicate detection
    record_count = models.IntegerField(default=0)  # Number of records processed
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploads')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    # Data storage
    processed_data = models.JSONField(default=dict)
    sheet_names = models.JSONField(default=list)
    
    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(blank=True)
    
    # Active dataset management
    is_active = models.BooleanField(default=False)
    activated_at = models.DateTimeField(null=True, blank=True)
    activated_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='activated_uploads'
    )
    
    # Organization/Company level sharing
    company_name = models.CharField(max_length=255, blank=True, default='default_company')
    is_public_to_company = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-uploaded_at']
        indexes = [
            models.Index(fields=['tool_type', 'company_name', 'is_active']),
            models.Index(fields=['uploaded_at']),
            models.Index(fields=['status']),
        ]

    def activate(self, user):
        """Activate this dataset and deactivate others of same tool type"""
        try:
            # Deactivate other datasets of same tool type for this company
            SecurityDataUpload.objects.filter(
                tool_type=self.tool_type,
                company_name=self.company_name,
                is_active=True
            ).exclude(id=self.id).update(
                is_active=False,
                activated_at=None,
                activated_by=None
            )
            
            # Activate this dataset
            self.is_active = True
            self.activated_at = timezone.now()
            self.activated_by = user
            self.status = 'active'
            self.save()
            
            logger.info(f"Activated {self.tool_type} dataset {self.id} for company {self.company_name}")
            return True
        except Exception as e:
            logger.error(f"Error activating dataset {self.id}: {str(e)}")
            return False

    def __str__(self):
        status_emoji = "🟢" if self.is_active else "⚪"
        return f"{status_emoji} {self.tool_type} - {self.file_name} ({self.uploaded_at})"

    @classmethod
    def get_active_data(cls, tool_type, company_name):
        """Get currently active dataset for a tool type and company"""
        try:
            return cls.objects.get(
                tool_type=tool_type,
                company_name=company_name,
                is_active=True,
                status='active'
            )
        except cls.DoesNotExist:
            logger.warning(f"No active {tool_type} data found for company {company_name}")
            return None
        except Exception as e:
            logger.error(f"Error getting active data: {str(e)}")
            return None

    @classmethod
    def get_all_active_data(cls, company_name):
        """Get all active datasets for a company"""
        try:
            return cls.objects.filter(
                company_name=company_name,
                is_active=True,
                status='active'
            ).select_related('uploaded_by', 'activated_by')
        except Exception as e:
            logger.error(f"Error getting all active data: {str(e)}")
            return cls.objects.none()


class DataAccessLog(models.Model):
    """Track who accessed what data when"""
    ACCESS_TYPE_CHOICES = [
        ('view', 'View'),
        ('download', 'Download'),
        ('analyze', 'Analyze'),
        ('activate', 'Activate'),
        ('deactivate', 'Deactivate'),
    ]
    
    upload = models.ForeignKey(SecurityDataUpload, on_delete=models.CASCADE, related_name='access_logs')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    accessed_at = models.DateTimeField(auto_now_add=True)
    access_type = models.CharField(max_length=20, choices=ACCESS_TYPE_CHOICES, default='view')
    
    # Company tracking fields - ADD THESE
    user_company = models.CharField(max_length=255, blank=True, default='')
    data_company = models.CharField(max_length=255, blank=True, default='')
    is_cross_company = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-accessed_at']
        indexes = [
            models.Index(fields=['upload', 'accessed_at']),
            models.Index(fields=['user', 'accessed_at']),
            models.Index(fields=['is_cross_company']),
        ]

    def save(self, *args, **kwargs):
        """Override save to automatically populate company fields"""
        if not self.user_company and hasattr(self.user, 'company_name'):
            self.user_company = getattr(self.user, 'company_name', 'default_company')
        elif not self.user_company:
            self.user_company = 'default_company'
            
        if not self.data_company and self.upload:
            self.data_company = getattr(self.upload, 'company_name', 'default_company')
        elif not self.data_company:
            self.data_company = 'default_company'
            
        # Determine if this is cross-company access
        self.is_cross_company = (self.user_company != self.data_company)
        
        super().save(*args, **kwargs)


class ProcessingLog(models.Model):
    """Log processing events and errors"""
    LEVEL_CHOICES = [
        ('INFO', 'Info'),
        ('WARNING', 'Warning'),
        ('ERROR', 'Error'),
    ]
    
    upload = models.ForeignKey(SecurityDataUpload, on_delete=models.CASCADE, related_name='logs')
    timestamp = models.DateTimeField(auto_now_add=True)
    level = models.CharField(max_length=10, choices=LEVEL_CHOICES, default='INFO')
    message = models.TextField()
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['upload', 'timestamp']),
            models.Index(fields=['level', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.level}: {self.message[:50]}"


class DataNotification(models.Model):
    """Real-time notification system"""
    NOTIFICATION_TYPES = [
        ('data_uploaded', 'Data Uploaded'),
        ('data_activated', 'Data Activated'),
        ('data_updated', 'Data Updated'),
        ('data_deleted', 'Data Deleted'),
    ]
    
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    upload = models.ForeignKey(SecurityDataUpload, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['created_at']),
        ]
    
    def mark_as_read(self):
        """Mark notification as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])


# Machine Learning Models for Anomaly Detection
class AnomalyModel(models.Model):
    """Store trained anomaly detection models"""
    ALGORITHM_CHOICES = [
        ('isolation_forest', 'Isolation Forest'),
        ('one_class_svm', 'One-Class SVM'),
        ('autoencoder', 'Autoencoder'),
    ]
    
    STATUS_CHOICES = [
        ('training', 'Training'),
        ('trained', 'Trained'),
        ('active', 'Active'),
        ('deprecated', 'Deprecated'),
        ('failed', 'Failed'),
    ]
    
    tool_type = models.CharField(max_length=20, choices=SecurityDataUpload.TOOL_CHOICES)
    algorithm = models.CharField(max_length=30, choices=ALGORITHM_CHOICES)
    model_name = models.CharField(max_length=100)
    model_file_path = models.CharField(max_length=255, blank=True)
    
    # Model metadata
    feature_columns = models.JSONField(default=list)
    hyperparameters = models.JSONField(default=dict)
    training_data_size = models.IntegerField(default=0)
    contamination_rate = models.FloatField(default=0.1)
    
    # Performance metrics
    training_accuracy = models.FloatField(null=True, blank=True)
    validation_score = models.FloatField(null=True, blank=True)
    false_positive_rate = models.FloatField(null=True, blank=True)
    
    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='training')
    is_active = models.BooleanField(default=False)
    
    # Company/Organization
    company_name = models.CharField(max_length=255, default='default_company', db_index=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    trained_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tool_type', 'company_name', 'is_active']),
            models.Index(fields=['algorithm', 'status']),
        ]
        unique_together = ['tool_type', 'company_name', 'algorithm']
    
    def __str__(self):
        return f"{self.tool_type} - {self.algorithm} ({self.status})"
    
    def activate(self):
        """Activate this model and deactivate others of same type"""
        try:
            # Deactivate other models of same type
            AnomalyModel.objects.filter(
                tool_type=self.tool_type,
                company_name=self.company_name,
                is_active=True
            ).exclude(id=self.id).update(is_active=False)
            
            # Activate this model
            self.is_active = True
            self.status = 'active'
            self.save()
            
            logger.info(f"Activated anomaly model {self.id} for {self.tool_type}")
            return True
        except Exception as e:
            logger.error(f"Error activating model {self.id}: {str(e)}")
            return False


class AnomalyDetection(models.Model):
    """Store detected anomalies"""
    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    STATUS_CHOICES = [
        ('new', 'New'),
        ('investigating', 'Under Investigation'),
        ('confirmed', 'Confirmed'),
        ('false_positive', 'False Positive'),
        ('resolved', 'Resolved'),
    ]
    
    # Link to the data source
    upload = models.ForeignKey(SecurityDataUpload, on_delete=models.CASCADE, related_name='anomalies')
    model_used = models.ForeignKey(AnomalyModel, on_delete=models.CASCADE, related_name='detections')
    
    # Anomaly details
    anomaly_date = models.DateField(db_index=True)
    anomaly_score = models.FloatField()
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, db_index=True)
    confidence = models.FloatField(default=0.0)
    
    # Feature contributions
    feature_values = models.JSONField(default=dict)
    feature_importance = models.JSONField(default=dict)
    
    # Anomaly description
    description = models.TextField()
    summary = models.CharField(max_length=255)
    
    # Investigation status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new', db_index=True)
    investigated_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='investigated_anomalies'
    )
    investigation_notes = models.TextField(blank=True)
    
    # Company tracking
    company_name = models.CharField(max_length=255, default='default_company', db_index=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['company_name', 'anomaly_date']),
            models.Index(fields=['severity', 'status']),
            models.Index(fields=['upload', 'created_at']),
        ]
    
    def __str__(self):
        return f"Anomaly: {self.summary} ({self.severity})"
    
    def mark_as_investigated(self, user, notes=""):
        """Mark anomaly as investigated"""
        self.status = 'investigating'
        self.investigated_by = user
        self.investigation_notes = notes
        self.save()
    
    def resolve(self, user, is_false_positive=False):
        """Resolve the anomaly"""
        if is_false_positive:
            self.status = 'false_positive'
        else:
            self.status = 'resolved'
        
        self.investigated_by = user
        self.resolved_at = timezone.now()
        self.save()
    
    @property
    def is_recent(self):
        """Check if anomaly is from last 24 hours"""
        return (timezone.now() - self.created_at).days == 0


class AnomalyTrainingJob(models.Model):
    """Track anomaly detection model training jobs"""
    JOB_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    tool_type = models.CharField(max_length=20, choices=SecurityDataUpload.TOOL_CHOICES)
    algorithm = models.CharField(max_length=30, choices=AnomalyModel.ALGORITHM_CHOICES)
    company_name = models.CharField(max_length=255, default='default_company')
    
    # Training parameters
    training_data_size = models.IntegerField(default=0)
    contamination_rate = models.FloatField(default=0.1)
    hyperparameters = models.JSONField(default=dict)
    
    # Job tracking
    status = models.CharField(max_length=20, choices=JOB_STATUS_CHOICES, default='pending')
    progress_percentage = models.FloatField(default=0.0)
    error_message = models.TextField(blank=True)
    
    # Results
    trained_model = models.ForeignKey(AnomalyModel, on_delete=models.CASCADE, null=True, blank=True, related_name='training_jobs')
    training_metrics = models.JSONField(default=dict)
    
    started_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='training_jobs')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['tool_type', 'company_name']),
        ]
    
    def __str__(self):
        return f"Training Job: {self.tool_type} - {self.algorithm} ({self.status})"
    
    def start_training(self):
        """Mark job as started"""
        self.status = 'running'
        self.started_at = timezone.now()
        self.save()
    
    def complete_training(self, model_instance, metrics):
        """Mark job as completed"""
        self.status = 'completed'
        self.progress_percentage = 100.0
        self.trained_model = model_instance
        self.training_metrics = metrics
        self.completed_at = timezone.now()
        self.save()
    
    def fail_training(self, error_message):
        """Mark job as failed"""
        self.status = 'failed'
        self.error_message = error_message
        self.completed_at = timezone.now()
        self.save()


class ChatConversation(models.Model):
    """Store AI assistant chat conversations"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_conversations')
    company_name = models.CharField(max_length=255, default='default_company', db_index=True)
    session_id = models.CharField(max_length=100, db_index=True)
    title = models.CharField(max_length=200, blank=True)  # Auto-generated from first user message
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user', 'company_name', '-updated_at']),
            models.Index(fields=['session_id']),
        ]
    
    def __str__(self):
        return f"Chat: {self.user.username} - {self.title or 'Untitled'}"


class ChatMessage(models.Model):
    """Store individual chat messages"""
    MESSAGE_TYPE_CHOICES = [
        ('user', 'User'),
        ('bot', 'Bot'),
    ]
    
    conversation = models.ForeignKey(ChatConversation, on_delete=models.CASCADE, related_name='messages')
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPE_CHOICES)
    content = models.TextField()
    
    # Context information for bot responses
    app_context_used = models.JSONField(default=dict, blank=True)  # Context data used for response
    ai_model_used = models.CharField(max_length=50, blank=True)  # Which AI model was used
    processing_time = models.FloatField(null=True, blank=True)  # Response time in seconds
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['conversation', 'created_at']),
            models.Index(fields=['message_type', 'created_at']),
        ]
    
    def __str__(self):
        content_preview = self.content[:50] + "..." if len(self.content) > 50 else self.content
        return f"{self.message_type}: {content_preview}"


class SOCReport(models.Model):
    """SOC Security Operations Center Reports"""
    REPORT_TYPE_CHOICES = [
        ('individual_tool', 'Individual Tool Report'),
        ('combined_tools', 'Combined Tools Report'),
        ('executive_summary', 'Executive Summary'),
        ('incident_report', 'Incident Report'),
        ('threat_analysis', 'Threat Analysis Report'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('generating', 'Generating'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('published', 'Published'),
    ]
    
    EXPORT_FORMAT_CHOICES = [
        ('pdf', 'PDF'),
        ('docx', 'Word Document'),
        ('html', 'HTML'),
    ]
    
    # Basic report info
    title = models.CharField(max_length=255)
    report_type = models.CharField(max_length=20, choices=REPORT_TYPE_CHOICES)
    description = models.TextField(blank=True)
    
    # Report data sources
    tool_types = models.JSONField(default=list)  # ['gsuite', 'mdm', 'siem']
    data_uploads = models.ManyToManyField(SecurityDataUpload, related_name='reports')
    
    # Report content (AI-generated)
    executive_summary = models.TextField(blank=True)
    monitoring_overview = models.TextField(blank=True)
    incident_summary = models.TextField(blank=True)
    critical_threat_analysis = models.TextField(blank=True)
    recommendations = models.TextField(blank=True)
    
    # Additional sections
    kpi_metrics = models.JSONField(default=dict)  # Charts and metrics data
    charts_config = models.JSONField(default=list)  # Chart configurations
    appendix = models.TextField(blank=True)
    
    # Report metadata
    report_period_start = models.DateField()
    report_period_end = models.DateField()
    generated_at = models.DateTimeField(null=True, blank=True)
    
    # AI generation info
    ai_model_used = models.CharField(max_length=50, default='gemini-1.5-flash')
    generation_prompt = models.TextField(blank=True)
    generation_time = models.FloatField(null=True, blank=True)
    
    # Status and access
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_reports')
    company_name = models.CharField(max_length=255, default='default_company')
    
    # Export history
    exported_formats = models.JSONField(default=list)  # ['pdf', 'docx']
    last_exported = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['company_name', 'report_type', 'status']),
            models.Index(fields=['created_by', '-created_at']),
            models.Index(fields=['report_period_start', 'report_period_end']),
        ]
    
    def __str__(self):
        return f"SOC Report: {self.title} ({self.report_type})"
    
    def can_edit(self, user):
        """Check if user can edit this report (admin/super admin only)"""
        return user.is_staff or user.is_superuser or user == self.created_by
    
    def generate_with_ai(self):
        """Generate report content using AI"""
        self.status = 'generating'
        self.save()
        # This will be implemented in the service layer
        return True
    
    def get_data_summary(self):
        """Get summary of data used in this report"""
        uploads = self.data_uploads.all()
        return {
            'total_uploads': uploads.count(),
            'tool_types': list(set(upload.tool_type for upload in uploads)),
            'date_range': {
                'start': self.report_period_start,
                'end': self.report_period_end
            },
            'total_records': sum(upload.record_count for upload in uploads)
        }


class SOCReportSection(models.Model):
    """Individual sections of SOC reports for custom editing"""
    SECTION_TYPE_CHOICES = [
        ('executive_summary', 'Executive Summary'),
        ('incident_overview', 'Incident Overview'),
        ('performance_metrics', 'Performance Metrics'),
        ('threat_landscape', 'Threat Landscape'),
        ('monitoring_overview', 'Monitoring Overview'),
        ('incident_summary', 'Incident Summary'),
        ('threat_analysis', 'Critical Threat Analysis'),
        ('remediation_actions', 'Remediation Actions'),
        ('compliance', 'Compliance Status'),
        ('kpi_metrics', 'KPI Metrics'),
        ('recommendations', 'Recommendations & Action Items'),
        ('custom', 'Custom Section'),
    ]
    
    report = models.ForeignKey(SOCReport, on_delete=models.CASCADE, related_name='sections')
    section_type = models.CharField(max_length=20, choices=SECTION_TYPE_CHOICES)
    title = models.CharField(max_length=255)
    content = models.TextField()
    order = models.IntegerField(default=0)
    
    # Chart/visualization data for this section
    chart_data = models.JSONField(default=dict, blank=True)
    chart_type = models.CharField(max_length=50, blank=True)  # 'bar', 'pie', 'line', 'area'
    
    # Section metadata
    is_ai_generated = models.BooleanField(default=True)
    manually_edited = models.BooleanField(default=False)
    last_edited_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['report', 'order']
        indexes = [
            models.Index(fields=['report', 'order']),
            models.Index(fields=['section_type']),
        ]
    
    def __str__(self):
        return f"{self.report.title} - {self.title}"


class SOCReportTemplate(models.Model):
    """Predefined report templates"""
    TEMPLATE_TYPE_CHOICES = [
        ('executive', 'Executive Dashboard'),
        ('technical', 'Technical Analysis'),
        ('compliance', 'Compliance Report'),
        ('incident_response', 'Incident Response'),
    ]
    
    name = models.CharField(max_length=255)
    description = models.TextField()
    template_type = models.CharField(max_length=20, choices=TEMPLATE_TYPE_CHOICES)
    
    # Template configuration
    sections_config = models.JSONField(default=list)  # Section types and order
    default_charts = models.JSONField(default=list)  # Default chart configurations
    ai_prompts = models.JSONField(default=dict)  # AI prompts for each section
    
    # Access control
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    company_name = models.CharField(max_length=255, default='default_company')
    
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['company_name', 'is_active']),
            models.Index(fields=['template_type', 'is_default']),
        ]
    
    def __str__(self):
        return f"Template: {self.name} ({self.template_type})"


class SOCReportExport(models.Model):
    """Track report exports"""
    report = models.ForeignKey(SOCReport, on_delete=models.CASCADE, related_name='exports')
    format = models.CharField(max_length=10, choices=SOCReport.EXPORT_FORMAT_CHOICES)
    file_path = models.CharField(max_length=500)
    file_size = models.IntegerField(default=0)
    
    exported_by = models.ForeignKey(User, on_delete=models.CASCADE)
    exported_at = models.DateTimeField(auto_now_add=True)
    
    # Export settings used
    export_settings = models.JSONField(default=dict)
    
    class Meta:
        ordering = ['-exported_at']
        indexes = [
            models.Index(fields=['report', '-exported_at']),
            models.Index(fields=['exported_by', '-exported_at']),
        ]
    
    def __str__(self):
        return f"Export: {self.report.title} ({self.format})"