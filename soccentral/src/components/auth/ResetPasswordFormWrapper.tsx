// soccentral/src/components/auth/ResetPasswordFormWrapper.tsx
import React, { useState } from "react";
import { ResetPasswordInputForm } from "./Reset-password/ResetPasswordInputForm";
import { ResetPasswordValidation } from "./Reset-password/ResetPasswordValidation";

interface ResetPasswordFormWrapperProps {
  onSubmit: (newPassword: string, confirmPassword: string) => Promise<void>;
  loading?: boolean;
  errors?: Record<string, string[]>;
  onClearErrors?: (field: string) => void;
}

export const ResetPasswordFormWrapper: React.FC<ResetPasswordFormWrapperProps> = ({
  onSubmit,
  loading = false,
  errors = {},
  onClearErrors,
}) => {
  const [passwords, setPasswords] = useState({
    password: "",
    confirmPassword: "",
  });

  const handlePasswordChange = (password: string, confirmPassword: string) => {
    setPasswords({ password, confirmPassword });
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8 px-8 pb-8">
      {/* Left Column - Input Form */}
      <div className="flex justify-center lg:justify-end">
        <ResetPasswordInputForm
          onSubmit={onSubmit}
          loading={loading}
          errors={errors}
          onClearErrors={onClearErrors}
          onPasswordChange={handlePasswordChange}
        />
      </div>

      {/* Right Column - Validation */}
      <div className="flex justify-center lg:justify-start">
        <ResetPasswordValidation
          password={passwords.password}
          confirmPassword={passwords.confirmPassword}
        />
      </div>
    </div>
  );
};