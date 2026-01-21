import React from 'react';
import { Check, X } from 'lucide-react';
import { 
  validatePassword, 
  getPasswordRequirements, 
  getPasswordStrengthColor,
  getPasswordStrengthBgColor,
  type PasswordValidationResult 
} from '@/utils/passwordValidation';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showRequirements = true
}) => {
  const validation = validatePassword(password);
  const requirements = getPasswordRequirements(password);

  if (!password) return null;

  return (
    <div className="space-y-3">
      {/* Strength Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Password Strength</span>
          <span className={`font-medium capitalize ${getPasswordStrengthColor(validation.strength)}`}>
            {validation.strength}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthBgColor(validation.strength)}`}
            style={{ width: `${(validation.strengthScore / 6) * 100}%` }}
          />
        </div>
      </div>

      {/* Requirements List */}
      {showRequirements && (
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-700">Requirements:</p>
          <div className="space-y-1">
            {requirements.map((req, index) => (
              <div key={index} className="flex items-center text-sm space-x-2">
                {req.met ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
                <span className={req.met ? 'text-green-700' : 'text-gray-600'}>
                  {req.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {validation.errors.length > 0 && (
        <div className="text-sm text-red-600 space-y-1">
          {validation.errors.map((error, index) => (
            <p key={index}>• {error}</p>
          ))}
        </div>
      )}
    </div>
  );
};