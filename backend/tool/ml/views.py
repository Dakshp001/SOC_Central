# backend/tool/ml/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.core.cache import cache
from django.utils import timezone
from django.db import transaction
from .anomaly_detector import SOCAnomalyDetector
from ..models import SecurityDataUpload, AnomalyModel, AnomalyDetection, AnomalyTrainingJob
import logging
import asyncio
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
import json
import numpy as np

logger = logging.getLogger(__name__)

class AnomalyDetectionView(APIView):
    """Run anomaly detection on security data"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Run anomaly detection on security data"""
        try:
            tool_type = request.data.get('tool_type')
            algorithm = request.data.get('algorithm', 'isolation_forest')
            company_name = getattr(request.user, 'company_name', 'default_company')
            
            if not tool_type:
                return Response({
                    'error': 'tool_type is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get active data for the tool
            upload = SecurityDataUpload.get_active_data(tool_type, company_name)
            
            if not upload:
                return Response({
                    'error': f'No active {tool_type} data found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Check if there's an active model
            active_model = AnomalyModel.objects.filter(
                tool_type=tool_type,
                company_name=company_name,
                algorithm=algorithm,
                is_active=True
            ).first()
            
            if not active_model:
                return Response({
                    'error': f'No trained {algorithm} model found for {tool_type}. Please train a model first.'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Run anomaly detection
            cache_key = f"anomaly_{tool_type}_{company_name}_{algorithm}".replace(' ', '_')
            results = cache.get(cache_key)
            
            if not results:
                detector = SOCAnomalyDetector(tool_type)
                
                # Load the model
                if detector.load_model():
                    results = detector.predict_anomalies(upload.processed_data)
                    
                    # Save detected anomalies to database
                    self._save_anomalies(results, upload, active_model, company_name)
                    
                    # Cache results for 30 minutes
                    cache.set(cache_key, results, 1800)
                else:
                    return Response({
                        'error': 'Failed to load trained model'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Add metadata
            results.update({
                'tool_type': tool_type,
                'algorithm': algorithm,
                'data_source': upload.file_name,
                'analyzed_at': upload.uploaded_at.isoformat(),
                'total_anomalies': len(results.get('anomalies', [])),
                'anomaly_rate': len(results.get('anomalies', [])) / max(len(results.get('scores', [])), 1) * 100
            })
            
            return Response(results, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Anomaly detection API error: {str(e)}")
            return Response({
                'error': 'Anomaly detection failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _save_anomalies(self, results, upload, model, company_name):
        """Save detected anomalies to database"""
        try:
            with transaction.atomic():
                for anomaly in results.get('anomalies', []):
                    # Parse date
                    anomaly_date = datetime.now().date()
                    if anomaly.get('date'):
                        try:
                            anomaly_date = datetime.strptime(anomaly['date'], '%Y-%m-%d').date()
                        except:
                            pass
                    
                    AnomalyDetection.objects.create(
                        upload=upload,
                        model_used=model,
                        anomaly_date=anomaly_date,
                        anomaly_score=anomaly['score'],
                        severity=anomaly['severity'],
                        confidence=85.0,  # Default confidence
                        feature_values=anomaly.get('features', {}),
                        description=anomaly.get('description', ''),
                        summary=anomaly.get('description', '')[:255],
                        company_name=company_name
                    )
                    
        except Exception as e:
            logger.error(f"Error saving anomalies: {str(e)}")


class TrainAnomalyModelView(APIView):
    """Train anomaly detection models"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Start training an anomaly detection model"""
        try:
            tool_type = request.data.get('tool_type')
            algorithm = request.data.get('algorithm', 'isolation_forest')
            contamination = float(request.data.get('contamination', 0.1))
            company_name = getattr(request.user, 'company_name', 'default_company')
            
            if not tool_type:
                return Response({
                    'error': 'tool_type is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get active data for training
            upload = SecurityDataUpload.get_active_data(tool_type, company_name)
            
            if not upload:
                return Response({
                    'error': f'No active {tool_type} data found for training'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Create training job
            training_job = AnomalyTrainingJob.objects.create(
                tool_type=tool_type,
                algorithm=algorithm,
                company_name=company_name,
                contamination_rate=contamination,
                hyperparameters={'contamination': contamination},
                started_by=request.user
            )
            
            # Start training in background
            self._start_training_background(training_job, upload.processed_data)
            
            return Response({
                'message': 'Training job started',
                'job_id': training_job.id,
                'status': 'pending'
            }, status=status.HTTP_202_ACCEPTED)
            
        except Exception as e:
            logger.error(f"[ERROR] Training start error: {str(e)}")
            return Response({
                'error': f'Failed to start training: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _start_training_background(self, training_job, data):
        """Start training in background thread with progress tracking"""
        def train_model():
            try:
                training_job.start_training()
                
                # Step 1: Data validation (10%)
                training_job.progress_percentage = 10.0
                training_job.save(update_fields=['progress_percentage'])
                
                # Calculate data size for reporting
                data_size = 0
                if isinstance(data, dict) and 'details' in data:
                    details = data['details']
                    if isinstance(details, dict):
                        data_size = sum(len(v) for v in details.values() if isinstance(v, list))
                elif isinstance(data, list):
                    data_size = len(data)
                
                logger.info(f"Training {training_job.tool_type} model with {data_size} data points")
                
                # Step 2: Initialize detector (20%)
                training_job.progress_percentage = 20.0
                training_job.save(update_fields=['progress_percentage'])
                
                detector = SOCAnomalyDetector(
                    training_job.tool_type, 
                    contamination=training_job.contamination_rate
                )
                
                # Step 3: Feature extraction (40%)
                training_job.progress_percentage = 40.0
                training_job.save(update_fields=['progress_percentage'])
                
                # Step 4: Model training (80%)
                training_job.progress_percentage = 80.0
                training_job.save(update_fields=['progress_percentage'])
                
                success = detector.fit(data)
                
                if success:
                    # Step 5: Model saving and finalization (90%)
                    training_job.progress_percentage = 90.0
                    training_job.save(update_fields=['progress_percentage'])
                    
                    # Create or update model record
                    model_name = f"{training_job.tool_type}_{training_job.algorithm}_{timezone.now().strftime('%Y%m%d_%H%M%S')}"
                    
                    # Check if model exists for this combination
                    existing_model = AnomalyModel.objects.filter(
                        tool_type=training_job.tool_type,
                        company_name=training_job.company_name,
                        algorithm=training_job.algorithm
                    ).first()
                    
                    if existing_model:
                        # Update existing model
                        existing_model.model_name = model_name
                        existing_model.model_file_path = detector.model_path
                        existing_model.feature_columns = detector.feature_columns
                        existing_model.hyperparameters = training_job.hyperparameters
                        existing_model.training_data_size = data_size
                        existing_model.contamination_rate = training_job.contamination_rate
                        existing_model.status = 'trained'
                        existing_model.trained_at = timezone.now()
                        existing_model.save()
                        model = existing_model
                        logger.info(f"[UPDATED] Existing {training_job.tool_type} model updated with new training")
                    else:
                        # Create new model record
                        model = AnomalyModel.objects.create(
                            tool_type=training_job.tool_type,
                            algorithm=training_job.algorithm,
                            model_name=model_name,
                            model_file_path=detector.model_path,
                            feature_columns=detector.feature_columns,
                            hyperparameters=training_job.hyperparameters,
                            training_data_size=data_size,
                            contamination_rate=training_job.contamination_rate,
                            status='trained',
                            company_name=training_job.company_name,
                            trained_at=timezone.now()
                        )
                        logger.info(f"[CREATED] New {training_job.tool_type} model created successfully")
                    
                    # Complete training job (100%)
                    metrics = {
                        'feature_count': len(detector.feature_columns),
                        'training_samples': data_size,
                        'algorithm': training_job.algorithm,
                        'contamination_rate': training_job.contamination_rate
                    }
                    training_job.complete_training(model, metrics)
                    
                    logger.info(f"[SUCCESS] Successfully trained {training_job.tool_type} model ({len(detector.feature_columns)} features, {data_size} samples)")
                else:
                    training_job.fail_training("Model training failed - insufficient data or feature extraction error")
                    
            except Exception as e:
                error_msg = f"Training failed: {str(e)}"
                logger.error(f"[ERROR] Training error for {training_job.tool_type}: {error_msg}")
                training_job.fail_training(error_msg)
        
        # Run in thread pool
        executor = ThreadPoolExecutor(max_workers=1)
        executor.submit(train_model)


class AnomalyModelManagementView(APIView):
    """Manage anomaly detection models"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get list of models for user's company"""
        try:
            company_name = getattr(request.user, 'company_name', 'default_company')
            tool_type = request.query_params.get('tool_type')
            
            queryset = AnomalyModel.objects.filter(company_name=company_name)
            
            if tool_type:
                queryset = queryset.filter(tool_type=tool_type)
            
            models = []
            for model in queryset.order_by('-created_at'):
                models.append({
                    'id': model.id,
                    'tool_type': model.tool_type,
                    'algorithm': model.algorithm,
                    'model_name': model.model_name,
                    'status': model.status,
                    'is_active': model.is_active,
                    'training_data_size': model.training_data_size,
                    'contamination_rate': model.contamination_rate,
                    'feature_count': len(model.feature_columns),
                    'trained_at': model.trained_at.isoformat() if model.trained_at else None,
                    'created_at': model.created_at.isoformat()
                })
            
            return Response({
                'models': models,
                'count': len(models)
            })
            
        except Exception as e:
            logger.error(f"Model list error: {str(e)}")
            return Response({
                'error': 'Failed to retrieve models'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def patch(self, request, model_id):
        """Activate/deactivate a model"""
        try:
            company_name = getattr(request.user, 'company_name', 'default_company')
            action = request.data.get('action')
            
            if action not in ['activate', 'deactivate']:
                return Response({
                    'error': 'Invalid action. Use activate or deactivate'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            model = AnomalyModel.objects.get(
                id=model_id,
                company_name=company_name
            )
            
            if action == 'activate':
                success = model.activate()
                if success:
                    return Response({'message': 'Model activated successfully'})
                else:
                    return Response({
                        'error': 'Failed to activate model'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            elif action == 'deactivate':
                model.is_active = False
                model.save()
                return Response({'message': 'Model deactivated successfully'})
                
        except AnomalyModel.DoesNotExist:
            return Response({
                'error': 'Model not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Model management error: {str(e)}")
            return Response({
                'error': 'Model management failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AnomalyDashboardView(APIView):
    """Get anomaly detection dashboard data"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get dashboard data for anomalies"""
        try:
            company_name = getattr(request.user, 'company_name', 'default_company')
            time_range = request.query_params.get('range', '24h')
            tool_type = request.query_params.get('tool_type')
            
            # Time range filtering
            if time_range == '1h':
                since = timezone.now() - timedelta(hours=1)
            elif time_range == '24h':
                since = timezone.now() - timedelta(days=1)
            elif time_range == '7d':
                since = timezone.now() - timedelta(days=7)
            elif time_range == '30d':
                since = timezone.now() - timedelta(days=30)
            else:
                since = timezone.now() - timedelta(days=1)
            
            # Build query
            queryset = AnomalyDetection.objects.filter(
                company_name=company_name,
                created_at__gte=since
            )
            
            if tool_type:
                queryset = queryset.filter(upload__tool_type=tool_type)
            
            anomalies = queryset.order_by('-created_at')
            
            # Calculate summary statistics
            total_anomalies = anomalies.count()
            critical_anomalies = anomalies.filter(severity='critical').count()
            high_anomalies = anomalies.filter(severity='high').count()
            new_anomalies = anomalies.filter(status='new').count()
            
            # Recent anomalies
            recent_anomalies = []
            for anomaly in anomalies[:20]:
                recent_anomalies.append({
                    'id': anomaly.id,
                    'tool_type': anomaly.upload.tool_type,
                    'severity': anomaly.severity,
                    'score': anomaly.anomaly_score,
                    'confidence': anomaly.confidence,
                    'summary': anomaly.summary,
                    'description': anomaly.description,
                    'status': anomaly.status,
                    'date': anomaly.anomaly_date.isoformat(),
                    'created_at': anomaly.created_at.isoformat(),
                    'feature_values': anomaly.feature_values
                })
            
            # Anomalies by severity
            severity_counts = {}
            for severity in ['low', 'medium', 'high', 'critical']:
                severity_counts[severity] = anomalies.filter(severity=severity).count()
            
            # Anomalies by tool type
            tool_counts = {}
            for tool in ['gsuite', 'mdm', 'siem', 'edr', 'meraki', 'sonicwall']:
                count = anomalies.filter(upload__tool_type=tool).count()
                if count > 0:
                    tool_counts[tool] = count
            
            # Daily trend (last 7 days)
            daily_trend = []
            for i in range(7):
                date = (timezone.now() - timedelta(days=i)).date()
                count = anomalies.filter(anomaly_date=date).count()
                daily_trend.append({
                    'date': date.isoformat(),
                    'count': count
                })
            daily_trend.reverse()
            
            dashboard_data = {
                'summary': {
                    'total_anomalies': total_anomalies,
                    'critical_anomalies': critical_anomalies,
                    'high_anomalies': high_anomalies,
                    'new_anomalies': new_anomalies,
                    'resolution_rate': round(
                        (total_anomalies - new_anomalies) / max(total_anomalies, 1) * 100, 1
                    )
                },
                'recent_anomalies': recent_anomalies,
                'severity_distribution': severity_counts,
                'tool_distribution': tool_counts,
                'daily_trend': daily_trend,
                'time_range': time_range
            }
            
            return Response(dashboard_data)
            
        except Exception as e:
            logger.error(f"Dashboard data error: {str(e)}")
            return Response({
                'error': 'Failed to retrieve dashboard data'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TrainingJobStatusView(APIView):
    """Get training job status"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, job_id):
        """Get training job status"""
        try:
            company_name = getattr(request.user, 'company_name', 'default_company')
            
            job = AnomalyTrainingJob.objects.get(
                id=job_id,
                company_name=company_name
            )
            
            response_data = {
                'id': job.id,
                'tool_type': job.tool_type,
                'algorithm': job.algorithm,
                'status': job.status,
                'progress_percentage': job.progress_percentage,
                'error_message': job.error_message,
                'created_at': job.created_at.isoformat(),
                'started_at': job.started_at.isoformat() if job.started_at else None,
                'completed_at': job.completed_at.isoformat() if job.completed_at else None,
            }
            
            if job.trained_model:
                response_data['trained_model'] = {
                    'id': job.trained_model.id,
                    'model_name': job.trained_model.model_name,
                    'status': job.trained_model.status
                }
            
            return Response(response_data)
            
        except AnomalyTrainingJob.DoesNotExist:
            return Response({
                'error': 'Training job not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Training job status error: {str(e)}")
            return Response({
                'error': 'Failed to get training job status'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AnomalyInvestigationView(APIView):
    """Handle anomaly investigation and resolution"""
    permission_classes = [IsAuthenticated]
    
    def patch(self, request, anomaly_id):
        """Update anomaly investigation status"""
        try:
            company_name = getattr(request.user, 'company_name', 'default_company')
            action = request.data.get('action')
            notes = request.data.get('notes', '')
            
            anomaly = AnomalyDetection.objects.get(
                id=anomaly_id,
                company_name=company_name
            )
            
            if action == 'investigate':
                anomaly.mark_as_investigated(request.user, notes)
                message = 'Anomaly marked as under investigation'
                
            elif action == 'resolve':
                is_false_positive = request.data.get('is_false_positive', False)
                anomaly.resolve(request.user, is_false_positive)
                message = 'Anomaly resolved successfully'
                
            elif action == 'confirm':
                anomaly.status = 'confirmed'
                anomaly.investigated_by = request.user
                if notes:
                    anomaly.investigation_notes = notes
                anomaly.save()
                message = 'Anomaly confirmed as genuine threat'
                
            else:
                return Response({
                    'error': 'Invalid action. Use investigate, resolve, or confirm'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            return Response({
                'message': message,
                'anomaly': {
                    'id': anomaly.id,
                    'status': anomaly.status,
                    'investigated_by': anomaly.investigated_by.username if anomaly.investigated_by else None,
                    'investigation_notes': anomaly.investigation_notes
                }
            })
            
        except AnomalyDetection.DoesNotExist:
            return Response({
                'error': 'Anomaly not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Anomaly investigation error: {str(e)}")
            return Response({
                'error': 'Investigation update failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)