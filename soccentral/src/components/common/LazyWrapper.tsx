// soccentral/src/components/common/LazyWrapper.tsx
import React, { Suspense, lazy, ComponentType } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { LazyComponent } from '../animations/ScrollAnimations';

interface LazyWrapperProps {
  children?: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  threshold?: number;
  minHeight?: string;
}

// Enhanced lazy wrapper with intersection observer
export const LazyWrapper: React.FC<LazyWrapperProps> = ({ 
  children, 
  fallback = <LoadingSpinner size="lg" />, 
  className = '',
  threshold = 0.05,
  minHeight = '200px'
}) => {
  const placeholder = (
    <div className={`flex items-center justify-center ${className}`} style={{ minHeight }}>
      {fallback}
    </div>
  );

  return (
    <LazyComponent
      className={className}
      placeholder={placeholder}
      threshold={threshold}
    >
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </LazyComponent>
  );
};

// Higher-order component for lazy loading
export const withLazyLoading = <P extends object>(
  WrappedComponent: ComponentType<P>,
  fallback: React.ReactNode = <LoadingSpinner size="lg" />,
  threshold: number = 0.05
) => {
  const LazyLoadedComponent: React.FC<P & { className?: string }> = ({ className, ...props }) => (
    <LazyWrapper 
      fallback={fallback} 
      className={className}
      threshold={threshold}
    >
      <WrappedComponent {...(props as P)} />
    </LazyWrapper>
  );

  LazyLoadedComponent.displayName = `LazyLoaded(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return LazyLoadedComponent;
};

// Lazy load utility for dynamic imports
export const createLazyComponent = (importFunc: () => Promise<{ default: ComponentType<any> }>) => {
  const LazyComponent = lazy(importFunc);
  
  return (props: any) => (
    <Suspense fallback={<LoadingSpinner size="lg" className="min-h-[200px]" />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};