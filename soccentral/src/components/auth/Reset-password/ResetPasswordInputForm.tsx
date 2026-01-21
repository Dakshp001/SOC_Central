// soccentral/src/components/auth/Reset-password/ResetPasswordInputForm.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { validatePassword } from "@/utils/passwordValidation";

interface ResetPasswordInputFormProps {
  onSubmit: (newPassword: string, confirmPassword: string) => Promise<void>;
  loading?: boolean;
  errors?: Record<string, string[]>;
  onClearErrors?: (field: string) => void;
  onPasswordChange?: (password: string, confirmPassword: string) => void;
}

export const ResetPasswordInputForm: React.FC<ResetPasswordInputFormProps> = ({
  onSubmit,
  loading = false,
  errors = {},
  onClearErrors,
  onPasswordChange,
}) => {
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    if (onClearErrors) {
      onClearErrors(field);
      onClearErrors('general');
    }
    
    if (onPasswordChange) {
      onPasswordChange(newFormData.newPassword, newFormData.confirmPassword);
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
  const hasGeneralError = errors.general;
  const passwordValidation = validatePassword(formData.newPassword);

  return (
    <div className="w-full">
      {/* General Error */}
      {hasGeneralError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errors.general[0]}
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-white dark:bg-gray-900/50 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Reset Your Password
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Enter a new secure password for your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              New Password
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) => handleInputChange("newPassword", e.target.value)}
                placeholder="Enter your new password"
                className={`pr-12 h-12 text-base ${hasPasswordError || (!passwordValidation.isValid && formData.newPassword) ? "border-red-500 focus:border-red-500" : "focus:border-blue-500"}`}
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
            {errors.new_password && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.new_password[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirm New Password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                placeholder="Confirm your new password"
                className={`pr-12 h-12 text-base ${hasPasswordError || (formData.confirmPassword && !passwordsMatch) ? "border-red-500 focus:border-red-500" : "focus:border-blue-500"}`}
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
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.confirm_password[0]}
              </p>
            )}
            {formData.confirmPassword && !passwordsMatch && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Passwords do not match
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
            disabled={loading || !formData.newPassword || !formData.confirmPassword || !passwordsMatch || !passwordValidation.isValid}
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
  );
};