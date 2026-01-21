import React from 'react';
import { Check, X, AlertCircle, Shield } from 'lucide-react';
import { validatePassword, getPasswordRequirements } from '@/utils/passwordValidation';

interface PasswordChecklistProps {
  password: string;
  showTitle?: boolean;
  compact?: boolean;
}

interface ChecklistItemProps {
  text: string;
  met: boolean;
  icon?: React.ReactNode;
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({ text, met, icon }) => {
  return (
    <div className={`flex items-center gap-3 py-2 px-3 rounded-lg transition-all duration-300 ${
      met 
        ? 'bg-green-50 dark:bg-green-900/20 border-l-2 border-green-500' 
        : 'bg-gray-50 dark:bg-gray-800/50 border-l-2 border-gray-300 dark:border-gray-600'
    }`}>
      <div className={`flex-shrink-0 transition-all duration-300 ${
        met 
          ? 'text-green-600 dark:text-green-400' 
          : 'text-gray-400 dark:text-gray-500'
      }`}>
        {met ? (
          <div className="p-1 rounded-full bg-green-100 dark:bg-green-800">
            <Check className="h-3 w-3" />
          </div>
        ) : (
          <div className="p-1 rounded-full bg-gray-100 dark:bg-gray-700">
            <X className="h-3 w-3" />
          </div>
        )}
      </div>
      <span className={`text-sm font-medium transition-colors duration-300 ${
        met 
          ? 'text-green-700 dark:text-green-300' 
          : 'text-gray-600 dark:text-gray-400'
      }`}>
        {text}
      </span>
    </div>
  );
};

const StrengthMeter: React.FC<{ strength: 'weak' | 'medium' | 'strong'; score: number }> = ({ 
  strength, 
  score 
}) => {
  const getStrengthColor = () => {
    switch (strength) {
      case 'weak':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'strong':
        return 'bg-green-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getStrengthText = () => {
    switch (strength) {
      case 'weak':
        return 'Weak Password';
      case 'medium':
        return 'Medium Strength';
      case 'strong':
        return 'Strong Password';
      default:
        return 'Password Strength';
    }
  };

  const getStrengthIcon = () => {
    switch (strength) {
      case 'weak':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'strong':
        return <Shield className="h-4 w-4 text-green-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStrengthIcon()}
          <span className={`text-sm font-semibold ${
            strength === 'strong' ? 'text-green-600 dark:text-green-400' :
            strength === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
            'text-red-600 dark:text-red-400'
          }`}>
            {getStrengthText()}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {score}/6 criteria met
        </span>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ease-out ${getStrengthColor()}`}
          style={{ width: `${(score / 6) * 100}%` }}
        >
          <div className="h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
        </div>
      </div>

      {/* Strength Indicators */}
      <div className="flex justify-between text-xs">
        <span className={`${score >= 0 ? 'text-red-500' : 'text-gray-400'}`}>Weak</span>
        <span className={`${score >= 3 ? 'text-yellow-500' : 'text-gray-400'}`}>Medium</span>
        <span className={`${score >= 5 ? 'text-green-500' : 'text-gray-400'}`}>Strong</span>
      </div>
    </div>
  );
};

export const PasswordChecklist: React.FC<PasswordChecklistProps> = ({ 
  password, 
  showTitle = true, 
  compact = false 
}) => {
  const validation = validatePassword(password);
  const requirements = getPasswordRequirements(password);

  // Don't show checklist if no password entered
  if (!password) {
    return (
      <div className="space-y-4">
        {showTitle && (
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-500" />
            Password Requirements
          </h3>
        )}
        <div className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-4">
          Start typing your password to see requirements...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showTitle && (
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-500" />
          Password Strength
        </h3>
      )}

      {/* Strength Meter */}
      <StrengthMeter strength={validation.strength} score={validation.strengthScore} />

      {/* Requirements Checklist */}
      <div className="space-y-2">
        {!compact && (
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Security Requirements:
          </h4>
        )}
        
        {requirements.map((requirement, index) => (
          <ChecklistItem
            key={index}
            text={requirement.text}
            met={requirement.met}
          />
        ))}
      </div>

      {/* Security Tips */}
      {!compact && validation.strength !== 'strong' && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                💡 Password Tips:
              </h5>
              <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                <li>• Mix uppercase and lowercase letters</li>
                <li>• Include numbers and special characters (!@#$%^&*)</li>
                <li>• Make it at least 8 characters long</li>
                <li>• Avoid common words or personal information</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {validation.isValid && validation.strength === 'strong' && (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <div className="p-1 rounded-full bg-green-100 dark:bg-green-800">
              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-300">
                🎉 Excellent! Your password is strong and secure.
              </p>
              <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                This password meets all security requirements.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};