// frontend/src/App.tsx - FIXED ROUTE CONFIGURATION
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/pages/Main_dashboard/ThemeProvider";
import { AuthProvider, ProtectedRoute } from "@/contexts/AuthContext";
import { ToolDataProvider } from "@/contexts/ToolDataContext";
import { SecurityProvider } from "@/contexts/SecurityContext";
import { usePerformance } from "@/hooks/usePerformance";
import { FullScreenLoading } from "@/components/common/LoadingSpinner";
import { ServiceDashboard } from "@/components/common/ServiceDashboard";
import ErrorBoundary from "@/components/common/ErrorBoundary";

// Lazy load components for better performance
const Index = React.lazy(() => import("@/pages/Index"));
const Analytics = React.lazy(() => import("@/pages/Analytics"));
const AuthPage = React.lazy(() => import("@/pages/AuthPage"));
const ResetPasswordPage = React.lazy(() => import("@/pages/ResetPasswordPage"));
const UserManagement = React.lazy(() => import("@/components/admin/UserManagement"));
const ActivateAccount = React.lazy(() => import("@/pages/ActivateAccount"));
const ReportsPage = React.lazy(() => import("@/pages/ReportsPage"));
const CreateReportPage = React.lazy(() => import("@/pages/CreateReportPage"));
const ReportViewPage = React.lazy(() => import("@/pages/ReportViewPage"));
const MLAnomalyPage = React.lazy(() => import("@/pages/MLAnomalyPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutes - extended for better caching
      gcTime: 15 * 60 * 1000, // 15 minutes - cache unused data longer
      retry: 2,
      refetchOnWindowFocus: false, // Disable refetch on window focus for better performance
      refetchOnMount: false, // Only refetch if data is stale
      refetchOnReconnect: false, // Don't refetch automatically on reconnect
    },
    mutations: {
      retry: 1, // Retry failed mutations once
    },
  },
});

const App = () => {
  console.log('🚀 SOC Central App Loading');
  console.log('🔍 Current URL:', window.location.href);
  console.log('⚡ Build time:', '2025-08-30T18:50:00Z'); // Force deployment
  
  
  // Skip all performance monitoring and smooth scrolling in production
  if (import.meta.env.DEV) {
    usePerformance();
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <ToolDataProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                <SecurityProvider>
                  <React.Suspense fallback={<FullScreenLoading message="Loading..." variant="app" />}>
                    <Routes>
                    {/* 
                      🔥 CRITICAL: PASSWORD RESET ROUTES - HIGHEST PRIORITY
                      Must be first to prevent auth context interference
                    */}
                    <Route 
                      path="/reset-password/:token" 
                      element={<ResetPasswordPage />} 
                    />
                    <Route 
                      path="/reset-password" 
                      element={<ResetPasswordPage />} 
                    />
                    
                    {/* 
                      🆕 FIXED: ACCOUNT ACTIVATION ROUTES - PROPER CONFIGURATION
                    */}
                    <Route 
                      path="/activate-account/:token" 
                      element={<ActivateAccount />}  // ✅ FIXED: Use element prop consistently
                    />
                    <Route 
                      path="/activate-account" 
                      element={<ActivateAccount />}  // ✅ ADDED: Handle route without token
                    />
                    
                    {/* 
                      🔐 AUTHENTICATION ROUTES
                    */}
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/login" element={<Navigate to="/auth" replace />} />
                    
                    {/* 
                      🏠 ROOT ROUTE
                    */}
                    <Route path="/" element={<Navigate to="/auth" replace />} />
                    
                    {/* 
                      🛡️ PROTECTED ROUTES
                    */}
                    
                    {/* Dashboard Routes */}
                    <Route 
                      path="/dashboard" 
                      element={
                        <ProtectedRoute>
                          <Index />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/main" 
                      element={<Navigate to="/dashboard" replace />} 
                    />
                    <Route 
                      path="/home" 
                      element={<Navigate to="/dashboard" replace />} 
                    />
                    
                    {/* Analytics */}
                    <Route 
                      path="/analytics" 
                      element={
                        <ProtectedRoute>
                          <Analytics />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/data-analysis" 
                      element={<Navigate to="/analytics" replace />} 
                    />
                    
                    {/* Tool Routes - Require Admin/Write Access */}
                    {['/gsuite', '/mdm', '/siem', '/edr', '/meraki', '/sonicwall'].map(path => (
                      <Route 
                        key={path}
                        path={path} 
                        element={
                          <ProtectedRoute requireWrite>
                            <Analytics />
                          </ProtectedRoute>
                        } 
                      />
                    ))}
                    
                    {/* Admin Routes */}
                    <Route 
                      path="/admin/users" 
                      element={
                        <ProtectedRoute requireAdmin>
                          <UserManagement />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin" 
                      element={<Navigate to="/admin/users" replace />} 
                    />
                    
                    {/* ML Anomaly Detection - Admin Only */}
                    <Route
                      path="/ml-anomaly"
                      element={
                        <ProtectedRoute requireAdmin>
                          <MLAnomalyPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* SOC Reports Routes - Admin Only */}
                    <Route
                      path="/reports"
                      element={
                        <ProtectedRoute requireAdmin>
                          <ReportsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route 
                      path="/reports/create" 
                      element={
                        <ProtectedRoute requireAdmin>
                          <CreateReportPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/reports/:reportId" 
                      element={
                        <ProtectedRoute requireAdmin>
                          <ReportViewPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/reports/:reportId/edit" 
                      element={
                        <ProtectedRoute requireAdmin>
                          <ReportViewPage />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Catch-all route */}
                    <Route 
                      path="*" 
                      element={<Navigate to="/auth" replace />} 
                    />
                  </Routes>
                  </React.Suspense>
                  
                  {/* Service Dashboard - Available on all protected routes */}
                  <ServiceDashboard />
                </SecurityProvider>
              </BrowserRouter>
            </TooltipProvider>
          </ToolDataProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;