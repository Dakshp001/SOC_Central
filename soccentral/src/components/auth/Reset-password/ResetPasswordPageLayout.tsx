// soccentral/src/components/auth/Reset-password/ResetPasswordPageLayout.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, AlertCircle, Loader2, Lock, ArrowLeft } from "lucide-react";
import { SimplePasswordValidation } from "../SimplePasswordValidation";
import { validatePassword } from "@/utils/passwordValidation";

interface ResetPasswordPageLayoutProps {
  onSubmit: (newPassword: string, confirmPassword: string) => Promise<void>;
  loading?: boolean;
  errors?: Record<string, string[]>;
  onClearErrors?: (field: string) => void;
  onBackToLogin?: () => void;
}

export const ResetPasswordPageLayout: React.FC<ResetPasswordPageLayoutProps> = ({
  onSubmit,
  loading = false,
  errors = {},
  onClearErrors,
  onBackToLogin,
}) => {
  const [formData, setFormData] = useState({
    newPassword: "",
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

    const validation = validatePassword(formData.newPassword);

    if (!validation.isValid) {
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      return;
    }

    await onSubmit(formData.newPassword, formData.confirmPassword);
  };

  const passwordsMatch = formData.newPassword === formData.confirmPassword;
  const hasPasswordError = errors.new_password || errors.confirm_password;
  const passwordValidation = validatePassword(formData.newPassword);

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 lg:gap-8 px-4 sm:px-6 lg:px-8 pb-6 lg:pb-8 w-full max-w-7xl mx-auto">
      {/* Left Column - Input Form */}
      <div className="flex justify-center lg:justify-end order-1 lg:order-1">
        <div className="w-full max-w-lg">
          <div className="bg-black p-6 sm:p-8 rounded-2xl border border-gray-800 shadow-lg">
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Reset Your Password
              </h2>
              <p className="text-gray-400 text-sm sm:text-base">
                Enter a new secure password for your account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-medium text-gray-300">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={formData.newPassword}
                    onChange={(e) => handleInputChange("newPassword", e.target.value)}
                    placeholder="Enter your new password"
                    className={`pr-12 h-10 sm:h-12 text-sm sm:text-base ${
                      hasPasswordError || (!passwordValidation.isValid && formData.newPassword)
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
                    className="absolute right-1 top-1 h-8 w-8 sm:h-10 sm:w-10 hover:bg-gray-100 dark:hover:bg-gray-800"
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
                {errors.new_password && (
                  <p className="text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.new_password[0]}
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
                    className={`pr-12 h-10 sm:h-12 text-sm sm:text-base ${
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
                    className="absolute right-1 top-1 h-8 w-8 sm:h-10 sm:w-10 hover:bg-gray-100 dark:hover:bg-gray-800"
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
                className="w-full h-10 sm:h-12 text-sm sm:text-base font-semibold bg-blue-600 hover:bg-blue-700"
                disabled={
                  loading ||
                  !formData.newPassword ||
                  !formData.confirmPassword ||
                  !passwordsMatch ||
                  !passwordValidation.isValid
                }
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Right Column - Validation */}
      <div className="flex justify-center lg:justify-start order-2 lg:order-2">
        <div className="w-full max-w-lg">
          <div className="bg-black p-6 sm:p-8 rounded-2xl border border-gray-800 shadow-lg">
            <div className="mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                Password Requirements
              </h3>
              <p className="text-gray-400 text-xs sm:text-sm">
                Your new password must meet these criteria
              </p>
            </div>
            
            <SimplePasswordValidation password={formData.newPassword} />
            
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