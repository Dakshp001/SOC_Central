import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Clock, 
  Mail, 
  Shield, 
  Info, 
  CheckCircle, 
  XCircle,
  Timer,
  Ban
} from 'lucide-react';

export interface ProductionAlertProps {
  type: 'rate_limit' | 'email_sent' | 'login_failed' | 'account_locked' | 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  details?: string;
  retryAfter?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const getAlertConfig = (type: ProductionAlertProps['type']) => {
  switch (type) {
    case 'rate_limit':
      return {
        variant: 'destructive' as const,
        icon: Ban,
        iconColor: 'text-red-500',
        bgColor: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
        titleColor: 'text-red-800 dark:text-red-300',
        messageColor: 'text-red-700 dark:text-red-400'
      };
    case 'email_sent':
      return {
        variant: 'default' as const,
        icon: Mail,
        iconColor: 'text-blue-500',
        bgColor: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
        titleColor: 'text-blue-800 dark:text-blue-300',
        messageColor: 'text-blue-700 dark:text-blue-400'
      };
    case 'login_failed':
      return {
        variant: 'destructive' as const,
        icon: XCircle,
        iconColor: 'text-red-500',
        bgColor: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
        titleColor: 'text-red-800 dark:text-red-300',
        messageColor: 'text-red-700 dark:text-red-400'
      };
    case 'account_locked':
      return {
        variant: 'destructive' as const,
        icon: Shield,
        iconColor: 'text-orange-500',
        bgColor: 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800',
        titleColor: 'text-orange-800 dark:text-orange-300',
        messageColor: 'text-orange-700 dark:text-orange-400'
      };
    case 'success':
      return {
        variant: 'default' as const,
        icon: CheckCircle,
        iconColor: 'text-green-500',
        bgColor: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
        titleColor: 'text-green-800 dark:text-green-300',
        messageColor: 'text-green-700 dark:text-green-400'
      };
    case 'error':
      return {
        variant: 'destructive' as const,
        icon: XCircle,
        iconColor: 'text-red-500',
        bgColor: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
        titleColor: 'text-red-800 dark:text-red-300',
        messageColor: 'text-red-700 dark:text-red-400'
      };
    case 'warning':
      return {
        variant: 'default' as const,
        icon: AlertTriangle,
        iconColor: 'text-yellow-500',
        bgColor: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
        titleColor: 'text-yellow-800 dark:text-yellow-300',
        messageColor: 'text-yellow-700 dark:text-yellow-400'
      };
    case 'info':
    default:
      return {
        variant: 'default' as const,
        icon: Info,
        iconColor: 'text-blue-500',
        bgColor: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
        titleColor: 'text-blue-800 dark:text-blue-300',
        messageColor: 'text-blue-700 dark:text-blue-400'
      };
  }
};

const formatRetryTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds} seconds`;
  if (seconds < 3600) return `${Math.ceil(seconds / 60)} minutes`;
  return `${Math.ceil(seconds / 3600)} hours`;
};

export const ProductionAlert: React.FC<ProductionAlertProps> = ({
  type,
  title,
  message,
  details,
  retryAfter,
  action,
  className = ''
}) => {
  const config = getAlertConfig(type);
  const IconComponent = config.icon;

  return (
    <Alert variant={config.variant} className={`${config.bgColor} ${className}`}>
      <div className="flex items-start gap-3">
        <IconComponent className={`h-5 w-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
        
        <div className="flex-1 space-y-2">
          {title && (
            <h4 className={`font-semibold text-sm ${config.titleColor}`}>
              {title}
            </h4>
          )}
          
          <AlertDescription className={`${config.messageColor} text-sm leading-relaxed`}>
            {message}
          </AlertDescription>
          
          {details && (
            <p className={`text-xs ${config.messageColor} opacity-80`}>
              {details}
            </p>
          )}
          
          {retryAfter && retryAfter > 0 && (
            <div className={`flex items-center gap-2 text-xs ${config.messageColor} opacity-90`}>
              <Timer className="h-3 w-3" />
              <span>You can try again in {formatRetryTime(retryAfter)}</span>
            </div>
          )}
          
          {action && (
            <div className="pt-2">
              <button
                onClick={action.onClick}
                className={`text-xs font-medium underline hover:no-underline ${config.titleColor}`}
              >
                {action.label}
              </button>
            </div>
          )}
        </div>
      </div>
    </Alert>
  );
};

// Specific alert components for common use cases
export const RateLimitAlert: React.FC<{ retryAfter: number; onContactSupport?: () => void }> = ({ 
  retryAfter, 
  onContactSupport 
}) => (
  <ProductionAlert
    type="rate_limit"
    title="Too Many Attempts"
    message="You've made too many requests. Please wait before trying again."
    details="This security measure protects against automated attacks. If you continue having issues, please contact support."
    retryAfter={retryAfter}
    action={onContactSupport ? {
      label: "Contact Support",
      onClick: onContactSupport
    } : undefined}
  />
);

export const EmailSentAlert: React.FC<{ email: string }> = ({ email }) => (
  <ProductionAlert
    type="email_sent"
    title="Email Sent Successfully"
    message={`We've sent instructions to ${email}`}
    details="Check your inbox and spam folder. The email may take a few minutes to arrive."
  />
);

export const LoginFailedAlert: React.FC<{ attemptsLeft: number }> = ({ attemptsLeft }) => (
  <ProductionAlert
    type="login_failed"
    title="Login Failed"
    message="Invalid email or password. Please check your credentials and try again."
    details={attemptsLeft > 0 ? `You have ${attemptsLeft} attempts remaining before your account is temporarily locked.` : undefined}
  />
);

export const AccountLockedAlert: React.FC<{ unlockTime: number }> = ({ unlockTime }) => (
  <ProductionAlert
    type="account_locked"
    title="Account Temporarily Locked"
    message="Your account has been temporarily locked due to multiple failed login attempts."
    details="This is a security measure to protect your account from unauthorized access attempts."
    retryAfter={unlockTime}
  />
);

export const NetworkErrorAlert: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <ProductionAlert
    type="error"
    title="Network Error"
    message="Unable to connect to the server. Please check your internet connection and try again."
    action={onRetry ? {
      label: "Retry",
      onClick: onRetry
    } : undefined}
  />
);