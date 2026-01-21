// src/components/AdminSetup.tsx - UPDATED WITH REQUEST FUNCTIONALITY
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, CheckCircle, AlertTriangle, UserPlus, Mail, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const AdminSetup: React.FC = () => {
  const { user, canWrite, canManageUsers, requestAdminAccess } = useAuth();
  const [requesting, setRequesting] = useState(false);
  const [justification, setJustification] = useState('');
  const [requestSent, setRequestSent] = useState(false);

  // Check if user has admin privileges
  const hasAdminAccess = canWrite() || canManageUsers();

  const handleRequestAccess = async () => {
    setRequesting(true);
    try {
      const response = await requestAdminAccess(justification);
      
      if (response.success) {
        setRequestSent(true);
        setJustification('');
        toast({
          title: "Request Sent Successfully! 📧",
          description: "Your admin access request has been sent to all super administrators.",
        });
      } else {
        toast({
          title: "Request Failed",
          description: response.message || "Failed to send admin access request",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error requesting admin access:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while sending your request",
        variant: "destructive",
      });
    } finally {
      setRequesting(false);
    }
  };

  if (hasAdminAccess) {
    return (
      <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800 dark:text-green-200">
          ✅ Admin access verified. You have access to administrative features.
          {canManageUsers() && " You can manage users and system settings."}
        </AlertDescription>
      </Alert>
    );
  }

  if (requestSent) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <Mail className="h-5 w-5" />
            Request Sent Successfully
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Your admin access request has been sent to all super administrators.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium">What happens next:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Super administrators will review your request</li>
              <li>• You'll receive an email notification with the decision</li>
              <li>• If approved, your account will be upgraded automatically</li>
              <li>• You can submit a new request in 24 hours if needed</li>
            </ul>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Request submitted for: <strong>{user?.email}</strong></span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Request Admin Access
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You need admin privileges to access administrative features. 
            Submit a request below to notify your system administrators.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Logged in as: <strong>{user?.email}</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            Current Role: <strong className="capitalize">{user?.role.replace('_', ' ')}</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            Company: <strong>{user?.company_name}</strong>
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Your Current Permissions:</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• {user?.is_email_verified ? '✅' : '❌'} Email Verified</li>
            <li>• {user?.is_active ? '✅' : '❌'} Account Active</li>
            <li>• {canWrite() ? '✅' : '❌'} Admin Access</li>
            <li>• {canManageUsers() ? '✅' : '❌'} User Management</li>
          </ul>
        </div>

        <div className="space-y-2">
          <Label htmlFor="justification">Justification (Optional)</Label>
          <Textarea
            id="justification"
            placeholder="Please explain why you need admin access (e.g., job responsibilities, project requirements, etc.)"
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            className="min-h-[100px]"
            maxLength={500}
            disabled={requesting}
          />
          <p className="text-xs text-muted-foreground">
            {justification.length}/500 characters
          </p>
        </div>
        
        <Button 
          onClick={handleRequestAccess}
          disabled={requesting}
          className="w-full"
        >
          {requesting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Sending Request...
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4 mr-2" />
              Request Admin Access
            </>
          )}
        </Button>
        
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground text-center">
            This will notify all super administrators about your access request.
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> You can only submit one request per 24 hours. 
              Administrators will review your request and respond via email.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};