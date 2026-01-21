// frontend/src/components/admin/SecurityNotice.tsx
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export const SecurityNotice: React.FC = () => {
  return (
    <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-yellow-800 dark:text-yellow-200">
        <strong>Security Notice:</strong> User deletion is permanent and cannot be undone. 
        Super Admin accounts cannot be deleted for security reasons. 
        You cannot delete your own account while logged in.
      </AlertDescription>
    </Alert>
  );
};