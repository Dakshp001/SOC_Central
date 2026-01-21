import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface FullScreenLoadingProps {
  message?: string;
  variant?: 'auth' | 'app';
}

const LoadingSpinner = React.memo(({ size = 'md', className = '' }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`animate-spin rounded-full border-b-2 border-primary ${sizeClasses[size]}`} />
    </div>
  );
});

const FullScreenLoading = React.memo(({ message = 'Loading...', variant = 'app' }: FullScreenLoadingProps) => {
  const bgClasses = variant === 'auth' 
    ? 'bg-gradient-to-br from-blue-900 via-slate-900 to-black'
    : 'bg-background';
  
  const textClasses = variant === 'auth'
    ? 'text-white'
    : 'text-foreground';

  const spinnerClasses = variant === 'auth'
    ? 'border-white'
    : 'border-primary';

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${bgClasses}`}>
      <div className={`text-center space-y-4 ${textClasses}`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${spinnerClasses} mx-auto`} />
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';
FullScreenLoading.displayName = 'FullScreenLoading';

export { LoadingSpinner, FullScreenLoading };