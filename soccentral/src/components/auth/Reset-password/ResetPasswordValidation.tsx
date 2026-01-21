// soccentral/src/components/auth/Reset-password/ResetPasswordValidation.tsx
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock } from "lucide-react";
import { PasswordChecklist } from "../PasswordChecklist";

interface ResetPasswordValidationProps {
  password: string;
  confirmPassword: string;
}

export const ResetPasswordValidation: React.FC<ResetPasswordValidationProps> = ({
  password,
  confirmPassword,
}) => {
  return (
    <div className="w-full">
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-8 rounded-2xl border border-green-200 dark:border-green-800 shadow-lg">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
              <Lock className="h-5 w-5 text-green-600" />
              Password Requirements
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Your new password must meet these security criteria
            </p>
          </div>
          
          <PasswordChecklist password={password} showTitle={false} />
        </div>

        <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <Lock className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-300">
            <strong>Password Reset:</strong> Once changed, you'll need to use this new password for all future logins to your SOC Central account.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};