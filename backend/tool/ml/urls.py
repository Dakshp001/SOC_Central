# backend/tool/ml/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Anomaly Detection
    path('anomaly-detection/', views.AnomalyDetectionView.as_view(), name='anomaly_detection'),
    path('train-model/', views.TrainAnomalyModelView.as_view(), name='train_anomaly_model'),
    path('models/', views.AnomalyModelManagementView.as_view(), name='anomaly_models'),
    path('models/<int:model_id>/', views.AnomalyModelManagementView.as_view(), name='anomaly_model_detail'),
    path('dashboard/', views.AnomalyDashboardView.as_view(), name='anomaly_dashboard'),
    path('training-job/<int:job_id>/', views.TrainingJobStatusView.as_view(), name='training_job_status'),
    path('anomaly/<int:anomaly_id>/investigate/', views.AnomalyInvestigationView.as_view(), name='anomaly_investigate'),
]