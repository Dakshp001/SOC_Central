import React, { memo } from 'react';
import { FixedSizeList as List } from 'react-window';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  width?: string | number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  overscanCount?: number;
  className?: string;
}

/**
 * VirtualizedList - Efficiently render large lists using react-window
 * Only renders items that are visible in the viewport
 * Dramatically improves performance for large datasets
 */
function VirtualizedListComponent<T>({
  items,
  itemHeight,
  height,
  width = '100%',
  renderItem,
  overscanCount = 5,
  className = '',
}: VirtualizedListProps<T>) {
  if (!items || items.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground"
        style={{ height }}
      >
        No items to display
      </div>
    );
  }

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = items[index];
    return <div style={style}>{renderItem(item, index, style)}</div>;
  };

  return (
    <div className={className}>
      <List
        height={height}
        itemCount={items.length}
        itemSize={itemHeight}
        width={width}
        overscanCount={overscanCount}
      >
        {Row}
      </List>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const VirtualizedList = memo(VirtualizedListComponent) as typeof VirtualizedListComponent;

/**
 * Example usage:
 *
 * <VirtualizedList
 *   items={data}
 *   itemHeight={60}
 *   height={600}
 *   renderItem={(item, index, style) => (
 *     <div key={index} className="p-4 border-b">
 *       {item.name}
 *     </div>
 *   )}
 * />
 */
