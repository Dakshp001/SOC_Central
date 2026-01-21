import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

type MfaVerificationFormProps = {
  userId: string;
  userEmail: string;
  onVerify: (code: string) => void | Promise<void>;
  onResend: () => void | Promise<void>;
  onBack: () => void;
  loading: boolean;
  errors: Record<string, string[]>;
  onClearErrors: (field: string) => void;
  initialCooldownSeconds?: number;
  forceEnableResend?: boolean;
};

export const MfaVerificationForm: React.FC<MfaVerificationFormProps> = ({
  userId,
  userEmail,
  onVerify,
  onResend,
  onBack,
  loading,
  errors,
  onClearErrors,
  initialCooldownSeconds = 120,
  forceEnableResend = false,
}) => {
  const [code, setCode] = useState("");
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(
    forceEnableResend ? 0 : initialCooldownSeconds
  );
  const inputsRef = useRef<Array<HTMLInputElement | null>>([null, null, null, null]);

  useEffect(() => {
    if (forceEnableResend) {
      setCooldownSeconds(0);
      return;
    }
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds, forceEnableResend]);

  const canResend = forceEnableResend || cooldownSeconds <= 0;

  const handleCodeChange = (value: string) => {
    // Only allow digits, limit to 6 just in case
    const sanitized = value.replace(/\D/g, "").slice(0, 6);
    setCode(sanitized);
    if (errors?.code?.length) onClearErrors("code");
    if (errors?.general?.length) onClearErrors("general");
  };

  const handleBoxChange = (idx: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    const chars = code.split("");
    const normalized = (value || "").slice(-1);
    if (chars.length < 4) {
      while (chars.length < 4) chars.push("");
    }
    chars[idx] = normalized;
    const next = chars.join("");
    handleCodeChange(next);

    if (normalized && idx < 3) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && idx > 0) inputsRef.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < 3) inputsRef.current[idx + 1]?.focus();

    // Submit on Enter key if code is complete
    if (e.key === "Enter" && code.length === 4 && !loading) {
      e.preventDefault();
      onVerify(code);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h2 className="text-xl font-semibold text-white">Two-Factor Authentication</h2>
        <p className="text-sm text-gray-300">
          We've sent a 4-digit verification code to your email
        </p>
        <p className="text-sm font-medium text-blue-300">{userEmail}</p>
      </div>

      {errors?.general && (
        <Alert className="bg-gray-800/50 border-gray-600">
          <AlertDescription className="text-gray-300">
            {errors.general[0]}
          </AlertDescription>
        </Alert>
      )}
      <div className="space-y-3">
        <label className="text-sm text-gray-300">Verification Code</label>
        <div className="flex items-center justify-center gap-3">
          {[0,1,2,3].map((idx) => (
            <Input
              key={idx}
              ref={(el) => (inputsRef.current[idx] = el)}
              value={code[idx] || ""}
              onChange={(e) => handleBoxChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              inputMode="numeric"
              maxLength={1}
              className="w-14 h-14 text-center text-xl bg-gray-900 text-white border-gray-700 focus-visible:ring-blue-500"
              disabled={loading}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Button
          className="w-full"
          onClick={() => onVerify(code)}
          disabled={loading || code.length < 4}
        >
          Verify Code
        </Button>

        {errors?.code && (
          <p className="text-sm text-red-400 text-center">{errors.code[0]}</p>
        )}

        <div className="flex items-center justify-between">
          <button
            className={`text-sm ${canResend ? "text-blue-400 hover:underline" : "text-gray-400"}`}
            onClick={() => canResend && onResend()}
            disabled={loading || !canResend}
          >
            {canResend ? "Resend" : `Resend in ${cooldownSeconds}s`}
          </button>
          <button
            className="text-sm text-gray-300 hover:underline"
            onClick={onBack}
            disabled={loading}
          >
            ← Back to Login
          </button>
        </div>
      </div>

      <div className="mt-2 rounded-md border border-gray-700 bg-gray-900/60 p-3 text-xs text-gray-300">
        <p className="leading-relaxed">
          Security Notice: This code expires in 10 minutes. Do not share this code with anyone.
        </p>
      </div>
    </div>
  );
};

export default MfaVerificationForm;