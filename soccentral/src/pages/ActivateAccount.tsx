// frontend/src/pages/ActivateAccount.tsx - QUICK FIX VERSION
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Shield,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  AlertCircle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ActivationPageLayout } from "@/components/auth/Activation/ActivationPageLayout";
import { Logo } from "@/components/shared/Logo";

// 🔥 CRITICAL: Dynamic API URL detection
const getApiBaseUrl = () => {
  // If we're on the same domain, use relative URLs
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    return "http://localhost:8000/api";
  }

  // For production, try to use the current domain first
  const currentDomain = window.location.origin;

  // List of possible API URLs to try
  return [
    `${currentDomain}/api`, // Same domain
    "https://soc-central-backend.onrender.com/api", // Render backend
    import.meta.env.VITE_API_URL ||
      "https://soc-central-backend.onrender.com/api",
  ];
};

const API_URLS = getApiBaseUrl();
console.log("🔧 DEBUG: API URLs to try:", API_URLS);

const ActivateAccount: React.FC = () => {
  console.log("📄 ActivateAccount: Component rendering");
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [success, setSuccess] = useState(false);
  const [tokenValidated, setTokenValidated] = useState(false);
  const [validationLoading, setValidationLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      console.log("❌ No token found");
      setErrors({
        general: ["The activation link is invalid or has expired."],
      });
      setValidationLoading(false);
      setTimeout(() => navigate("/auth"), 3000);
    } else {
      validateToken(token);
    }
  }, [token, navigate]);

  const validateToken = async (tokenToValidate: string) => {
    try {
      setValidationLoading(true);

      // 🔥 SMART: Try multiple API approaches
      const apiUrls = Array.isArray(API_URLS) ? API_URLS : [API_URLS];

      for (const baseUrl of apiUrls) {
        try {
          console.log(`🔍 Trying API: ${baseUrl}`);

          // First, test if the API is reachable with a health check
          const healthUrl = `${baseUrl}/auth/health/`;
          const healthResponse = await fetch(healthUrl, {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
          });

          console.log(`🏥 Health check for ${baseUrl}:`, healthResponse.status);

          if (!healthResponse.ok) {
            console.log(
              `❌ Health check failed for ${baseUrl}, trying next...`
            );
            continue;
          }

          // If health check passes, try token validation
          const validationUrl = `${baseUrl}/auth/validate-activation-token/${tokenToValidate}/`;
          console.log(`🔍 Validating token at: ${validationUrl}`);

          const response = await fetch(validationUrl, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          });

          console.log(`📊 Validation response:`, {
            status: response.status,
            ok: response.ok,
            contentType: response.headers.get("content-type"),
          });

          // Check if response is JSON
          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            const textResponse = await response.text();
            console.error(`❌ Non-JSON response:`, textResponse.slice(0, 200));

            if (textResponse.includes("<!DOCTYPE")) {
              console.log(
                `❌ Got HTML instead of JSON from ${baseUrl}, trying next...`
              );
              continue;
            }
          }

          const data = await response.json();
          console.log(`📊 Validation data:`, data);

          if (response.ok && data.success && data.valid) {
            console.log(`✅ Token validation successful with ${baseUrl}`);
            setTokenValidated(true);
            setErrors({});
            return;
          } else {
            console.log(`❌ Token validation failed:`, data.message);
            setErrors({
              general: [data.message || "Invalid activation token"],
            });
            return;
          }
        } catch (apiError) {
          console.error(`💥 API error for ${baseUrl}:`, apiError);
          continue;
        }
      }

      // If we get here, all APIs failed
      console.log("❌ All API endpoints failed");
      setErrors({
        general: [
          "Unable to connect to server. Please check your internet connection and try again.",
        ],
      });
    } catch (error) {
      console.error("💥 Token validation error:", error);
      setErrors({
        general: [
          "Unable to validate activation token. Please try again later.",
        ],
      });
    } finally {
      setValidationLoading(false);
    }
  };

  const handleActivation = async (
    password: string,
    confirmPassword: string
  ) => {
    if (!token) {
      setErrors({ general: ["Invalid activation token"] });
      return;
    }

    if (password !== confirmPassword) {
      setErrors({ general: ["Passwords do not match"] });
      return;
    }

    if (password.length < 8) {
      setErrors({ general: ["Password must be at least 8 characters long"] });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Use the same smart API detection for activation
      const apiUrls = Array.isArray(API_URLS) ? API_URLS : [API_URLS];

      for (const baseUrl of apiUrls) {
        try {
          const activationUrl = `${baseUrl}/auth/activate-account/`;
          console.log(`🔍 Activating account at: ${activationUrl}`);

          const response = await fetch(activationUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              token,
              password: password,
              confirm_password: confirmPassword,
            }),
          });

          console.log(`📊 Activation response:`, {
            status: response.status,
            ok: response.ok,
            contentType: response.headers.get("content-type"),
          });

          // Check if response is JSON
          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            const textResponse = await response.text();
            console.error(
              `❌ Non-JSON activation response:`,
              textResponse.slice(0, 200)
            );

            if (textResponse.includes("<!DOCTYPE")) {
              console.log(
                `❌ Got HTML instead of JSON from ${baseUrl}, trying next...`
              );
              continue;
            }
          }

          const data = await response.json();
          console.log(`📊 Activation data:`, data);

          if (data.success || response.ok) {
            console.log("✅ Account activation successful");
            setSuccess(true);

            toast({
              title: "Account Activated Successfully! 🎉",
              description:
                "Your account has been activated. You can now log in with your new password.",
            });

            setTimeout(() => {
              navigate("/auth");
            }, 3000);
            return;
          } else {
            console.log("❌ Account activation failed:", data.message);
            setErrors({
              general: [data.message || "Failed to activate account"],
            });
            return;
          }
        } catch (apiError) {
          console.error(`💥 Activation API error for ${baseUrl}:`, apiError);
          continue;
        }
      }

      // If we get here, all APIs failed
      setErrors({
        general: ["Unable to connect to server. Please try again later."],
      });
    } catch (error: any) {
      console.error("💥 Activation error:", error);
      setErrors({
        general: [error.message || "Network error occurred. Please try again."],
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

  // Show loading while validating token
  if (validationLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-slate-900 to-black-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">
              <UserCheck className="h-8 w-8 mx-auto mb-2" />
              Validating Activation Link
            </CardTitle>
            <CardDescription className="text-center">
              Please wait while we validate your activation link...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
            <div className="mt-4 text-xs text-center text-gray-500">
              Checking server connection...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error if no token or token validation failed
  if (!token || (!tokenValidated && Object.keys(errors).length > 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-slate-900 to-black-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              Invalid Activation Link
            </CardTitle>
            <CardDescription className="text-center">
              The account activation link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                {errors.general?.[0] ||
                  "The activation link is invalid or has expired. Please contact your administrator for a new activation link."}
              </AlertDescription>
            </Alert>

            {/* Debug info for development */}
            {process.env.NODE_ENV === "development" && (
              <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
                <strong>Debug Info:</strong>
                <br />
                URL: {window.location.href}
                <br />
                Token: {token || "Not found"}
                <br />
                API URLs: {JSON.stringify(API_URLS)}
              </div>
            )}

            <Button onClick={handleBackToLogin} className="w-full mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-black-900 p-4">
      {success ? (
        <div className="flex items-center justify-center min-h-screen">
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
                    <span>Account Activated Successfully!</span>
                  </div>
                </CardTitle>
                <CardDescription className="text-center">
                  You can now log in with your new password. Redirecting you to
                  the login page...
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Your account has been successfully activated. You will be
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
        </div>
      ) : (
        <div className="min-h-screen">
          {/* Header Section */}
          <div className="text-center py-8">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <Logo alt="SOC Central" className="h-20 w-20 object-contain" />
              <h1 className="text-3xl font-bold text-white">SOC Central</h1>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center space-x-2">
              <UserCheck className="h-6 w-6" />
              <span>Activate Your Account</span>
            </h2>
            <p className="text-gray-300">
              Set your password to complete account setup and gain access to SOC
              Central.
            </p>
          </div>

          <ActivationPageLayout
            onSubmit={handleActivation}
            loading={loading}
            errors={errors}
            onClearErrors={clearErrors}
            onBackToLogin={handleBackToLogin}
          />
        </div>
      )}
    </div>
  );
};

export default ActivateAccount;
