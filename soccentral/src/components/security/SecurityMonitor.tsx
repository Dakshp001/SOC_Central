// soccentral/src/components/security/SecurityMonitor.tsx
import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Lock,
  Eye,
  Activity,
} from "lucide-react";
import { useSecurity } from "@/contexts/SecurityContext";
import { useAuth } from "@/contexts/AuthContext";

interface SecurityMonitorProps {
  showInHeader?: boolean;
  compact?: boolean;
}

export const SecurityMonitor: React.FC<SecurityMonitorProps> = ({
  showInHeader = false,
  compact = false,
}) => {
  const {
    isSessionActive,
    lastActivity,
    sessionTimeoutMinutes,
    resetActivity,
    forceLogout,
  } = useSecurity();
  const { user } = useAuth();

  const [timeRemaining, setTimeRemaining] = useState(0);
  const [warningShown, setWarningShown] = useState(false);

  // Calculate time remaining
  useEffect(() => {
    if (!lastActivity || !isSessionActive) return;

    const updateTimeRemaining = () => {
      const now = new Date();
      const timeDiff = now.getTime() - lastActivity.getTime();
      const minutesPassed = timeDiff / (1000 * 60);
      const remaining = Math.max(0, sessionTimeoutMinutes - minutesPassed);

      setTimeRemaining(remaining);

      // Show warning when less than 30 seconds remain
      if (remaining < 0.5 && remaining > 0 && !warningShown) {
        setWarningShown(true);
        // Could show a warning modal here
      }

      if (remaining <= 0) {
        setWarningShown(false);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [lastActivity, sessionTimeoutMinutes, isSessionActive, warningShown]);

  const getSecurityStatus = () => {
    if (!isSessionActive)
      return { status: "inactive", color: "destructive", icon: AlertTriangle };
    if (timeRemaining < 0.5)
      return { status: "warning", color: "warning", icon: AlertTriangle };
    if (timeRemaining < 1)
      return { status: "caution", color: "secondary", icon: Clock };
    return { status: "active", color: "success", icon: CheckCircle };
  };

  const formatTimeRemaining = (minutes: number) => {
    if (minutes < 1) {
      return `${Math.floor(minutes * 60)}s`;
    }
    return `${Math.floor(minutes)}m ${Math.floor((minutes % 1) * 60)}s`;
  };

  const getProgressValue = () => {
    return (timeRemaining / sessionTimeoutMinutes) * 100;
  };

  const securityStatus = getSecurityStatus();
  const StatusIcon = securityStatus.icon;

  if (showInHeader) {
    return (
      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className={`text-xs px-2 py-1 ${
            securityStatus.status === "active"
              ? "bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800"
              : securityStatus.status === "warning"
              ? "bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
              : securityStatus.status === "caution"
              ? "bg-yellow-50 dark:bg-yellow-950/50 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800"
              : "bg-gray-50 dark:bg-gray-950/50 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800"
          }`}
          title={`Session expires in ${formatTimeRemaining(timeRemaining)}`}
        >
          <StatusIcon className="h-3 w-3 mr-1" />
          {formatTimeRemaining(timeRemaining)}
        </Badge>
      </div>
    );
  }

  if (compact) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Security Status</span>
            </div>
            <Badge variant={securityStatus.color as any}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {securityStatus.status.charAt(0).toUpperCase() +
                securityStatus.status.slice(1)}
            </Badge>
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Session Timeout</span>
              <span>{formatTimeRemaining(timeRemaining)}</span>
            </div>
            <Progress
              value={getProgressValue()}
              className={`h-2 ${
                securityStatus.status === "warning"
                  ? "bg-red-100 dark:bg-red-950"
                  : securityStatus.status === "caution"
                  ? "bg-yellow-100 dark:bg-yellow-950"
                  : "bg-green-100 dark:bg-green-950"
              }`}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Session Status */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                securityStatus.status === "active"
                  ? "bg-green-100 dark:bg-green-900/50"
                  : securityStatus.status === "warning"
                  ? "bg-red-100 dark:bg-red-900/50"
                  : securityStatus.status === "caution"
                  ? "bg-yellow-100 dark:bg-yellow-900/50"
                  : "bg-gray-100 dark:bg-gray-900/50"
              }`}
            >
              <StatusIcon
                className={`h-4 w-4 ${
                  securityStatus.status === "active"
                    ? "text-green-600 dark:text-green-400"
                    : securityStatus.status === "warning"
                    ? "text-red-600 dark:text-red-400"
                    : securityStatus.status === "caution"
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              />
            </div>
            <div>
              <p className="font-medium">Session Status</p>
              <p className="text-sm text-muted-foreground">
                {securityStatus.status.charAt(0).toUpperCase() +
                  securityStatus.status.slice(1)}
              </p>
            </div>
          </div>
          <Badge variant={securityStatus.color as any}>
            {formatTimeRemaining(timeRemaining)} remaining
          </Badge>
        </div>

        {/* Session Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Session Timeout Progress</span>
            <span className="text-muted-foreground">
              {Math.floor(getProgressValue())}%
            </span>
          </div>
          <Progress
            value={getProgressValue()}
            className={`h-3 ${
              securityStatus.status === "warning"
                ? "bg-red-100 dark:bg-red-950"
                : securityStatus.status === "caution"
                ? "bg-yellow-100 dark:bg-yellow-950"
                : "bg-green-100 dark:bg-green-950"
            }`}
          />
          <p className="text-xs text-muted-foreground">
            Session will expire in {formatTimeRemaining(timeRemaining)} without
            activity
          </p>
        </div>

        {/* Security Info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Timeout:</span>
            <span className="font-medium">{sessionTimeoutMinutes}m</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Last Activity:</span>
            <span className="font-medium">
              {lastActivity ? lastActivity.toLocaleTimeString() : "Never"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">User:</span>
            <span className="font-medium">{user?.email || "Unknown"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Role:</span>
            <span className="font-medium">{user?.role || "Unknown"}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={resetActivity}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Extend Session
          </Button>
          <Button
            onClick={() => forceLogout("Manual logout requested")}
            size="sm"
            variant="destructive"
            className="flex-1"
          >
            <Lock className="h-3 w-3 mr-1" />
            Secure Logout
          </Button>
        </div>

        {/* Warning */}
        {timeRemaining < 0.5 && timeRemaining > 0 && (
          <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                Session Expiring Soon!
              </p>
            </div>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              Your session will expire in {formatTimeRemaining(timeRemaining)}.
              Click "Extend Session" to continue working.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
