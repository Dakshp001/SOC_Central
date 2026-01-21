// src/components/auth/LoginForm.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Lock, Eye, EyeOff, Loader2, Shield } from "lucide-react";
import { ProductionAlert } from "./ProductionAlert";

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  onForgotPassword: () => void;
  onClearErrors?: (field: string) => void; // Optional prop for clearing external errors
  loading: boolean;
  errors: Record<string, string[]>;
  idPrefix?: string; // Add prefix to make IDs unique
}

interface LoginData {
  email: string;
  password: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  onForgotPassword,
  onClearErrors,
  loading,
  errors,
  idPrefix = "",
}) => {
  const [loginData, setLoginData] = useState<LoginData>({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [localErrors, setLocalErrors] = useState<Record<string, string[]>>({});

  // Combine external errors with local errors
  const allErrors = { ...localErrors, ...errors };

  const clearError = (field: string) => {
    setLocalErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
    // Also clear external errors if callback is provided
    if (onClearErrors) {
      onClearErrors(field);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any existing local errors
    setLocalErrors({});
    
    // Basic validation
    const newErrors: Record<string, string[]> = {};
    
    if (!loginData.email.trim()) {
      newErrors.email = ["Email is required"];
    } else if (!/\S+@\S+\.\S+/.test(loginData.email)) {
      newErrors.email = ["Please enter a valid email address"];
    }
    
    if (!loginData.password.trim()) {
      newErrors.password = ["Password is required"];
    } else if (loginData.password.length < 6) {
      newErrors.password = ["Password must be at least 6 characters"];
    }
    
    if (Object.keys(newErrors).length > 0) {
      setLocalErrors(newErrors);
      return;
    }
    
    await onSubmit(loginData.email, loginData.password);
  };

  const handleEmailChange = (value: string) => {
    setLoginData((prev) => ({ ...prev, email: value }));
    clearError("email");
    clearError("general");
  };

  const handlePasswordChange = (value: string) => {
    setLoginData((prev) => ({ ...prev, password: value }));
    clearError("password");
    clearError("general");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {allErrors.general && (
        <ProductionAlert
          type="error"
          title="Login Error"
          message={allErrors.general[0]}
        />
      )}

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}email`}>Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id={`${idPrefix}email`}
            type="email"
            placeholder="Enter your email"
            value={loginData.email}
            onChange={(e) => handleEmailChange(e.target.value)}
            className={`pl-10 h-11 ${allErrors.email ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20' : ''}`}
            required
            disabled={loading}
            autoComplete="email"
          />
        </div>
        {allErrors.email && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <Shield className="h-3 w-3" />
            {allErrors.email[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}password`}>Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id={`${idPrefix}password`}
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={loginData.password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            className={`pl-10 pr-12 h-11 ${allErrors.password ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20' : ''}`}
            required
            disabled={loading}
            autoComplete="current-password"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => setShowPassword(!showPassword)}
            disabled={loading}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        {allErrors.password && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <Shield className="h-3 w-3" />
            {allErrors.password[0]}
          </p>
        )}
      </div>

      {/* <div className="flex justify-end">
        <Button
          type="button"
          variant="link"
          className="p-0 h-auto text-sm"
          onClick={onForgotPassword}
          disabled={loading}
        >
          Forgot password?
        </Button>
      </div> */}

      <Button 
        type="submit" 
        className="w-full h-11" 
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            <span>Signing In...</span>
          </>
        ) : (
          <>
            <Lock className="mr-2 h-4 w-4" />
            <span>Sign In</span>
          </>
        )}
      </Button>
    </form>
  );
};