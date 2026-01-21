// soccentral/src/components/auth/SimplePasswordValidation.tsx
import React from "react";
import { Check, X } from "lucide-react";

interface SimplePasswordValidationProps {
  password: string;
}

export const SimplePasswordValidation: React.FC<SimplePasswordValidationProps> = ({
  password,
}) => {
  const requirements = [
    { text: "At least 8 characters", met: password.length >= 8 },
    { text: "Contains uppercase letter", met: /[A-Z]/.test(password) },
    { text: "Contains lowercase letter", met: /[a-z]/.test(password) },
    { text: "Contains number", met: /\d/.test(password) },
    { text: "Contains special character", met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  if (!password) {
    return (
      <div className="text-sm text-gray-400 italic text-center py-4">
        Start typing your password to see requirements...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requirements.map((req, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className={`flex-shrink-0 ${req.met ? 'text-green-400' : 'text-gray-500'}`}>
            {req.met ? (
              <Check className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </div>
          <span className={`text-sm ${req.met ? 'text-green-400' : 'text-gray-400'}`}>
            {req.text}
          </span>
        </div>
      ))}
    </div>
  );
};