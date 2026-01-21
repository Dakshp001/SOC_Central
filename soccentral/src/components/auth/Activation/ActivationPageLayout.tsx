// soccentral/src/components/auth/Activation/ActivationPageLayout.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, AlertCircle, Loader2, Shield, ArrowLeft } from "lucide-react";
import { SimplePasswordValidation } from "../SimplePasswordValidation";
import { validatePassword } from "@/utils/passwordValidation";

interface ActivationPageLayoutProps {
  onSubmit: (password: string, confirmPassword: string) => Promise<void>;
  loading?: boolean;
  errors?: Record<string, string[]>;
  onClearErrors?: (field: string) => void;
  onBackToLogin?: () => void;
}

export const ActivationPageLayout: React.FC<ActivationPageLayoutProps> = ({
  onSubmit,
  loading = false,
  errors = {},
  onClearErrors,
  onBackToLogin,
}) => {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (onClearErrors) {
      onClearErrors(field);
      onClearErrors("general");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validatePassword(formData.password);

    if (!validation.isValid) {
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      return;
    }

    await onSubmit(formData.password, formData.confirmPassword);
  };

  const passwordsMatch = formData.password === formData.confirmPassword;
  const hasPasswordError = errors.password || errors.confirm_password;
  const passwordValidation = validatePassword(formData.password);

  return (
    <div className="grid lg:grid-cols-2 gap-8 px-8 pb-8">
      {/* Left Column - Input Form */}
      <div className="flex justify-center lg:justify-end">
        <div className="w-full max-w-lg">
          <div className="bg-black p-8 rounded-2xl border border-gray-800 shadow-lg">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                Set Your Password
              </h2>
              <p className="text-gray-400">
                Create a secure password for your account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-300">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    placeholder="Enter your new password"
                    className={`pr-12 h-12 text-base ${
                      hasPasswordError || (!passwordValidation.isValid && formData.password)
                        ? "border-red-500 focus:border-red-500"
                        : "focus:border-blue-500"
                    }`}
                    disabled={loading}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-10 w-10 hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password[0]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    placeholder="Confirm your password"
                    className={`pr-12 h-12 text-base ${
                      hasPasswordError || (formData.confirmPassword && !passwordsMatch)
                        ? "border-red-500 focus:border-red-500"
                        : "focus:border-blue-500"
                    }`}
                    disabled={loading}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-10 w-10 hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
                {errors.confirm_password && (
                  <p className="text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.confirm_password[0]}
                  </p>
                )}
                {formData.confirmPassword && !passwordsMatch && (
                  <p className="text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Passwords do not match
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700"
                disabled={
                  loading ||
                  !formData.password ||
                  !formData.confirmPassword ||
                  !passwordsMatch ||
                  !passwordValidation.isValid
                }
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Activating Account...
                  </>
                ) : (
                  "Activate Account"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Right Column - Validation */}
      <div className="flex justify-center lg:justify-start">
        <div className="w-full max-w-lg">
          <div className="bg-black p-8 rounded-2xl border border-gray-800 shadow-lg">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-400" />
                Password Requirements
              </h3>
              <p className="text-gray-400 text-sm">
                Your password must meet these criteria
              </p>
            </div>
            
            <SimplePasswordValidation password={formData.password} />
            
            {/* Back to Login Button */}
            {onBackToLogin && (
              <div className="mt-6">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onBackToLogin}
                  className="w-full text-gray-400 hover:text-white hover:bg-gray-800"
                  disabled={loading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};