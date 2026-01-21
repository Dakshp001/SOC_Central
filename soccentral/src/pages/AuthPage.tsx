// soccentral/src/pages/AuthPage.tsx - Admin-Managed Authentication
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ProductionAlert,
  RateLimitAlert,
  AccountLockedAlert,
  LoginFailedAlert,
  NetworkErrorAlert,
} from "@/components/auth/ProductionAlert";

// Import the auth components (signup removed for admin-managed authentication)
import { LoginForm } from "@/components/auth/LoginForm";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { MfaVerificationForm } from "../components/auth/MfaVerificationForm";

import { Logo } from "@/components/shared/Logo";

type AuthView = "login" | "forgot-password" | "mfa-verification";

export const AuthPage: React.FC = () => {
  const { user, isAuthenticated, isLoading, signIn, verifyMfaCode, resendMfaCode, requestPasswordReset } =
    useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  // State management
  const [currentView, setCurrentView] = useState<AuthView>("login");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [mfaUserId, setMfaUserId] = useState<string>("");
  const [mfaUserEmail, setMfaUserEmail] = useState<string>("");

  // Redirect authenticated users
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log(
        "🔄 User authenticated, determining redirect based on role:",
        user.role
      );

      const currentPath = window.location.pathname;

      // Don't redirect if user is on password reset routes
      if (
        currentPath.startsWith("/reset-password") ||
        currentPath.startsWith("/debug-reset") ||
        currentPath.startsWith("/test-route")
      ) {
        console.log(
          "🔒 Skipping redirect - user is on password reset route:",
          currentPath
        );
        return;
      }

      const from = location.state?.from?.pathname || "/";

      // Role-based redirection
      if (user.role === "super_admin") {
        console.log("🎯 Redirecting super admin to user management");
        navigate("/admin/users");
      } else if (user.role === "admin") {
        console.log("🎯 Redirecting admin to user management");
        navigate("/admin/users");
      } else {
        console.log("🎯 Redirecting general user to dashboard");
        navigate(from !== "/" ? from : "/dashboard");
      }
    }
  }, [isAuthenticated, user]); // Only depend on auth state changes

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-white text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          </div>
          <p className="text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // If already authenticated, show loading while redirecting
  if (isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-white text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          </div>
          <p className="text-lg font-medium">Redirecting...</p>
        </div>
      </div>
    );
  }

  const handleLogin = async (email: string, password: string) => {
    console.log("🔐 Attempting login for:", email);
    setLoading(true);
    setErrors({});

    try {
      const result = await signIn(email, password);

      if (result.success) {
        // Check if MFA is required
        if (result.require_mfa && result.user_id) {
          console.log("🔐 MFA required for:", email);
          setMfaUserId(result.user_id);
          setMfaUserEmail(email);
          setCurrentView("mfa-verification");
          setErrors({});
          return;
        }
        
        console.log("✅ Login successful, user role:", result.user?.role);
        // Manual redirect after successful login
        if (
          result.user?.role === "super_admin" ||
          result.user?.role === "admin"
        ) {
          navigate("/admin/users");
        } else {
          navigate("/dashboard");
        }
      } else {
        console.log("❌ Login failed:", result.message);

        // Handle different login error types
        if ((result as any).status === 429) {
          // Rate limit exceeded
          const retryAfter = (result as any).retry_after || 900; // Default to 15 minutes
          setErrors({
            rate_limit: [
              result.message ||
                "Too many login attempts. Please wait before trying again.",
            ],
            retry_after: [retryAfter.toString()],
          });
        } else if ((result as any).status === 423) {
          // Account locked
          const unlockTime = (result as any).unlock_time || 1800; // Default to 30 minutes
          setErrors({
            account_locked: [
              result.message ||
                "Account temporarily locked due to multiple failed attempts.",
            ],
            unlock_time: [unlockTime.toString()],
          });
        } else if ((result as any).status === 401) {
          // Invalid credentials - show attempts left if available
          const attemptsLeft = (result as any).attempts_left || 0;
          setErrors({
            login_failed: [result.message || "Invalid email or password."],
            attempts_left: [attemptsLeft.toString()],
          });
        } else {
          // General error
          setErrors({ general: [result.message] });
        }
      }
    } catch (error: any) {
      console.error("🚨 Login error:", error);

      // Determine error type
      if (error.name === "TypeError" && error.message?.includes("fetch")) {
        setErrors({
          network: [
            "Unable to connect to server. Please check your internet connection and try again.",
          ],
        });
      } else if ((error as any).status === 429) {
        setErrors({
          rate_limit: [
            "Too many login attempts. Please wait before trying again.",
          ],
          retry_after: ["900"],
        });
      } else {
        setErrors({
          general: [
            error.message || "An unexpected error occurred. Please try again.",
          ],
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (email: string) => {
    setLoading(true);
    setErrors({}); // Clear all previous errors

    try {
      const result = await requestPasswordReset(email);

      if (result.success) {
        toast({
          title: "Reset Email Sent",
          description:
            "If an account with that email exists, password reset instructions have been sent.",
        });
        setCurrentView("login");
      } else {
        // Handle different error types - clear success first
        setErrors({});
        if ((result as any).status === 429) {
          // Rate limit error
          const retryAfter = (result as any).retry_after || 3600; // Default to 1 hour
          setErrors({
            rate_limit: [result.message],
            retry_after: [retryAfter.toString()],
          });
        } else if (
          result.message?.includes("network") ||
          result.message?.includes("connection")
        ) {
          // Network error
          setErrors({
            network: [
              "Unable to connect to server. Please check your internet connection.",
            ],
          });
        } else {
          // General error
          setErrors({ general: [result.message] });
        }
      }
    } catch (error: any) {
      console.error("🚨 Password reset error:", error);

      // Clear any success messages and show error
      setErrors({});

      // Determine error type based on error properties
      if (error.name === "TypeError" && error.message?.includes("fetch")) {
        setErrors({
          network: [
            "Unable to connect to server. Please check your internet connection and try again.",
          ],
        });
      } else if ((error as any).status === 429) {
        setErrors({
          rate_limit: [
            "Too many password reset attempts. Please wait before trying again.",
          ],
          retry_after: ["3600"],
        });
      } else {
        setErrors({
          general: [
            error.message || "An unexpected error occurred. Please try again.",
          ],
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setCurrentView("login");
    setErrors({});
    setMfaUserId("");
    setMfaUserEmail("");
  };

  const handleMfaVerify = async (code: string) => {
    setLoading(true);
    setErrors({});

    try {
      const result = await verifyMfaCode(mfaUserId, code);

      if (result.success) {
        console.log("✅ MFA verification successful, user role:", result.user?.role);
        // Manual redirect after successful MFA verification
        if (
          result.user?.role === "super_admin" ||
          result.user?.role === "admin"
        ) {
          navigate("/admin/users");
        } else {
          navigate("/dashboard");
        }
      } else {
        console.log("❌ MFA verification failed:", result.message);
        setErrors({ code: [result.message] });
      }
    } catch (error: any) {
      console.error("🚨 MFA verification error:", error);
      setErrors({
        general: [
          error.message || "MFA verification failed. Please try again.",
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMfaResend = async () => {
    setLoading(true);
    setErrors({});

    try {
      const result = await resendMfaCode(mfaUserId);

      if (result.success) {
        toast({
          title: "Code Sent",
          description: "A new verification code has been sent to your email.",
        });
      } else {
        setErrors({ general: [result.message] });
      }
    } catch (error: any) {
      console.error("🚨 MFA resend error:", error);
      setErrors({
        general: [
          error.message || "Failed to resend code. Please try again.",
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container min-h-screen bg-black">
      {/* Mobile Layout */}
      <div className="lg:hidden min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Logo and Header */}
          <div className="flex items-center justify-center space-x-4">
            <Logo alt="SOC Central" className="h-16 w-16 object-contain" />
            <h1 className="text-3xl font-bold text-white">SOC Central</h1>
          </div>

          {/* Auth Card */}
          <Card className="w-full bg-gray-900 shadow-2xl border border-gray-700">
            <CardHeader className="space-y-1 px-6">
              <CardTitle className="text-2xl text-center">
                {currentView === "login"
                  ? "Welcome Back"
                  : currentView === "forgot-password"
                  ? "Reset Password"
                  : currentView === "mfa-verification"
                  ? ""
                  : "Welcome Back"}
              </CardTitle>
              <CardDescription className="text-center">
                {currentView === "login"
                  ? "Sign in to your account to continue"
                  : currentView === "forgot-password"
                  ? "Enter your email to receive reset instructions"
                  : currentView === "mfa-verification"
                  ? ""
                  : "Sign in to your account to continue"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-6 pb-8">
              {/* Login View */}
              {currentView === "login" && (
                <>
                  <LoginForm
                    onSubmit={handleLogin}
                    loading={loading}
                    errors={errors}
                    onForgotPassword={() => setCurrentView("forgot-password")}
                    onClearErrors={(field: string) => {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors[field];
                        return newErrors;
                      });
                    }}
                  />

                  <div className="text-center">
                    <Button
                      variant="link"
                      onClick={() => setCurrentView("forgot-password")}
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      Forgot your password?
                    </Button>
                  </div>

                  {/* Admin-managed authentication notice */}
                  <Alert className="mt-4">
                    <Users className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Need an account?</strong> Contact your
                      administrator to create an account for you.
                      Self-registration is not available for security reasons.
                    </AlertDescription>
                  </Alert>
                </>
              )}

              {/* MFA Verification View */}
              {currentView === "mfa-verification" && (
                <MfaVerificationForm
                  userId={mfaUserId}
                  userEmail={mfaUserEmail}
                  onVerify={handleMfaVerify}
                  onResend={handleMfaResend}
                  onBack={handleBackToLogin}
                  loading={loading}
                  errors={errors}
                  onClearErrors={(field: string) => {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors[field];
                      return newErrors;
                    });
                  }}
                  // Start with 2-min cooldown after code is sent
                  initialCooldownSeconds={120}
                  // Force enable resend if backend indicates attempts exhausted
                  forceEnableResend={Boolean(errors?.code?.[0]?.toLowerCase().includes('too many incorrect attempts') || errors?.general?.[0]?.toLowerCase().includes('too many incorrect attempts'))}
                />
              )}

              {/* Forgot Password View */}
              {currentView === "forgot-password" && (
                <>
                  <ForgotPasswordForm
                    onSubmit={handleForgotPassword}
                    onBack={handleBackToLogin}
                    loading={loading}
                    errors={errors}
                  />

                  <Alert>
                    <Mail className="h-4 w-4" />
                    <AlertDescription>
                      We'll send password reset instructions to your email if an
                      account exists. The reset link will expire in 1 hour for
                      security.
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Desktop Two-Column Layout - Black Background */}
      <div className="hidden lg:flex min-h-screen bg-black relative">
        {/* Left Column - Branding & Information */}
        <div className="flex-1 relative z-10 flex flex-col justify-center items-center p-8 xl:p-12">
          <div className="max-w-lg space-y-8">
            {/* Logo and Title */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-4">
                <Logo alt="SOC Central" className="h-20 w-20 object-contain" />
                <h1 className="text-4xl xl:text-5xl font-bold text-white">
                  SOC Central
                </h1>
              </div>
              <p className="text-lg text-blue-100/80">
                Enterprise Security Operations Dashboard
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full mt-3"></div>
                <div>
                  <h3 className="text-white font-semibold">
                    Real-time Threat Monitoring
                  </h3>
                  <p className="text-blue-100/70">
                    Comprehensive security analytics and incident response
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full mt-3"></div>
                <div>
                  <h3 className="text-white font-semibold">
                    Multi-Platform Integration
                  </h3>
                  <p className="text-blue-100/70">
                    SIEM, EDR, GSuite, and network security in one dashboard
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full mt-3"></div>
                <div>
                  <h3 className="text-white font-semibold">
                    Advanced Analytics
                  </h3>
                  <p className="text-blue-100/70">
                    Machine learning powered threat detection and compliance
                    tracking
                  </p>
                </div>
              </div>
            </div>

            {/* Visual Enhancement */}
            <div className="text-center pt-8">
              <div className="inline-flex items-center space-x-2 text-blue-200/60 text-sm">
                <div className="w-8 h-px bg-blue-400/30"></div>
                <span>Secure • Reliable • Enterprise-grade</span>
                <div className="w-8 h-px bg-blue-400/30"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Authentication Form */}
        <div className="flex-1 relative z-10 flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-6">
            {/* Auth Card */}
            <Card className="w-full bg-gray-900 shadow-2xl border border-gray-700">
              <CardHeader className="space-y-1 px-8 py-6">
                <CardTitle className="text-2xl text-center text-white">
                  {currentView === "login"
                    ? "Welcome Back"
                    : currentView === "forgot-password"
                    ? "Reset Password"
                    : currentView === "mfa-verification"
                    ? ""
                    : "Welcome Back"}
                </CardTitle>
                <CardDescription className="text-center text-gray-300">
                  {currentView === "login"
                    ? "Sign in to your account to continue"
                    : currentView === "forgot-password"
                    ? "Enter your email to receive reset instructions"
                    : currentView === "mfa-verification"
                    ? ""
                    : "Sign in to your account to continue"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-8 pb-8">
                {/* Desktop Login View */}
                {currentView === "login" && (
                  <>
                    <LoginForm
                      onSubmit={handleLogin}
                      loading={loading}
                      errors={errors}
                      onForgotPassword={() => setCurrentView("forgot-password")}
                      onClearErrors={(field: string) => {
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors[field];
                          return newErrors;
                        });
                      }}
                    />

                    <div className="text-center">
                      <Button
                        variant="link"
                        onClick={() => setCurrentView("forgot-password")}
                        className="text-sm text-gray-400 hover:text-blue-400"
                      >
                        Forgot your password?
                      </Button>
                    </div>

                    {/* Admin-managed authentication notice */}
                    <Alert className="mt-4 bg-gray-800/50 border-gray-600">
                      <Users className="h-4 w-4 text-blue-400" />
                      <AlertDescription className="text-gray-300">
                        <strong>Need an account?</strong> Contact your
                        administrator to create an account for you.
                        Self-registration is not available for security reasons.
                      </AlertDescription>
                    </Alert>
                  </>
                )}

                {/* Desktop MFA Verification View */}
                {currentView === "mfa-verification" && (
                  <MfaVerificationForm
                    userId={mfaUserId}
                    userEmail={mfaUserEmail}
                    onVerify={handleMfaVerify}
                    onResend={handleMfaResend}
                    onBack={handleBackToLogin}
                    loading={loading}
                    errors={errors}
                    onClearErrors={(field: string) => {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors[field];
                        return newErrors;
                      });
                    }}
                    initialCooldownSeconds={120}
                    forceEnableResend={Boolean(errors?.code?.[0]?.toLowerCase().includes('too many incorrect attempts') || errors?.general?.[0]?.toLowerCase().includes('too many incorrect attempts'))}
                  />
                )}

                {/* Desktop Forgot Password View */}
                {currentView === "forgot-password" && (
                  <>
                    <ForgotPasswordForm
                      onSubmit={handleForgotPassword}
                      onBack={handleBackToLogin}
                      loading={loading}
                      errors={errors}
                    />

                    <Alert className="bg-gray-800/50 border-gray-600">
                      <Mail className="h-4 w-4 text-blue-400" />
                      <AlertDescription className="text-gray-300">
                        We'll send password reset instructions to your email if
                        an account exists. The reset link will expire in 1 hour
                        for security.
                      </AlertDescription>
                    </Alert>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;