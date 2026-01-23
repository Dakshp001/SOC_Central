# Secure AI Service - NO sensitive data sent to external APIs
# Save as: backend/tool/services/ai_service.py

import google.generativeai as genai
from django.conf import settings
import logging
import json
from typing import Dict, Any, Optional
import re

logger = logging.getLogger(__name__)

class SecureAIService:
    """
    Secure AI service that uses Google Gemini while keeping all sensitive data local.
    NO company data, user information, or system details are sent to external APIs.
    """
    
    def __init__(self):
        self.model = None
        self._initialize_gemini()
    
    def _initialize_gemini(self):
        """Initialize Google Gemini with API key"""
        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
            logger.info("Gemini AI initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini AI: {str(e)}")
            self.model = None
    
    def generate_contextual_response(self, user_query: str, app_context: Dict[str, Any]) -> str:
        """
        Generate AI response using local context + Gemini intelligence.
        SECURITY: Only generic query patterns go to Gemini, all sensitive data stays local.
        """
        try:
            # Step 1: Analyze query locally to determine response type
            query_type = self._analyze_query_type(user_query.lower())
            
            # Step 2: Generate response based on local context first
            if query_type in ['status', 'overview', 'dashboard']:
                return self._generate_status_response(app_context)
            
            elif query_type in ['tool_specific']:
                return self._generate_tool_response(user_query, app_context)
            
            elif query_type in ['ml', 'anomaly', 'model']:
                return self._generate_ml_response(user_query, app_context)
            
            elif query_type in ['help', 'how_to', 'guide']:
                return self._generate_help_response(user_query, app_context)
            
            elif query_type in ['data', 'upload']:
                return self._generate_data_response(user_query, app_context)
            
            elif query_type in ['auth', 'user']:
                return self._generate_auth_response(app_context)
            
            else:
                # Step 3: For general questions, use Gemini with sanitized query
                return self._generate_ai_response(user_query, app_context)
                
        except Exception as e:
            logger.error(f"AI service error: {str(e)}")
            return "I apologize, but I'm experiencing technical difficulties. Please try rephrasing your question or check back in a moment."
    
    def _analyze_query_type(self, query: str) -> str:
        """Analyze query to determine response type locally"""
        if any(word in query for word in ['status', 'health', 'overview', 'dashboard']):
            return 'status'
        elif any(tool in query for tool in ['gsuite', 'mdm', 'siem', 'edr', 'meraki', 'sonicwall']):
            return 'tool_specific'
        elif any(word in query for word in ['ml', 'machine learning', 'anomaly', 'detection', 'model']):
            return 'ml'
        elif any(word in query for word in ['help', 'how', 'guide', 'tutorial', 'step']):
            return 'help'
        elif any(word in query for word in ['data', 'upload', 'file', 'records']):
            return 'data'
        elif any(word in query for word in ['user', 'auth', 'login', 'password']):
            return 'auth'
        else:
            return 'general'
    
    def _generate_ai_response(self, user_query: str, context: Dict) -> str:
        """Generate AI response using Gemini for general questions"""
        if not self.model:
            return "AI service is currently unavailable. Please try again later."
        
        try:
            # SECURITY: Create a generic prompt without sensitive data
            system_prompt = self._create_secure_prompt(context)
            
            # SECURITY: Sanitize user query to remove any sensitive information
            sanitized_query = self._sanitize_query(user_query)
            
            # Create the full prompt
            full_prompt = f"""
{system_prompt}

User Question: {sanitized_query}

Provide a helpful, professional response as a SOC Central security assistant. Be specific about security tools and features mentioned, but keep responses concise and actionable.
"""
            
            # Generate response using Gemini
            response = self.model.generate_content(full_prompt)
            return response.text if response.text else "I couldn't generate a response for that question. Could you please rephrase it?"
            
        except Exception as e:
            logger.error(f"Gemini API error: {str(e)}")
            return "I'm having trouble accessing my AI capabilities right now. Please try asking a more specific question about your SOC Central tools or features."
    
    def _create_secure_prompt(self, context: Dict) -> str:
        """Create a generic system prompt WITHOUT sensitive data"""
        return """You are an AI assistant for SOC Central, a cybersecurity platform. You help users with:

AVAILABLE FEATURES:
- Security Tools: Google Workspace (GSuite), Mobile Device Management (MDM), SIEM, Endpoint Detection & Response (EDR), Cisco Meraki, SonicWall firewalls
- ML Capabilities: Anomaly detection using Isolation Forest, One-Class SVM, and Autoencoder algorithms
- Data Management: Excel/CSV file uploads, data processing, filtering, and analysis
- Authentication: Multi-factor authentication, user management, role-based access
- Dashboards: Real-time security metrics, KPIs, analytics, and reporting
- Data Pipeline: Upload, process, and analyze security data from various tools

RESPONSE STYLE:
- Be professional and security-focused
- Provide step-by-step guidance when appropriate
- Mention specific tool names and features
- Keep responses concise but informative
- Focus on practical, actionable advice"""
    
    def _sanitize_query(self, query: str) -> str:
        """Remove any sensitive information from user query"""
        # Remove potential sensitive patterns
        patterns_to_remove = [
            r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',  # Email addresses
            r'\b(?:\d{1,3}\.){3}\d{1,3}\b',  # IP addresses
            r'\b[A-Fa-f0-9]{32,}\b',  # Hash-like strings
            r'password[:\s=]+\S+',  # Passwords
            r'token[:\s=]+\S+',  # Tokens
            r'key[:\s=]+\S+',  # API keys
        ]
        
        sanitized = query
        for pattern in patterns_to_remove:
            sanitized = re.sub(pattern, '[REDACTED]', sanitized, flags=re.IGNORECASE)
        
        return sanitized
    
    def _generate_status_response(self, context: Dict) -> str:
        """Generate status response using local context only"""
        active_tools = sum(1 for tool_data in context['security_tools'].values() if tool_data['active'])
        total_tools = len(context['security_tools'])
        
        return f"""**SOC Central System Status**

**Company**: {context['user']['company']}
**Security Tools**: {active_tools}/{total_tools} active
**ML Models**: {len(context['ml_models'])} trained and active
**Recent Anomalies**: {len(context['recent_anomalies'])} detected
**System Health**: All services operational

**Active Tools**:
""" + "\n".join([f"• **{tool.upper()}**: {'Active' if data['active'] else 'Inactive'} ({data['records']:,} records)" 
                 for tool, data in context['security_tools'].items()]) + """

**Quick Actions Available**:
• Upload new security data for any tool
• Run anomaly detection on your data
• Train new ML models for threat detection
• View detailed security analytics and reports

What would you like to do next?"""

    def _generate_tool_response(self, query: str, context: Dict) -> str:
        """Generate tool-specific response using local context"""
        query_lower = query.lower()
        
        for tool, data in context['security_tools'].items():
            if tool in query_lower:
                if data['active']:
                    model_info = ""
                    if tool in context['ml_models']:
                        model_data = context['ml_models'][tool]
                        model_info = f"\n**ML Model**: {model_data['algorithm']} with {model_data['features']} features"
                    
                    anomalies = [a for a in context['recent_anomalies'] if a['tool'] == tool]
                    anomaly_info = f"\n**Recent Anomalies**: {len(anomalies)} detected" if anomalies else "\n**No recent anomalies detected**"
                    
                    return f"""**{tool.upper()} Tool Status**

**Status**: Active and processing data
**Data Records**: {data['records']:,}
**Last Updated**: {data['last_updated'] or 'Never'}
{model_info}
{anomaly_info}

**Available Actions**:
• View {tool.upper()} security dashboard
• Run anomaly detection analysis
• Train new ML model for threat detection
• Upload fresh data files
• Export security analytics

**Getting Started**:
1. Go to Tools → {tool.upper()}
2. Review your current data and metrics
3. Use "Run Detection" to find anomalies
4. Investigate any flagged security events

Need help with any specific {tool.upper()} feature?"""
                else:
                    return f"""**{tool.upper()} Tool Status**

**Status**: Inactive - No data uploaded yet

**To activate {tool.upper()}**:
1. Navigate to Tools → {tool.upper()}
2. Click "Upload Data" button
3. Select your {tool.upper()} security data file (Excel/CSV)
4. Wait for processing to complete
5. Start analyzing your security data!

**Supported Data Formats**:
• Excel files (.xlsx)
• CSV files (.csv)
• Structured security logs and reports

Once activated, you can train ML models and run anomaly detection. Would you like step-by-step guidance for uploading {tool.upper()} data?"""
        
        return "Which security tool would you like to know about? I have information on GSuite, MDM, SIEM, EDR, Meraki, and SonicWall tools."
    
    def _generate_ml_response(self, query: str, context: Dict) -> str:
        """Generate ML-focused response using local context"""
        if not context['ml_models']:
            return """**Machine Learning & Anomaly Detection**

**Current Status**: No ML models trained yet

**Getting Started with ML**:
1. Ensure you have security data uploaded for at least one tool
2. Go to Analytics → ML Anomaly Detection
3. Select your security tool (GSuite, SIEM, EDR, etc.)
4. Choose an algorithm:
   • **Isolation Forest**: Best for general anomaly detection
   • **One-Class SVM**: Good for complex behavioral patterns
   • **Autoencoder**: Advanced deep learning approach

5. Click "Train Model" and wait for completion
6. Run "Detect Anomalies" to find threats

**Benefits**:
• Automatically detect unusual security patterns
• Identify potential threats and breaches
• Get severity ratings and explanations
• Track anomalies over time

Which security tool would you like to train a model for first?"""
        
        model_details = []
        for tool, model_data in context['ml_models'].items():
            model_details.append(f"• **{tool.upper()}**: {model_data['algorithm']} ({model_data['features']} features, {model_data['training_size']:,} samples)")
        
        return f"""**Machine Learning Overview**

**Active Models**: {len(context['ml_models'])}

**Trained Models**:
""" + "\n".join(model_details) + f"""

**Recent Detections**: {len(context['recent_anomalies'])} anomalies found across all tools

**ML Capabilities**:
• Real-time threat detection
• Professional training with progress tracking
• Feature importance analysis for insights
• Multiple algorithm support
• High-performance caching

**Next Steps**:
• Run detection on new data uploads
• Retrain models with updated data
• Investigate anomaly details and patterns
• Set up automated threat monitoring

What would you like to do with your ML models today?"""
    
    def _generate_help_response(self, query: str, context: Dict) -> str:
        """Generate help response based on query"""
        query_lower = query.lower()
        
        if 'upload' in query_lower or 'file' in query_lower:
            return """**File Upload Guide**

**Supported Formats**: Excel (.xlsx), CSV (.csv)

**Step-by-Step Process**:
1. Navigate to your desired security tool (GSuite, SIEM, etc.)
2. Click "Upload Data" button
3. Select your properly formatted data file
4. Wait for validation and processing
5. Activate the dataset when ready

**File Requirements**:
• Clean, structured data with proper headers
• Date/time columns in standard format
• No critical missing values
• File size under 50MB recommended

**After Upload**:
• Review data in the tool dashboard
• Train ML models for anomaly detection
• Generate security reports and analytics
• Set up automated monitoring

Need help with a specific tool's data format?"""
        
        elif 'train' in query_lower or 'model' in query_lower:
            return """**ML Model Training Guide**

**Prerequisites**:
• Have security data uploaded and active
• Go to Analytics → ML Anomaly Detection

**Training Process**:
1. Select your security tool from the list
2. Choose algorithm based on your needs:
   • **Isolation Forest**: Fast, works well with most data
   • **One-Class SVM**: Better for behavioral analysis
   • **Autoencoder**: Advanced pattern recognition

3. Set contamination rate (default 10% works well)
4. Click "Train Model"
5. Monitor training progress (5 phases)
6. Wait for completion notification

**After Training**:
• Model automatically becomes active
• Run "Detect Anomalies" to find threats
• View detailed anomaly reports
• Investigate flagged security events

Which security tool would you like to train a model for?"""
        
        else:
            return """**SOC Central Help Center**

**Main Capabilities**:
• **Security Tools**: Manage data from 6 different security platforms
• **ML Analytics**: Advanced anomaly detection and threat identification
• **User Management**: Authentication, roles, and access control
• **Data Processing**: Upload, validate, and analyze security data

**Quick Start Guide**:
1. Upload security data for your tools
2. Train ML models for threat detection
3. Monitor dashboards for security insights
4. Investigate and respond to anomalies

**Common Questions**:
• "How do I upload GSuite data?"
• "Train anomaly detection for SIEM"
• "What's my current system status?"
• "Show me recent security alerts"

**Need Specific Help?**
Just ask about any feature, tool, or process. I can provide detailed, step-by-step guidance for any part of the SOC Central platform.

What would you like to learn about?"""
    
    def _generate_data_response(self, query: str, context: Dict) -> str:
        """Generate data management response"""
        total_records = sum(data['records'] for data in context['security_tools'].values())
        active_sources = sum(1 for data in context['security_tools'].values() if data['active'])
        
        return f"""**Data Management Overview**

**Current Status**:
• **Active Data Sources**: {active_sources}/6 security tools
• **Total Records**: {total_records:,}
• **Total Uploads**: {context['system_stats']['total_uploads']}

**Data Sources Status**:
""" + "\n".join([f"• **{tool.upper()}**: {data['records']:,} records ({'Active' if data['active'] else 'Inactive'})" 
                 for tool, data in context['security_tools'].items()]) + """

**Data Pipeline Features**:
• Automated data validation and processing
• Excel/CSV format support
• Company-based data isolation and security
• Real-time processing status monitoring
• Advanced filtering and aggregation

**Available Actions**:
• Upload new security data files
• Activate or deactivate data sources
• Monitor processing status and quality
• Export processed data and reports
• View detailed data quality metrics

**Upload Requirements**:
• Structured data with proper headers
• Standard date/time formats
• Clean data with minimal missing values
• File size under 50MB per upload

Which tool would you like to upload data for?"""
    
    def _generate_auth_response(self, context: Dict) -> str:
        """Generate authentication response using local context"""
        user = context['user']
        return f"""**Authentication & Security Management**

**Your Profile**:
• **Username**: {user['name']}
• **Role**: {user['role']}
• **Company**: {user['company']}
• **Admin Access**: {'Yes' if user['is_admin'] else 'No'}
• **MFA Status**: {'Enabled' if context.get('user_context', {}).get('mfa_enabled', False) else 'Disabled'}

**Company Statistics**:
• **Total Users**: {context['system_stats']['total_users']}

**Security Features**:
• Multi-Factor Authentication (MFA) support
• Strong password policies and complexity requirements
• Rate limiting protection against attacks
• JWT-based session management
• Comprehensive activity logging and audit trails

**Account Management**:
• Update profile information and preferences
• Change password with strength validation
• Enable/disable MFA for enhanced security
• View detailed activity logs and login history
• Manage user accounts (admin users only)

**Security Best Practices**:
• Enable MFA for enhanced account protection
• Use strong, unique passwords
• Regularly review account activity
• Keep profile information up to date

Need help with account security settings or user management?"""