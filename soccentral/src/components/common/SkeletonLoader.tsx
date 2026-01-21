import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  count?: number;
}

/**
 * Skeleton - Loading placeholder component
 * Provides instant visual feedback while content loads
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
  width,
  height,
  count = 1,
}) => {
  const baseStyles = 'animate-pulse bg-muted';

  const variantStyles = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
    card: 'rounded-lg',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  if (count === 1) {
    return (
      <div
        className={cn(baseStyles, variantStyles[variant], className)}
        style={style}
      />
    );
  }

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(baseStyles, variantStyles[variant], className)}
          style={style}
        />
      ))}
    </>
  );
};

/**
 * DashboardSkeleton - Loading skeleton for dashboard pages
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton variant="text" width="30%" height={32} />
        <Skeleton variant="text" width="50%" height={20} />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" height={36} />
            <Skeleton variant="text" width="80%" />
          </div>
        ))}
      </div>

      {/* Chart Skeleton */}
      <div className="border rounded-lg p-6 space-y-4">
        <Skeleton variant="text" width="40%" height={24} />
        <Skeleton variant="rectangular" width="100%" height={300} />
      </div>

      {/* Table Skeleton */}
      <div className="border rounded-lg overflow-hidden">
        <div className="p-4 border-b">
          <Skeleton variant="text" width="30%" height={24} />
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton variant="circular" width={40} height={40} />
              <div className="flex-1 space-y-2">
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="40%" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * TableSkeleton - Loading skeleton for tables
 */
export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton variant="rectangular" width={30} height={30} />
          <Skeleton variant="text" className="flex-1" />
          <Skeleton variant="text" width={100} />
          <Skeleton variant="text" width={80} />
        </div>
      ))}
    </div>
  );
};

/**
 * ChartSkeleton - Loading skeleton for charts
 */
export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 300 }) => {
  return (
    <div className="space-y-4">
      <Skeleton variant="text" width="40%" height={24} />
      <Skeleton variant="rectangular" width="100%" height={height} />
      <div className="flex justify-center gap-4">
        <Skeleton variant="text" width={80} />
        <Skeleton variant="text" width={80} />
        <Skeleton variant="text" width={80} />
      </div>
    </div>
  );
};

/**
 * CardSkeleton - Loading skeleton for card components
 */
export const CardSkeleton: React.FC = () => {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
      <Skeleton variant="rectangular" width="100%" height={100} />
      <div className="space-y-2">
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="80%" />
      </div>
    </div>
  );
};

/**
 * FormSkeleton - Loading skeleton for forms
 */
export const FormSkeleton: React.FC<{ fields?: number }> = ({ fields = 4 }) => {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton variant="text" width={100} height={20} />
          <Skeleton variant="rectangular" width="100%" height={40} />
        </div>
      ))}
      <Skeleton variant="rectangular" width={120} height={40} />
    </div>
  );
};

/**
 * Example usage:
 *
 * // Simple skeleton
 * <Skeleton variant="text" width="80%" height={20} />
 *
 * // Multiple skeletons
 * <Skeleton variant="text" count={3} className="mb-2" />
 *
 * // Dashboard loading
 * {isLoading ? <DashboardSkeleton /> : <Dashboard data={data} />}
 *
 * // Table loading
 * {isLoading ? <TableSkeleton rows={10} /> : <Table data={data} />}
 */
