// soccentral/src/components/animations/ScrollAnimations.tsx
import React, { forwardRef, ReactNode } from 'react';
import { motion, Variants, useSpring, useTransform, useScroll } from 'framer-motion';
import { useEnhancedScrollAnimation, useStaggeredAnimation, useLazyLoad } from '@/hooks/useScrollAnimation';

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  duration?: number;
  triggerOnce?: boolean;
}

// Main animated section component
export const AnimatedSection = forwardRef<HTMLDivElement, AnimatedSectionProps>(
  ({ children, className = '', delay = 0, direction = 'up', distance = 30, duration = 0.5, triggerOnce = true }, ref) => {
    const { ref: animationRef, shouldAnimate } = useEnhancedScrollAnimation({
      delay,
      triggerOnce,
      threshold: 0.15, // Trigger earlier for smoother experience
      rootMargin: '0px 0px -5% 0px' // Reduce margin for earlier triggering
    });

    const getInitialPosition = () => {
      switch (direction) {
        case 'up': return { y: distance, opacity: 0 };
        case 'down': return { y: -distance, opacity: 0 };
        case 'left': return { x: distance, opacity: 0 };
        case 'right': return { x: -distance, opacity: 0 };
        default: return { y: distance, opacity: 0 };
      }
    };

    return (
      <motion.div
        ref={ref || animationRef}
        className={className}
        initial={getInitialPosition()}
        animate={shouldAnimate ? { x: 0, y: 0, opacity: 1 } : getInitialPosition()}
        transition={{
          duration,
          ease: [0.23, 1, 0.32, 1], // Smoother easing curve
          delay: 0 // Delay is handled by the hook
        }}
        style={{
          willChange: shouldAnimate ? 'transform, opacity' : 'auto'
        }}
      >
        {children}
      </motion.div>
    );
  }
);

AnimatedSection.displayName = 'AnimatedSection';

// Fade in animation component
export const FadeIn: React.FC<AnimatedSectionProps> = ({ 
  children, 
  className = '', 
  delay = 0, 
  duration = 0.4,
  triggerOnce = true 
}) => {
  const { ref, shouldAnimate } = useEnhancedScrollAnimation({
    delay,
    triggerOnce,
    threshold: 0.2,
    rootMargin: '0px 0px -2% 0px'
  });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0 }}
      animate={shouldAnimate ? { opacity: 1 } : { opacity: 0 }}
      transition={{
        duration,
        ease: [0.23, 1, 0.32, 1]
      }}
      style={{
        willChange: shouldAnimate ? 'opacity' : 'auto'
      }}
    >
      {children}
    </motion.div>
  );
};

// Slide up animation component
export const SlideUp: React.FC<AnimatedSectionProps> = ({ 
  children, 
  className = '', 
  delay = 0, 
  distance = 50, 
  duration = 0.6,
  triggerOnce = true 
}) => {
  const { ref, shouldAnimate } = useEnhancedScrollAnimation({
    delay,
    triggerOnce
  });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ y: distance, opacity: 0 }}
      animate={shouldAnimate ? { y: 0, opacity: 1 } : { y: distance, opacity: 0 }}
      transition={{
        duration,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
    >
      {children}
    </motion.div>
  );
};

// Scale in animation component
export const ScaleIn: React.FC<AnimatedSectionProps> = ({ 
  children, 
  className = '', 
  delay = 0, 
  duration = 0.5,
  triggerOnce = true 
}) => {
  const { ref, shouldAnimate } = useEnhancedScrollAnimation({
    delay,
    triggerOnce
  });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={shouldAnimate ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
      transition={{
        duration,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
    >
      {children}
    </motion.div>
  );
};

// Staggered list animation
interface StaggeredListProps {
  children: ReactNode[];
  className?: string;
  staggerDelay?: number;
  itemClassName?: string;
}

export const StaggeredList: React.FC<StaggeredListProps> = ({ 
  children, 
  className = '', 
  staggerDelay = 80,
  itemClassName = ''
}) => {
  const { ref, visibleItems } = useStaggeredAnimation(children.length, staggerDelay);

  return (
    <div ref={ref} className={className}>
      {children.map((child, index) => (
        <motion.div
          key={index}
          className={itemClassName}
          initial={{ y: 20, opacity: 0 }}
          animate={visibleItems.includes(index) ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
          transition={{
            duration: 0.4,
            ease: [0.23, 1, 0.32, 1],
            delay: 0 // Delay handled by visibleItems timing
          }}
          style={{
            willChange: visibleItems.includes(index) ? 'transform, opacity' : 'auto'
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
};

// Lazy loaded component
interface LazyComponentProps {
  children: ReactNode;
  className?: string;
  placeholder?: ReactNode;
  threshold?: number;
}

export const LazyComponent: React.FC<LazyComponentProps> = ({ 
  children, 
  className = '', 
  placeholder = null,
  threshold = 0.1 
}) => {
  const { ref, isLoaded } = useLazyLoad(threshold);

  return (
    <div ref={ref} className={className}>
      {isLoaded ? children : placeholder}
    </div>
  );
};

// Card hover animation component
interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  hoverScale?: number;
  hoverY?: number;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({ 
  children, 
  className = '', 
  hoverScale = 1.015, 
  hoverY = -3 
}) => {
  return (
    <motion.div
      className={className}
      whileHover={{ 
        scale: hoverScale, 
        y: hoverY,
        transition: { 
          duration: 0.15,
          ease: [0.23, 1, 0.32, 1]
        }
      }}
      whileTap={{ 
        scale: 0.99,
        transition: { duration: 0.1 }
      }}
      style={{
        transformOrigin: 'center'
      }}
    >
      {children}
    </motion.div>
  );
};

// Reveal animation variants for complex animations
export const revealVariants: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

// Optimized fade from left animation component
export const FadeFromLeft: React.FC<AnimatedSectionProps> = ({ 
  children, 
  className = '', 
  delay = 0, 
  distance = 30, 
  duration = 0.6,
  triggerOnce = true 
}) => {
  const { ref, shouldAnimate } = useEnhancedScrollAnimation({
    delay,
    triggerOnce,
    threshold: 0.15,
    rootMargin: '0px 0px -5% 0px'
  });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ 
        x: -distance, 
        opacity: 0,
        transform: `translate3d(-${distance}px, 0, 0)` 
      }}
      animate={shouldAnimate ? { 
        x: 0, 
        opacity: 1,
        transform: 'translate3d(0, 0, 0)' 
      } : { 
        x: -distance, 
        opacity: 0,
        transform: `translate3d(-${distance}px, 0, 0)` 
      }}
      transition={{
        duration,
        ease: [0.25, 0.46, 0.45, 0.94], // Optimized easing
        delay: 0
      }}
      style={{
        willChange: shouldAnimate ? 'transform, opacity' : 'auto',
        backfaceVisibility: 'hidden',
        transform: shouldAnimate ? 'translate3d(0, 0, 0)' : `translate3d(-${distance}px, 0, 0)`
      }}
    >
      {children}
    </motion.div>
  );
};

// Optimized fade from right animation component  
export const FadeFromRight: React.FC<AnimatedSectionProps> = ({ 
  children, 
  className = '', 
  delay = 0, 
  distance = 30, 
  duration = 0.6,
  triggerOnce = true 
}) => {
  const { ref, shouldAnimate } = useEnhancedScrollAnimation({
    delay,
    triggerOnce,
    threshold: 0.15,
    rootMargin: '0px 0px -5% 0px'
  });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ 
        x: distance, 
        opacity: 0,
        transform: `translate3d(${distance}px, 0, 0)` 
      }}
      animate={shouldAnimate ? { 
        x: 0, 
        opacity: 1,
        transform: 'translate3d(0, 0, 0)' 
      } : { 
        x: distance, 
        opacity: 0,
        transform: `translate3d(${distance}px, 0, 0)` 
      }}
      transition={{
        duration,
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: 0
      }}
      style={{
        willChange: shouldAnimate ? 'transform, opacity' : 'auto',
        backfaceVisibility: 'hidden',
        transform: shouldAnimate ? 'translate3d(0, 0, 0)' : `translate3d(${distance}px, 0, 0)`
      }}
    >
      {children}
    </motion.div>
  );
};

// Optimized smooth scale and fade animation
export const SmoothScaleFade: React.FC<AnimatedSectionProps> = ({ 
  children, 
  className = '', 
  delay = 0, 
  duration = 0.5,
  triggerOnce = true 
}) => {
  const { ref, shouldAnimate } = useEnhancedScrollAnimation({
    delay,
    triggerOnce,
    threshold: 0.2
  });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ 
        scale: 0.98, 
        opacity: 0, 
        y: 10,
        transform: 'translate3d(0, 10px, 0) scale3d(0.98, 0.98, 1)' 
      }}
      animate={shouldAnimate ? { 
        scale: 1, 
        opacity: 1, 
        y: 0,
        transform: 'translate3d(0, 0, 0) scale3d(1, 1, 1)' 
      } : { 
        scale: 0.98, 
        opacity: 0, 
        y: 10,
        transform: 'translate3d(0, 10px, 0) scale3d(0.98, 0.98, 1)' 
      }}
      transition={{
        duration,
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: 0
      }}
      style={{
        willChange: shouldAnimate ? 'transform, opacity' : 'auto',
        backfaceVisibility: 'hidden',
        transform: shouldAnimate ? 'translate3d(0, 0, 0) scale3d(1, 1, 1)' : 'translate3d(0, 10px, 0) scale3d(0.98, 0.98, 1)'
      }}
    >
      {children}
    </motion.div>
  );
};

// Parallax effect for background elements
export const ParallaxElement: React.FC<{
  children: ReactNode;
  className?: string;
  speed?: number;
}> = ({ children, className = '', speed = 0.5 }) => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, -100 * speed]);

  return (
    <motion.div className={className} style={{ y }}>
      {children}
    </motion.div>
  );
};

// Enhanced staggered grid animation
interface StaggeredGridProps {
  children: ReactNode[];
  className?: string;
  itemClassName?: string;
  staggerDelay?: number;
  columns?: number;
  direction?: 'row' | 'column';
}

export const StaggeredGrid: React.FC<StaggeredGridProps> = ({
  children,
  className = '',
  itemClassName = '',
  staggerDelay = 100,
  columns = 3,
  direction = 'row'
}) => {
  const { ref, visibleItems } = useStaggeredAnimation(children.length, staggerDelay);

  return (
    <div ref={ref} className={className}>
      {children.map((child, index) => {
        const row = Math.floor(index / columns);
        const col = index % columns;
        const animationDelay = direction === 'row' ? row * staggerDelay + col * (staggerDelay / 2) : col * staggerDelay + row * (staggerDelay / 2);

        return (
          <motion.div
            key={index}
            className={itemClassName}
            initial={{ x: -40, opacity: 0, scale: 0.9 }}
            animate={visibleItems.includes(index) ? { x: 0, opacity: 1, scale: 1 } : { x: -40, opacity: 0, scale: 0.9 }}
            transition={{
              duration: 0.6,
              ease: [0.16, 1, 0.3, 1],
              delay: 0
            }}
            style={{
              willChange: visibleItems.includes(index) ? 'transform, opacity' : 'auto'
            }}
          >
            {child}
          </motion.div>
        );
      })}
    </div>
  );
};

// Smooth container for dashboard sections
export const DashboardSection: React.FC<{
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'left' | 'right' | 'up';
}> = ({ children, className = '', delay = 0, direction = 'left' }) => {
  const { ref, shouldAnimate } = useEnhancedScrollAnimation({
    delay,
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: '0px 0px -8% 0px'
  });

  const getInitial = () => {
    switch (direction) {
      case 'left': return { x: -50, opacity: 0, y: 10 };
      case 'right': return { x: 50, opacity: 0, y: 10 };
      case 'up': return { y: 40, opacity: 0 };
      default: return { x: -50, opacity: 0, y: 10 };
    }
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={getInitial()}
      animate={shouldAnimate ? { x: 0, y: 0, opacity: 1 } : getInitial()}
      transition={{
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
        delay: 0
      }}
      style={{
        willChange: shouldAnimate ? 'transform, opacity' : 'auto'
      }}
    >
      {children}
    </motion.div>
  );
};

// Enhanced variants for complex animations
export const fadeFromLeftVariants: Variants = {
  hidden: { 
    x: -60, 
    opacity: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1]
    }
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

export const staggeredFadeFromLeftVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

export const dashboardCardVariants: Variants = {
  hidden: { 
    x: -40, 
    opacity: 0, 
    y: 15,
    scale: 0.98
  },
  visible: {
    x: 0,
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};