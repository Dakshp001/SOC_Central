// frontend/src/pages/ResetPasswordPage.tsx - ENHANCED VERSION
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { validatePassword } from "@/utils/passwordValidation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Shield,
  CheckCircle,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ResetPasswordPageLayout } from "@/components/auth/Reset-password/ResetPasswordPageLayout";
import { Logo } from "@/components/shared/Logo";

// Error Boundary Component
class ResetPasswordErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error("🚨 ResetPasswordErrorBoundary: Error caught:", error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      "🚨 ResetPasswordErrorBoundary: Error details:",
      error,
      errorInfo
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-slate-900 to-black-900 p-4 sm:p-6">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-center text-red-600">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertDescription>
                  An error occurred while loading the password reset page.
                  Please try refreshing the page or contact support.
                </AlertDescription>
              </Alert>
              <Button
                onClick={() => window.location.reload()}
                className="w-full mt-4"
              >
                Refresh Page
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export const ResetPasswordPage: React.FC = () => {
  console.log("🔄 ResetPasswordPage: Component rendering");
  console.log("📍 Current URL:", window.location.href);

  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();

  // State management
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [success, setSuccess] = useState(false);
  const [tokenValidated, setTokenValidated] = useState(false);

  // Get token from URL params or search params
  const resetToken = token || searchParams.get("token");

  console.log("🔍 ResetPasswordPage: URL Analysis", {
    urlToken: token,
    searchParamToken: searchParams.get("token"),
    finalToken: resetToken,
    currentURL: window.location.href,
    pathname: window.location.pathname,
    search: window.location.search,
  });

  // Token validation effect
  useEffect(() => {
    console.log("🔄 ResetPasswordPage: useEffect triggered", { resetToken });

    if (!resetToken) {
      console.log("❌ ResetPasswordPage: No token found");
      setErrors({
        general: ["The password reset link is invalid or has expired."],
      });

      // Delayed redirect to allow user to see the error
      setTimeout(() => {
        navigate("/auth");
      }, 3000);
    } else {
      console.log("✅ ResetPasswordPage: Token found, validating...");
      setTokenValidated(true);

      // Optional: Validate token with backend here
      // validateResetToken(resetToken);
    }
  }, [resetToken, navigate]);

  const handleResetPassword = async (
    newPassword: string,
    confirmPassword: string
  ) => {
    console.log("🔄 ResetPasswordPage: handleResetPassword called", {
      hasToken: !!resetToken,
      tokenLength: resetToken?.length,
      tokenValue: resetToken,
      passwordLength: newPassword.length,
      confirmPasswordLength: confirmPassword.length,
    });

    if (!resetToken) {
      console.log("❌ ResetPasswordPage: No reset token available");
      setErrors({ general: ["Invalid reset token"] });
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrors({ general: ["Passwords do not match"] });
      return;
    }

    // Very lenient validation - only check basic length
    if (newPassword.length < 4) {
      setErrors({ general: ["Password must be at least 4 characters long"] });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      console.log("🔄 ResetPasswordPage: Calling resetPassword API with token:", resetToken);

      const result = await resetPassword(resetToken, newPassword);
      console.log("🔥 ResetPasswordPage: API response", result);

      if (result.success) {
        console.log("✅ ResetPasswordPage: Password reset successful");
        setSuccess(true);

        toast({
          title: "Password Reset Successful! 🎉",
          description:
            "Your password has been reset successfully. You can now log in with your new password.",
        });

        // Redirect to login after 3 seconds
        setTimeout(() => {
          console.log("🔄 ResetPasswordPage: Redirecting to auth page");
          navigate("/auth");
        }, 3000);
      } else {
        console.log(
          "❌ ResetPasswordPage: Password reset failed",
          result.message,
          "Error code:",
          result.error_code
        );

        // Handle specific error cases
        let errorMessage = result.message || "Failed to reset password";

        if (result.error_code === 'WEAK_PASSWORD') {
          console.log("🔍 Backend password requirements:", result.password_requirements);
          if (result.password_requirements && result.password_requirements.length > 0) {
            errorMessage = "Backend password requirements: " + result.password_requirements.join(", ");
          } else {
            errorMessage = "Password does not meet security requirements. Please try a different password.";
          }
        } else if (result.error_code === 'TOKEN_EXPIRED') {
          errorMessage = "This reset link has expired. Please request a new password reset.";
        } else if (result.error_code === 'INVALID_TOKEN') {
          errorMessage = "Invalid reset link. Please request a new password reset.";
        } else if (result.missing_fields && result.missing_fields.length > 0) {
          errorMessage = `Missing required fields: ${result.missing_fields.join(", ")}`;
        }

        setErrors({ general: [errorMessage] });
      }
    } catch (error: any) {
      console.error("💥 ResetPasswordPage: Password reset error:", error);
      setErrors({
        general: [
          error.message || "An unexpected error occurred. Please try again.",
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const clearErrors = (field: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const handleBackToLogin = () => {
    navigate("/auth");
  };

  // Show error if no token
  if (!resetToken || !tokenValidated) {
    console.log("🔄 ResetPasswordPage: No token, showing error message");
    return (
      <ResetPasswordErrorBoundary>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-slate-900 to-black-900 p-4 sm:p-6">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-center text-red-600">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                Invalid Reset Link
              </CardTitle>
              <CardDescription className="text-center">
                The password reset link is invalid or has expired.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertDescription>
                  {errors.general?.[0] ||
                    "The password reset link is invalid or has expired. Please request a new password reset."}
                </AlertDescription>
              </Alert>
              <Button onClick={handleBackToLogin} className="w-full mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </ResetPasswordErrorBoundary>
    );
  }

  console.log("🎨 ResetPasswordPage: Rendering UI", { success, loading });

  return (
    <ResetPasswordErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-black-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        {success ? (
          <div className="w-full max-w-md space-y-6">
              {/* Logo and Header */}
              <div className="flex items-center justify-center space-x-4">
                <Logo alt="SOC Central" className="h-20 w-20 object-contain" />
                <h1 className="text-3xl font-bold text-white">SOC Central</h1>
              </div>

              {/* Success Card */}
              <Card className="w-full">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl text-center">
                    <div className="flex items-center justify-center space-x-2 text-green-600">
                      <CheckCircle className="h-6 w-6" />
                      <span>Password Reset Successful!</span>
                    </div>
                  </CardTitle>
                  <CardDescription className="text-center">
                    You can now log in with your new password. Redirecting you
                    to the login page...
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Your password has been successfully reset. You will be
                        redirected to the login page in a few seconds.
                      </AlertDescription>
                    </Alert>
                    <Button onClick={handleBackToLogin} className="w-full">
                      Go to Login Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
        ) : (
          <div className="w-full space-y-6">
            {/* Header Section */}
            <div className="text-center mb-6 lg:mb-8">
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 mb-4">
                <Logo alt="SOC Central" className="h-16 w-16 sm:h-20 sm:w-20 object-contain" />
                <h1 className="text-2xl sm:text-3xl font-bold text-white">SOC Central</h1>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2">
                <Lock className="h-5 w-5 sm:h-6 sm:w-6" />
                <span>Reset Your Password</span>
              </h2>
              <p className="text-gray-300 text-sm sm:text-base px-4">
                Enter your new password below to reset your account password.
              </p>
            </div>

            <ResetPasswordPageLayout
              onSubmit={handleResetPassword}
              loading={loading}
              errors={errors}
              onClearErrors={clearErrors}
              onBackToLogin={handleBackToLogin}
            />
          </div>
        )}
      </div>
    </ResetPasswordErrorBoundary>
  );
};

export default ResetPasswordPage;
