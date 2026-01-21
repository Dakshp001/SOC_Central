// ML Anomaly Detection - Standalone Page
// This page is accessible only to Admin and Super Admin users
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AnomalyDetectionDashboard } from '@/components/ml/AnomalyDetectionDashboard';
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';
import { AnimatedSection } from '@/components/animations/ScrollAnimations';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

export const MLAnomalyPage: React.FC = () => {
  const { user, canWrite } = useAuth();
  const { actualTheme } = useTheme();
  const navigate = useNavigate();

  // Access control - only Admin and Super Admin can access
  if (!canWrite()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50 dark:bg-gradient-to-b dark:from-black dark:via-gray-900 dark:to-gray-800 p-6">
        <Alert variant="destructive" className="max-w-md">
          <ShieldAlert className="h-5 w-5" />
          <AlertDescription className="ml-2">
            <div className="font-semibold mb-2">Access Denied</div>
            <div className="text-sm">
              You do not have permission to access ML Anomaly Detection. This feature is only available to Admin and Super Admin users.
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => navigate('/dashboard')}
            >
              Return to Dashboard
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="ml-anomaly-page min-h-screen transition-colors duration-300 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Enhanced Web-Focused Header */}
      <div className="bg-background/95 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50 shadow-lg">
        <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-12 xl:px-16">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="flex items-center gap-3 hover:bg-background/80 transition-all duration-200 px-4 py-2 rounded-lg group"
              >
                <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform duration-200" />
                <span className="font-medium">Back to Dashboard</span>
              </Button>
              <div className="h-8 w-px bg-border/50" />
            </div>
            <div className="flex-1 text-center">
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                ML Anomaly Detection
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Advanced machine learning-based anomaly detection for comprehensive security monitoring
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">System Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Web-Focused Main Content */}
      <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-12 xl:px-16 py-8 lg:py-12">
        <AnimatedSection delay={200} direction="up">
          <AnomalyDetectionDashboard />
        </AnimatedSection>
      </div>
    </div>
  );
};

export default MLAnomalyPage;
