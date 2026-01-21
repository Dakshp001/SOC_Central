// Completely Independent KPI Tooltip - Uses React Portal for isolation
import React, { useState, useRef, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';
import { tooltipManager } from './TooltipManager';

interface KPITooltipProps {
  label: string;
  description: string;
  calculation: string;
  value: string;
  lastUpdated: Date;
  severity: string;
  hasData: boolean;
}

const KPITooltip: React.FC<KPITooltipProps> = ({
  label,
  description,
  calculation,
  value,
  lastUpdated,
  severity,
  hasData
}) => {
  const tooltipId = useId(); // Unique ID for this tooltip instance
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  // Create portal container if it doesn't exist
  useEffect(() => {
    let container = document.getElementById('kpi-tooltip-portal');
    if (!container) {
      container = document.createElement('div');
      container.id = 'kpi-tooltip-portal';
      container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        z-index: 999999;
        pointer-events: none;
        width: 100vw;
        height: 100vh;
      `;
      document.body.appendChild(container);
    }
  }, []);

  const calculatePosition = () => {
    if (!buttonRef.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const tooltipWidth = 320;
    const tooltipHeight = 160;
    const gap = 8; // Reduced gap to minimize dead space
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let top = buttonRect.top - tooltipHeight - gap;
    let left = buttonRect.left + (buttonRect.width / 2) - (tooltipWidth / 2);
    
    // Adjust if tooltip goes off screen horizontally
    if (left < 12) left = 12;
    if (left + tooltipWidth > viewportWidth - 12) {
      left = viewportWidth - tooltipWidth - 12;
    }
    
    // If tooltip goes above viewport, show below button
    if (top < 12) {
      top = buttonRect.bottom + gap;
    }
    
    // If still off screen below, position optimally
    if (top + tooltipHeight > viewportHeight - 12) {
      top = Math.max(12, viewportHeight / 2 - tooltipHeight / 2);
    }

    setPosition({ top, left });
  };

  const clearAllTimeouts = () => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const showTooltip = () => {
    clearAllTimeouts();
    if (!isVisible) {
      calculatePosition();
      setIsVisible(true);
      // Register with tooltip manager
      tooltipManager.setActiveTooltip(tooltipId, () => {
        setIsVisible(false);
        setIsHovered(false);
      });
    }
  };

  const hideTooltip = () => {
    clearAllTimeouts();
    hideTimeoutRef.current = setTimeout(() => {
      if (!isHovered) {
        setIsVisible(false);
        tooltipManager.hideTooltip(tooltipId);
      }
    }, 200);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    clearAllTimeouts();
    showTimeoutRef.current = setTimeout(() => {
      showTooltip();
    }, 100); // Small delay before showing
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    hideTooltip();
  };

  const handleTooltipMouseEnter = () => {
    setIsHovered(true);
    clearAllTimeouts();
  };

  const handleTooltipMouseLeave = () => {
    setIsHovered(false);
    hideTooltip();
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearAllTimeouts();
    if (isVisible) {
      setIsVisible(false);
      tooltipManager.hideTooltip(tooltipId);
    } else {
      calculatePosition();
      setIsVisible(true);
      // Register with tooltip manager
      tooltipManager.setActiveTooltip(tooltipId, () => {
        setIsVisible(false);
        setIsHovered(false);
      });
    }
  };

  // Close on outside click and cleanup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isVisible &&
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsVisible(false);
        tooltipManager.hideTooltip(tooltipId);
      }
    };

    const handleScroll = () => {
      setIsVisible(false);
      tooltipManager.hideTooltip(tooltipId);
    };

    const handleResize = () => {
      setIsVisible(false);
      tooltipManager.hideTooltip(tooltipId);
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isVisible, tooltipId]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      clearAllTimeouts();
      tooltipManager.hideTooltip(tooltipId);
    };
  }, [tooltipId]);

  const getSeverityColor = () => {
    if (!hasData) return '#6b7280';
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#ca8a04';
      case 'low': return '#16a34a';
      case 'info': return '#2563eb';
      default: return '#6b7280';
    }
  };

  // Detect dark mode
  const isDark = document.documentElement.classList.contains('dark');

  const portalContainer = document.getElementById('kpi-tooltip-portal');

  const tooltipContent = isVisible && portalContainer ? createPortal(
    <div
      ref={tooltipRef}
      onMouseEnter={handleTooltipMouseEnter}
      onMouseLeave={handleTooltipMouseLeave}
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: '320px',
        backgroundColor: '#000000',
        border: 'none',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#ffffff',
        zIndex: 999999,
        pointerEvents: 'auto',
        opacity: 1,
        backdropFilter: 'blur(20px)',
        animation: 'kpiTooltipSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      {/* Invisible bridge to prevent flickering */}
      <div
        style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '50px',
          height: '10px',
          backgroundColor: 'transparent',
          pointerEvents: 'auto'
        }}
        onMouseEnter={handleTooltipMouseEnter}
        onMouseLeave={handleTooltipMouseLeave}
      />
      {/* Content */}
      <div style={{ padding: '20px' }}>
        {/* Title with value inline */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}>
          <div style={{
            fontSize: '15px',
            fontWeight: '500',
            color: '#ffffff',
            opacity: 0.9
          }}>
            {label}
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: '700',
            color: getSeverityColor(),
            textShadow: `0 0 10px ${getSeverityColor()}40`
          }}>
            {value}
          </div>
        </div>

        {/* Description */}
        <div style={{
          fontSize: '13px',
          color: '#ffffff',
          opacity: 0.7,
          lineHeight: '1.5',
          marginBottom: '16px'
        }}>
          {description}
        </div>

        {/* Calculation - Minimal style */}
        <div style={{
          fontSize: '11px',
          fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '12px',
          color: 'rgba(255, 255, 255, 0.6)',
          wordWrap: 'break-word',
          lineHeight: '1.4',
          marginBottom: '16px'
        }}>
          {calculation}
        </div>

        {/* Footer - Minimal */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          fontSize: '10px',
          color: 'rgba(255, 255, 255, 0.4)',
          letterSpacing: '0.5px',
          textTransform: 'uppercase'
        }}>
          Updated {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* Subtle glow effect */}
      <div style={{
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
        borderRadius: '16px 16px 0 0'
      }} />

      {/* CSS Animations */}
      <style>{`
        @keyframes kpiTooltipSlideIn {
          0% {
            opacity: 0;
            transform: translateY(8px) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>,
    portalContainer
  ) : null;

  return (
    <>
      {/* Info Button */}
      <button
        ref={buttonRef}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          background: 'transparent',
          border: 'none',
          padding: '6px',
          cursor: 'pointer',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isVisible ? 1 : 0.6,
          transition: 'opacity 0.2s ease, background-color 0.2s ease',
          zIndex: 100,
          position: 'relative'
        }}
      >
        <Info size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
      </button>

      {/* Portal-rendered tooltip */}
      {tooltipContent}
    </>
  );
};

export default KPITooltip;