# backend/tool/ml/anomaly_detector.py
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_score
import joblib
import json
import logging
from typing import Dict, List, Optional, Tuple, Any
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone
from datetime import datetime, timedelta
import os

logger = logging.getLogger(__name__)

class SOCAnomalyDetector:
    """
    Isolation Forest-based anomaly detection for SOC security data
    Specialized for detecting anomalies in security metrics like:
    - Login patterns, phishing attempts, file upload spikes, etc.
    """
    
    def __init__(self, tool_type: str, contamination: float = 0.1):
        self.tool_type = tool_type
        self.contamination = contamination
        self.model = IsolationForest(
            contamination=contamination,
            random_state=42,
            n_estimators=100,
            max_samples='auto',
            n_jobs=-1
        )
        self.scaler = StandardScaler()
        self.feature_columns = []
        self.is_trained = False
        self.model_path = self._get_model_path()
        
    def _get_model_path(self) -> str:
        """Get model storage path"""
        models_dir = os.path.join(settings.BASE_DIR, 'ml_models', 'anomaly')
        os.makedirs(models_dir, exist_ok=True)
        return os.path.join(models_dir, f'{self.tool_type}_isolation_forest.joblib')
    
    def extract_features(self, data: Dict) -> pd.DataFrame:
        """
        Extract features from SOC data for anomaly detection
        Features are tool-specific and time-based
        """
        try:
            if self.tool_type == 'gsuite':
                return self._extract_gsuite_features(data)
            elif self.tool_type == 'mdm':
                return self._extract_mdm_features(data)
            elif self.tool_type == 'siem':
                return self._extract_siem_features(data)
            elif self.tool_type == 'edr':
                return self._extract_edr_features(data)
            elif self.tool_type == 'meraki':
                return self._extract_meraki_features(data)
            elif self.tool_type == 'sonicwall':
                return self._extract_sonicwall_features(data)
            else:
                logger.error(f"Unknown tool type: {self.tool_type}")
                return pd.DataFrame()
                
        except Exception as e:
            logger.error(f"Feature extraction error for {self.tool_type}: {str(e)}")
            return pd.DataFrame()
    
    def _extract_gsuite_features(self, data: Dict) -> pd.DataFrame:
        """Extract GSuite-specific features for anomaly detection"""
        features = []
        
        # Handle the correct data structure: data['details'] contains the actual records
        details = data.get('details', {})
        if not isinstance(details, dict):
            logger.warning(f"GSuite data details is not a dict: {type(details)}")
            return pd.DataFrame()
        
        # Combine all records from different categories
        all_records = []
        for category, records in details.items():
            if isinstance(records, list):
                for record in records:
                    if isinstance(record, dict):
                        record['category'] = category  # Add category for tracking
                        all_records.append(record)
        
        if not all_records:
            logger.warning("No records found in GSuite data")
            return pd.DataFrame()
            
        # Daily aggregations for anomaly detection
        daily_stats = self._aggregate_by_day_gsuite(all_records)
        
        for date_str, day_data in daily_stats.items():
            feature_row = {
                'date': date_str,
                'total_events': len(day_data),
                'unique_users': len(set(row.get('phishing reported by user', row.get('User Email', '')) for row in day_data if row.get('phishing reported by user') or row.get('User Email'))),
                'phishing_attempts': sum(1 for row in day_data if 'phishing' in str(row.get('alert type', '')).lower()),
                'high_severity': sum(1 for row in day_data if str(row.get('severity', '')).lower() == 'high'),
                'medium_severity': sum(1 for row in day_data if str(row.get('severity', '')).lower() == 'medium'),
                'low_severity': sum(1 for row in day_data if str(row.get('severity', '')).lower() == 'low'),
                'user_reported': sum(1 for row in day_data if 'user-reported' in str(row.get('alert type', '')).lower()),
                'suspicious_emails': sum(1 for row in day_data if row.get('category') == 'suspiciousEmails'),
                'phishing_category': sum(1 for row in day_data if row.get('category') == 'phishingAttempted'),
            }
            
            # Add time-based features
            feature_row.update(self._add_temporal_features(date_str))
            features.append(feature_row)
        
        df = pd.DataFrame(features)
        if not df.empty:
            # Sort by date and add rolling averages
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date')
            
            # 7-day rolling averages for baseline comparison
            for col in ['total_events', 'phishing_attempts', 'high_severity', 'user_reported']:
                if col in df.columns and len(df) > 0:
                    df[f'{col}_rolling_7d'] = df[col].rolling(window=7, min_periods=1).mean()
                    df[f'{col}_ratio_to_baseline'] = df[col] / (df[f'{col}_rolling_7d'] + 1e-6)
        
        return df
    
    def _extract_mdm_features(self, data: Dict) -> pd.DataFrame:
        """Extract MDM-specific features for anomaly detection"""
        features = []
        
        for sheet_name, sheet_data in data.items():
            if not isinstance(sheet_data, list):
                continue
                
            daily_stats = self._aggregate_by_day(sheet_data, date_field='Event Time')
            
            for date_str, day_data in daily_stats.items():
                feature_row = {
                    'date': date_str,
                    'total_events': len(day_data),
                    'device_count': len(set(row.get('Device ID', '') for row in day_data if row.get('Device ID'))),
                    'security_violations': sum(1 for row in day_data if 'violation' in str(row.get('Event Type', '')).lower()),
                    'device_wipes': sum(1 for row in day_data if 'wipe' in str(row.get('Action', '')).lower()),
                    'policy_violations': sum(1 for row in day_data if 'policy' in str(row.get('Event Type', '')).lower()),
                    'jailbreak_attempts': sum(1 for row in day_data if 'jailbreak' in str(row.get('Description', '')).lower()),
                    'app_installations': sum(1 for row in day_data if 'install' in str(row.get('Action', '')).lower()),
                    'location_anomalies': sum(1 for row in day_data if self._is_location_anomaly(row)),
                    'compliance_failures': sum(1 for row in day_data if str(row.get('Compliance Status', '')).lower() == 'non-compliant'),
                }
                
                feature_row.update(self._add_temporal_features(date_str))
                features.append(feature_row)
        
        return pd.DataFrame(features)
    
    def _extract_siem_features(self, data: Dict) -> pd.DataFrame:
        """Extract SIEM-specific features for anomaly detection"""
        features = []
        
        for sheet_name, sheet_data in data.items():
            if not isinstance(sheet_data, list):
                continue
                
            daily_stats = self._aggregate_by_day(sheet_data, date_field='Timestamp')
            
            for date_str, day_data in daily_stats.items():
                severity_counts = self._count_by_severity(day_data)
                
                feature_row = {
                    'date': date_str,
                    'total_alerts': len(day_data),
                    'high_severity_alerts': severity_counts.get('high', 0),
                    'medium_severity_alerts': severity_counts.get('medium', 0),
                    'low_severity_alerts': severity_counts.get('low', 0),
                    'unique_users_affected': len(set(row.get('Username', '') for row in day_data if row.get('Username'))),
                    'unique_sources': len(set(row.get('Source IP', '') for row in day_data if row.get('Source IP'))),
                    'malware_alerts': sum(1 for row in day_data if 'malware' in str(row.get('Alert Type', '')).lower()),
                    'brute_force_attempts': sum(1 for row in day_data if 'brute' in str(row.get('Alert Type', '')).lower()),
                    'privilege_escalation': sum(1 for row in day_data if 'privilege' in str(row.get('Alert Type', '')).lower()),
                    'data_exfiltration': sum(1 for row in day_data if 'exfiltration' in str(row.get('Alert Type', '')).lower()),
                }
                
                feature_row.update(self._add_temporal_features(date_str))
                features.append(feature_row)
        
        return pd.DataFrame(features)
    
    def _extract_edr_features(self, data: Dict) -> pd.DataFrame:
        """Extract EDR-specific features for anomaly detection"""
        features = []
        
        for sheet_name, sheet_data in data.items():
            if not isinstance(sheet_data, list):
                continue
                
            daily_stats = self._aggregate_by_day(sheet_data, date_field='Event Time')
            
            for date_str, day_data in daily_stats.items():
                feature_row = {
                    'date': date_str,
                    'total_events': len(day_data),
                    'process_events': sum(1 for row in day_data if 'process' in str(row.get('Event Type', '')).lower()),
                    'network_events': sum(1 for row in day_data if 'network' in str(row.get('Event Type', '')).lower()),
                    'file_events': sum(1 for row in day_data if 'file' in str(row.get('Event Type', '')).lower()),
                    'unique_processes': len(set(row.get('Process Name', '') for row in day_data if row.get('Process Name'))),
                    'unique_hosts': len(set(row.get('Host Name', '') for row in day_data if row.get('Host Name'))),
                    'suspicious_processes': sum(1 for row in day_data if self._is_suspicious_process(row.get('Process Name', ''))),
                    'elevated_privileges': sum(1 for row in day_data if 'admin' in str(row.get('User', '')).lower() or 'system' in str(row.get('User', '')).lower()),
                }
                
                feature_row.update(self._add_temporal_features(date_str))
                features.append(feature_row)
        
        return pd.DataFrame(features)
    
    def _extract_meraki_features(self, data: Dict) -> pd.DataFrame:
        """Extract Meraki-specific features for anomaly detection"""
        features = []
        
        for sheet_name, sheet_data in data.items():
            if not isinstance(sheet_data, list):
                continue
                
            daily_stats = self._aggregate_by_day(sheet_data, date_field='Timestamp')
            
            for date_str, day_data in daily_stats.items():
                feature_row = {
                    'date': date_str,
                    'total_events': len(day_data),
                    'blocked_connections': sum(1 for row in day_data if str(row.get('Action', '')).lower() == 'block'),
                    'allowed_connections': sum(1 for row in day_data if str(row.get('Action', '')).lower() == 'allow'),
                    'unique_source_ips': len(set(row.get('Source IP', '') for row in day_data if row.get('Source IP'))),
                    'unique_dest_ips': len(set(row.get('Destination IP', '') for row in day_data if row.get('Destination IP'))),
                    'high_port_activity': sum(1 for row in day_data if self._is_high_port(row.get('Port', 0))),
                    'data_volume_mb': sum(float(row.get('Data Volume', 0)) for row in day_data) / (1024 * 1024),
                }
                
                feature_row.update(self._add_temporal_features(date_str))
                features.append(feature_row)
        
        return pd.DataFrame(features)
    
    def _extract_sonicwall_features(self, data: Dict) -> pd.DataFrame:
        """Extract SonicWall-specific features for anomaly detection"""
        features = []
        
        for sheet_name, sheet_data in data.items():
            if not isinstance(sheet_data, list):
                continue
                
            daily_stats = self._aggregate_by_day(sheet_data, date_field='Timestamp')
            
            for date_str, day_data in daily_stats.items():
                feature_row = {
                    'date': date_str,
                    'total_events': len(day_data),
                    'firewall_blocks': sum(1 for row in day_data if 'block' in str(row.get('Action', '')).lower()),
                    'intrusion_attempts': sum(1 for row in day_data if 'intrusion' in str(row.get('Category', '')).lower()),
                    'malware_detections': sum(1 for row in day_data if 'malware' in str(row.get('Category', '')).lower()),
                    'vpn_events': sum(1 for row in day_data if 'vpn' in str(row.get('Service', '')).lower()),
                    'unique_attackers': len(set(row.get('Source IP', '') for row in day_data if row.get('Source IP'))),
                    'attack_categories': len(set(row.get('Category', '') for row in day_data if row.get('Category'))),
                }
                
                feature_row.update(self._add_temporal_features(date_str))
                features.append(feature_row)
        
        return pd.DataFrame(features)
    
    def _aggregate_by_day(self, data: List[Dict], date_field: str = 'Time') -> Dict:
        """Aggregate data by day for temporal analysis"""
        daily_data = {}
        
        for row in data:
            date_str = str(row.get(date_field, ''))
            if date_str:
                # Parse date (handle various formats)
                try:
                    if 'T' in date_str:
                        date_obj = pd.to_datetime(date_str).date()
                    else:
                        date_obj = pd.to_datetime(date_str, errors='coerce').date()
                    
                    if date_obj:
                        date_key = date_obj.strftime('%Y-%m-%d')
                        if date_key not in daily_data:
                            daily_data[date_key] = []
                        daily_data[date_key].append(row)
                except:
                    continue
        
        return daily_data
    
    def _aggregate_by_day_gsuite(self, data: List[Dict]) -> Dict:
        """Aggregate GSuite data by day (handles different date formats)"""
        daily_data = {}
        
        for row in data:
            # GSuite data uses 'date reported' field with format like 'Jul 14, 2025, 05:05 PM'
            date_str = str(row.get('date reported', ''))
            if date_str:
                try:
                    # Parse GSuite date format: "Jul 14, 2025, 05:05 PM"
                    if ',' in date_str:
                        date_part = date_str.split(',')[0] + ', ' + date_str.split(',')[1].strip()
                        date_obj = pd.to_datetime(date_part, format='%b %d, %Y', errors='coerce')
                    else:
                        date_obj = pd.to_datetime(date_str, errors='coerce')
                    
                    if not pd.isna(date_obj):
                        date_key = date_obj.strftime('%Y-%m-%d')
                        if date_key not in daily_data:
                            daily_data[date_key] = []
                        daily_data[date_key].append(row)
                except Exception as e:
                    # If date parsing fails, use current date as fallback
                    date_key = pd.Timestamp.now().strftime('%Y-%m-%d')
                    if date_key not in daily_data:
                        daily_data[date_key] = []
                    daily_data[date_key].append(row)
        
        return daily_data
    
    def _add_temporal_features(self, date_str: str) -> Dict:
        """Add temporal features (day of week, month, etc.)"""
        try:
            date_obj = pd.to_datetime(date_str)
            return {
                'day_of_week': date_obj.dayofweek,
                'month': date_obj.month,
                'quarter': date_obj.quarter,
                'is_weekend': date_obj.dayofweek >= 5,
                'is_month_end': (date_obj + pd.Timedelta(days=3)).month != date_obj.month,
            }
        except:
            return {'day_of_week': 0, 'month': 1, 'quarter': 1, 'is_weekend': False, 'is_month_end': False}
    
    def _is_suspicious_ip(self, ip: str) -> bool:
        """Check if IP is suspicious (simplified logic)"""
        if not ip:
            return False
        # Add your IP reputation logic here
        suspicious_patterns = ['10.0.0', '192.168', '172.16']
        return not any(ip.startswith(pattern) for pattern in suspicious_patterns)
    
    def _is_off_hours(self, time_str: str) -> bool:
        """Check if activity is during off hours"""
        try:
            time_obj = pd.to_datetime(time_str)
            hour = time_obj.hour
            # Define off hours as before 7 AM or after 7 PM
            return hour < 7 or hour > 19
        except:
            return False
    
    def _is_location_anomaly(self, row: Dict) -> bool:
        """Check if device location is anomalous"""
        # Simplified logic - can be enhanced with geographic analysis
        location = row.get('Location', '')
        return 'unknown' in location.lower() or location == ''
    
    def _count_by_severity(self, data: List[Dict]) -> Dict:
        """Count events by severity"""
        severity_counts = {}
        for row in data:
            severity = str(row.get('Severity', 'low')).lower()
            severity_counts[severity] = severity_counts.get(severity, 0) + 1
        return severity_counts
    
    def _is_suspicious_process(self, process_name: str) -> bool:
        """Check if process name is suspicious"""
        if not process_name:
            return False
        suspicious_patterns = ['cmd.exe', 'powershell.exe', 'wscript.exe', 'cscript.exe']
        return any(pattern in process_name.lower() for pattern in suspicious_patterns)
    
    def _is_high_port(self, port: int) -> bool:
        """Check if port is in high range (potentially suspicious)"""
        try:
            return int(port) > 1024
        except:
            return False
    
    def fit(self, data: Dict) -> bool:
        """Train the Isolation Forest model with professional logging"""
        try:
            logger.info(f"[TRAINING] Initiating {self.tool_type.upper()} anomaly detection training...")
            
            # Phase 1: Feature extraction
            logger.info(f"[PHASE 1/5] Extracting security features from {self.tool_type} data...")
            features_df = self.extract_features(data)
            
            if features_df.empty:
                logger.error(f"[ERROR] No features could be extracted from {self.tool_type} data")
                return False
            
            logger.info(f"[SUCCESS] Extracted {len(features_df)} temporal data points for analysis")
            
            # Phase 2: Feature preparation
            logger.info(f"[PHASE 2/5] Preparing features for machine learning...")
            numeric_columns = features_df.select_dtypes(include=[np.number]).columns
            self.feature_columns = list(numeric_columns)
            
            if len(self.feature_columns) == 0:
                logger.error(f"[ERROR] No valid numeric features found in {self.tool_type} data")
                return False
            
            X = features_df[self.feature_columns].fillna(0)
            logger.info(f"[SUCCESS] Prepared {len(self.feature_columns)} security features: {', '.join(self.feature_columns[:3])}...")
            
            # Phase 3: Feature scaling
            logger.info(f"[PHASE 3/5] Normalizing features for optimal detection...")
            X_scaled = self.scaler.fit_transform(X)
            
            # Phase 4: Model training
            logger.info(f"[PHASE 4/5] Training Isolation Forest with {len(X)} samples...")
            self.model.fit(X_scaled)
            self.is_trained = True
            
            # Phase 5: Model persistence
            logger.info(f"[PHASE 5/5] Persisting trained model to disk...")
            self.save_model()
            
            logger.info(f"[COMPLETE] Training completed successfully! Model ready for {self.tool_type.upper()} anomaly detection")
            logger.info(f"[METRICS] {len(X)} samples, {len(self.feature_columns)} features, {self.contamination*100:.1f}% contamination rate")
            return True
            
        except Exception as e:
            logger.error(f"[FAILED] Training failed for {self.tool_type}: {str(e)}")
            return False
    
    def predict_anomalies(self, data: Dict) -> Dict:
        """Detect anomalies in new data"""
        try:
            if not self.is_trained:
                if not self.load_model():
                    logger.error(f"No trained model available for {self.tool_type}")
                    return {'anomalies': [], 'scores': [], 'threshold': 0}
            
            features_df = self.extract_features(data)
            
            if features_df.empty:
                return {'anomalies': [], 'scores': [], 'threshold': 0}
            
            # Use same feature columns as training
            missing_columns = set(self.feature_columns) - set(features_df.columns)
            if missing_columns:
                logger.warning(f"Missing columns in prediction: {missing_columns}")
                for col in missing_columns:
                    features_df[col] = 0
            
            X = features_df[self.feature_columns].fillna(0)
            X_scaled = self.scaler.transform(X)
            
            # Predict anomalies (-1 for anomaly, 1 for normal)
            predictions = self.model.predict(X_scaled)
            anomaly_scores = self.model.decision_function(X_scaled)
            
            # Prepare results
            results = {
                'anomalies': [],
                'scores': anomaly_scores.tolist(),
                'threshold': 0.0,
                'feature_importance': self._calculate_feature_importance(X_scaled, anomaly_scores)
            }
            
            # Identify anomalous days
            for idx, (prediction, score) in enumerate(zip(predictions, anomaly_scores)):
                if prediction == -1:  # Anomaly
                    anomaly_info = {
                        'index': idx,
                        'date': features_df.iloc[idx]['date'].strftime('%Y-%m-%d') if 'date' in features_df.columns else None,
                        'score': float(score),
                        'features': features_df.iloc[idx][self.feature_columns].to_dict(),
                        'severity': self._assess_anomaly_severity(score),
                        'description': self._generate_anomaly_description(features_df.iloc[idx])
                    }
                    results['anomalies'].append(anomaly_info)
            
            return results
            
        except Exception as e:
            logger.error(f"Prediction error for {self.tool_type}: {str(e)}")
            return {'anomalies': [], 'scores': [], 'threshold': 0}
    
    def _calculate_feature_importance(self, X: np.ndarray, scores: np.ndarray) -> Dict:
        """Calculate feature importance for anomaly detection"""
        try:
            # Simple correlation-based importance
            importance = {}
            for i, feature in enumerate(self.feature_columns):
                # Add small epsilon to avoid division by zero warnings
                with np.errstate(divide='ignore', invalid='ignore'):
                    correlation_matrix = np.corrcoef(X[:, i], scores)
                    if correlation_matrix.shape == (2, 2):
                        correlation = abs(correlation_matrix[0, 1])
                    else:
                        correlation = 0.0
                
                importance[feature] = float(correlation) if not np.isnan(correlation) else 0.0
            
            # Sort by importance
            return dict(sorted(importance.items(), key=lambda x: x[1], reverse=True))
            
        except Exception as e:
            logger.error(f"Feature importance calculation error: {str(e)}")
            return {}
    
    def _assess_anomaly_severity(self, score: float) -> str:
        """Assess anomaly severity based on score"""
        if score < -0.5:
            return 'critical'
        elif score < -0.3:
            return 'high'
        elif score < -0.1:
            return 'medium'
        else:
            return 'low'
    
    def _generate_anomaly_description(self, features: pd.Series) -> str:
        """Generate human-readable anomaly description"""
        descriptions = []
        
        if self.tool_type == 'gsuite':
            if features.get('phishing_attempts', 0) > 10:
                descriptions.append(f"High phishing attempts: {int(features['phishing_attempts'])}")
            if features.get('login_failures', 0) > 50:
                descriptions.append(f"Excessive login failures: {int(features['login_failures'])}")
            if features.get('off_hours_activity', 0) > 20:
                descriptions.append(f"High off-hours activity: {int(features['off_hours_activity'])}")
        
        elif self.tool_type == 'mdm':
            if features.get('security_violations', 0) > 5:
                descriptions.append(f"Multiple security violations: {int(features['security_violations'])}")
            if features.get('device_wipes', 0) > 0:
                descriptions.append(f"Device wipes detected: {int(features['device_wipes'])}")
        
        elif self.tool_type == 'siem':
            if features.get('high_severity_alerts', 0) > 10:
                descriptions.append(f"High-severity alert spike: {int(features['high_severity_alerts'])}")
            if features.get('malware_alerts', 0) > 5:
                descriptions.append(f"Malware detection spike: {int(features['malware_alerts'])}")
        
        elif self.tool_type == 'edr':
            if features.get('suspicious_processes', 0) > 10:
                descriptions.append(f"Suspicious process activity: {int(features['suspicious_processes'])}")
            if features.get('elevated_privileges', 0) > 20:
                descriptions.append(f"High privileged activity: {int(features['elevated_privileges'])}")
        
        elif self.tool_type == 'meraki':
            if features.get('blocked_connections', 0) > 100:
                descriptions.append(f"High blocked connections: {int(features['blocked_connections'])}")
            if features.get('data_volume_mb', 0) > 1000:
                descriptions.append(f"High data volume: {features['data_volume_mb']:.1f}MB")
        
        elif self.tool_type == 'sonicwall':
            if features.get('intrusion_attempts', 0) > 20:
                descriptions.append(f"Multiple intrusion attempts: {int(features['intrusion_attempts'])}")
            if features.get('malware_detections', 0) > 10:
                descriptions.append(f"Malware detection spike: {int(features['malware_detections'])}")
        
        return "; ".join(descriptions) if descriptions else "Anomalous pattern detected in security metrics"
    
    def save_model(self):
        """Save trained model to disk"""
        try:
            model_data = {
                'model': self.model,
                'scaler': self.scaler,
                'feature_columns': self.feature_columns,
                'tool_type': self.tool_type,
                'contamination': self.contamination,
                'trained_at': timezone.now().isoformat()
            }
            joblib.dump(model_data, self.model_path)
            logger.info(f"[SAVED] Model successfully saved for {self.tool_type}")
        except Exception as e:
            logger.error(f"[ERROR] Model save failed for {self.tool_type}: {str(e)}")
    
    def load_model(self) -> bool:
        """Load trained model from disk"""
        try:
            if not os.path.exists(self.model_path):
                return False
            
            model_data = joblib.load(self.model_path)
            self.model = model_data['model']
            self.scaler = model_data['scaler']
            self.feature_columns = model_data['feature_columns']
            self.is_trained = True
            
            logger.info(f"[LOADED] Model loaded successfully for {self.tool_type}")
            return True
            
        except Exception as e:
            logger.error(f"[ERROR] Model load failed for {self.tool_type}: {str(e)}")
            return False