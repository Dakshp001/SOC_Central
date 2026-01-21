import React from 'react';
import { ScrollAnimatedSection } from './ScrollAnimatedSection';

interface StaggeredAnimationProps {
  children: React.ReactNode[];
  animation?: 'fadeIn' | 'slideUp' | 'slideLeft' | 'slideRight' | 'scaleIn' | 'slideDown';
  staggerDelay?: number;
  baseDelay?: number;
  duration?: number;
  className?: string;
  itemClassName?: string;
  threshold?: number;
}

export const StaggeredAnimation: React.FC<StaggeredAnimationProps> = ({
  children,
  animation = 'slideUp',
  staggerDelay = 100,
  baseDelay = 0,
  duration = 600,
  className = '',
  itemClassName = '',
  threshold = 0.1,
}) => {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <ScrollAnimatedSection
          key={index}
          animation={animation}
          delay={baseDelay + (index * staggerDelay)}
          duration={duration}
          className={itemClassName}
          threshold={threshold}
          triggerOnce={false}
        >
          {child}
        </ScrollAnimatedSection>
      ))}
    </div>
  );
};

export default StaggeredAnimation;