import React from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface ScrollAnimatedSectionProps {
  children: React.ReactNode;
  animation?:
    | "fadeIn"
    | "slideUp"
    | "slideLeft"
    | "slideRight"
    | "scaleIn"
    | "slideDown";
  delay?: number;
  duration?: number;
  className?: string;
  threshold?: number;
  triggerOnce?: boolean;
}

const animationClasses = {
  fadeIn: {
    initial: "opacity-0",
    animate: "opacity-100",
    transition: "transition-opacity",
  },
  slideUp: {
    initial: "opacity-0 translate-y-8",
    animate: "opacity-100 translate-y-0",
    transition: "transition-all",
  },
  slideDown: {
    initial: "opacity-0 -translate-y-8",
    animate: "opacity-100 translate-y-0",
    transition: "transition-all",
  },
  slideLeft: {
    initial: "opacity-0 translate-x-8",
    animate: "opacity-100 translate-x-0",
    transition: "transition-all",
  },
  slideRight: {
    initial: "opacity-0 -translate-x-8",
    animate: "opacity-100 translate-x-0",
    transition: "transition-all",
  },
  scaleIn: {
    initial: "opacity-0 scale-95",
    animate: "opacity-100 scale-100",
    transition: "transition-all",
  },
};

export const ScrollAnimatedSection: React.FC<ScrollAnimatedSectionProps> = ({
  children,
  animation = "slideUp",
  delay = 0,
  duration = 600,
  className = "",
  threshold = 0.1,
  triggerOnce = false,
}) => {
  const { elementRef, isVisible, isExiting } = useScrollAnimation({
    threshold,
    triggerOnce,
    delay,
    reverse: !triggerOnce,
  });

  const animationConfig = animationClasses[animation];
  const durationClass = `duration-${duration}`;

  return (
    <div
      ref={elementRef}
      className={`
        ${animationConfig.transition}
        ${durationClass}
        ease-out
        ${
          isVisible && !isExiting
            ? animationConfig.animate
            : animationConfig.initial
        }
        ${className}
      `}
      style={{
        transitionDelay: isVisible ? `${delay}ms` : "0ms",
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
};

export default ScrollAnimatedSection;
