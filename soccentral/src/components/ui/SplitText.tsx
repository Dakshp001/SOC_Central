import React, { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";

export interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string;
  splitType?: "chars" | "words" | "lines";
  from?: { opacity?: number; y?: number; x?: number; scale?: number };
  to?: { opacity?: number; y?: number; x?: number; scale?: number };
  textAlign?: React.CSSProperties["textAlign"];
  onLetterAnimationComplete?: () => void;
  startDelay?: number;
}

const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = "",
  delay = 50,
  duration = 0.6,
  ease = "power2.out",
  splitType = "chars",
  from = { opacity: 0, y: 30 },
  to = { opacity: 1, y: 0 },
  textAlign = "center",
  onLetterAnimationComplete,
  startDelay = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [elements, setElements] = useState<HTMLElement[]>([]);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  // Split text into elements based on type
  const splitText = (text: string, type: "chars" | "words" | "lines"): React.ReactNode[] => {
    switch (type) {
      case "chars":
        return text.split("").map((char, index) => (
          <span
            key={index}
            className="inline-block"
            style={{ 
              willChange: "transform, opacity",
              transform: "translateZ(0)", // Force GPU acceleration
            }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        ));
      case "words":
        return text.split(" ").map((word, index) => (
          <span
            key={index}
            className="inline-block mr-1"
            style={{ 
              willChange: "transform, opacity",
              transform: "translateZ(0)", // Force GPU acceleration
            }}
          >
            {word}
          </span>
        ));
      case "lines":
        return text.split("\n").map((line, index) => (
          <div
            key={index}
            className="block"
            style={{ 
              willChange: "transform, opacity",
              transform: "translateZ(0)", // Force GPU acceleration
            }}
          >
            {line}
          </div>
        ));
      default:
        return [text];
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const spans = container.querySelectorAll("span, div") as NodeListOf<HTMLElement>;
    setElements(Array.from(spans));

    // Kill any existing timeline
    if (timelineRef.current) {
      timelineRef.current.kill();
    }

    // Create new timeline with optimized settings
    const tl = gsap.timeline({
      delay: startDelay,
      onComplete: () => {
        // Clean up performance optimizations after animation
        spans.forEach((span) => {
          span.style.willChange = "auto";
        });
        onLetterAnimationComplete?.();
      },
    });

    timelineRef.current = tl;

    // Set initial state with better performance
    gsap.set(spans, {
      ...from,
      force3D: true, // Force hardware acceleration
      immediateRender: true,
    });

    // Animate with optimized stagger
    tl.to(spans, {
      ...to,
      duration,
      ease,
      stagger: {
        each: delay / 1000,
        from: "start",
      },
      force3D: true, // Force hardware acceleration
      overwrite: "auto", // Better performance
    });

    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
        timelineRef.current = null;
      }
      gsap.killTweensOf(spans);
    };
  }, [text, delay, duration, ease, splitType, from, to, startDelay, onLetterAnimationComplete]);

  return (
    <div
      ref={containerRef}
      className={`split-text-container ${className}`}
      style={{
        textAlign,
        display: "inline-block",
        overflow: "hidden",
      }}
    >
      {splitText(text, splitType)}
    </div>
  );
};

export { SplitText };
export default SplitText;
