// soccentral/src/components/auth/Activation/ActivationValidation.tsx
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, AlertCircle } from "lucide-react";
import { PasswordChecklist } from "../PasswordChecklist";

interface ActivationValidationProps {
  password: string;
  confirmPassword: string;
}

export const ActivationValidation: React.FC<ActivationValidationProps> = ({
  password,
  confirmPassword,
}) => {
  return (
    <div className="w-full">
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-8 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-lg">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
              <Lock className="h-5 w-5 text-blue-600" />
              Password Requirements
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Your password must meet these security criteria
            </p>
          </div>

          <PasswordChecklist password={password} showTitle={false} />
        </div>

        <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-300">
            <strong>Security Notice:</strong> This password will protect
            access to sensitive security operations center data. Choose a
            strong, unique password.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};