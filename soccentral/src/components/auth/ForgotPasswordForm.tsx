// src/components/auth/ForgotPasswordForm.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Loader2, ArrowLeft, CheckCircle, Shield } from "lucide-react";
import { ProductionAlert, RateLimitAlert, NetworkErrorAlert, EmailSentAlert } from "./ProductionAlert";

interface ForgotPasswordFormProps {
  onSubmit: (email: string) => Promise<void>;
  onBack: () => void;
  loading: boolean;
  errors?: Record<string, string[]>;
}

interface OtpVerificationFormProps {
  email: string;
  onSubmit: (otp: string) => Promise<void>;
  onBack: () => void;
  onResend: () => Promise<void>;
  loading: boolean;
  errors?: Record<string, string[]>;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onSubmit,
  onBack,
  loading,
  errors = {},
}) => {
  const [email, setEmail] = useState("");
  const [localErrors, setLocalErrors] = useState<Record<string, string[]>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Combine external errors with local errors
  const allErrors = { ...localErrors, ...errors };

  const clearError = (field: string) => {
    setLocalErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any existing local errors
    setLocalErrors({});
    setIsSubmitted(false);
    
    // Basic validation
    const newErrors: Record<string, string[]> = {};
    
    if (!email.trim()) {
      newErrors.email = ["Email is required"];
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = ["Please enter a valid email address"];
    }
    
    if (Object.keys(newErrors).length > 0) {
      setLocalErrors(newErrors);
      return;
    }
    
    try {
      await onSubmit(email);
      // Only set submitted to true if there are no error messages from parent
      if (!allErrors.rate_limit && !allErrors.network && !allErrors.general) {
        setIsSubmitted(true);
      }
    } catch (error) {
      // Error handling is done in the parent component
      console.error("Password reset error:", error);
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    clearError("email");
    clearError("general");
    setIsSubmitted(false);
  };

  const handleBackClick = () => {
    setEmail("");
    setLocalErrors({});
    setIsSubmitted(false);
    onBack();
  };

  // Success state after submission - only show if there are success errors and no other errors
  if (isSubmitted && allErrors.success && !allErrors.rate_limit && !allErrors.network && !allErrors.general) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Check Your Email
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            We've sent password reset instructions to{" "}
            <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>

        <Alert>
          <Mail className="h-4 w-4" />
          <AlertDescription>
            <strong>Didn't receive the email?</strong> Check your spam folder or try again with a different email address. The reset link will expire in 1 hour for security.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsSubmitted(false)}
            className="w-full"
          >
            Try Another Email
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={handleBackClick}
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Production-level error alerts */}
      {allErrors.rate_limit && (
        <RateLimitAlert 
          retryAfter={parseInt(allErrors.retry_after?.[0] || '3600')} 
        />
      )}
      
      {allErrors.network && (
        <NetworkErrorAlert 
          onRetry={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
        />
      )}
      
      {allErrors.success && (
        <EmailSentAlert 
          email={email}
        />
      )}
      
      {allErrors.general && (
        <ProductionAlert
          type="error"
          title="Error"
          message={allErrors.general[0]}
        />
      )}

      <div className="space-y-2">
        <Label htmlFor="forgot_email">Email Address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="forgot_email"
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            className={`pl-10 h-11 ${allErrors.email ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20' : ''}`}
            required
            disabled={loading}
            autoComplete="email"
            autoFocus
          />
        </div>
        {allErrors.email && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <Shield className="h-3 w-3" />
            {allErrors.email[0]}
          </p>
        )}
      </div>

        {/* <Alert>
          <AlertDescription>
            We'll send password reset instructions to your email if an account exists. 
            The reset link will expire in 1 hour for security.
          </AlertDescription>
        </Alert> */}

      <div className="space-y-3">
        <Button 
          type="submit" 
          className="w-full h-11" 
          disabled={loading || !email.trim()}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <span>Sending Reset Link...</span>
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              <span>Send Reset Instructions</span>
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={handleBackClick}
          className="w-full h-11"
          disabled={loading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Sign In
        </Button>
      </div>
    </form>
  );
};

export const OtpVerificationForm: React.FC<OtpVerificationFormProps> = ({
  email,
  onSubmit,
  onBack,
  onResend,
  loading,
  errors = {},
}) => {
  const [otp, setOtp] = useState("");
  const [localErrors, setLocalErrors] = useState<Record<string, string[]>>({});

  // Combine external errors with local errors
  const allErrors = { ...localErrors, ...errors };

  const clearError = (field: string) => {
    setLocalErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any existing local errors
    setLocalErrors({});
    
    // Basic validation
    const newErrors: Record<string, string[]> = {};
    
    if (!otp.trim()) {
      newErrors.otp = ["Verification code is required"];
    } else if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      newErrors.otp = ["Please enter a valid 6-digit verification code"];
    }
    
    if (Object.keys(newErrors).length > 0) {
      setLocalErrors(newErrors);
      return;
    }
    
    try {
      await onSubmit(otp);
    } catch (error) {
      console.error("OTP verification error:", error);
    }
  };

  const handleOtpChange = (value: string) => {
    // Only allow numbers and limit to 6 digits
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setOtp(numericValue);
    clearError("otp");
    clearError("general");
  };

  const handleBackClick = () => {
    setOtp("");
    setLocalErrors({});
    onBack();
  };

  const handleResend = async () => {
    try {
      await onResend();
    } catch (error) {
      console.error("Resend OTP error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Production-level error alerts */}
      {allErrors.rate_limit && (
        <RateLimitAlert 
          retryAfter={parseInt(allErrors.retry_after?.[0] || '3600')} 
        />
      )}
      
      {allErrors.network && (
        <NetworkErrorAlert 
          onRetry={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
        />
      )}
      
      {allErrors.general && (
        <ProductionAlert
          type="error"
          title="Error"
          message={allErrors.general[0]}
        />
      )}

      <div className="text-center mb-6">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Check Your Email
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          We've sent a 6-digit verification code to{" "}
          <span className="font-medium text-foreground">{email}</span>
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="otp_code">Verification Code</Label>
        <Input
          id="otp_code"
          type="text"
          placeholder="Enter 6-digit code"
          value={otp}
          onChange={(e) => handleOtpChange(e.target.value)}
          className={`text-center text-lg font-mono tracking-widest h-14 ${
            allErrors.otp ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20' : ''
          }`}
          required
          disabled={loading}
          autoComplete="one-time-code"
          autoFocus
          maxLength={6}
        />
        {allErrors.otp && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <Shield className="h-3 w-3" />
            {allErrors.otp[0]}
          </p>
        )}
      </div>

      <Alert>
        <Mail className="h-4 w-4" />
        <AlertDescription>
          <strong>Didn't receive the code?</strong> Check your spam folder or click resend below. The code expires in 10 minutes for security.
        </AlertDescription>
      </Alert>

      <div className="space-y-3">
        <Button 
          type="submit" 
          className="w-full h-11" 
          disabled={loading || otp.length !== 6}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              <span>Verify Code</span>
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleResend}
          className="w-full h-11"
          disabled={loading}
        >
          <Mail className="mr-2 h-4 w-4" />
          Resend Code
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={handleBackClick}
          className="w-full h-11"
          disabled={loading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Email Entry
        </Button>
      </div>
    </form>
  );
};