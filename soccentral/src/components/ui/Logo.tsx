// Reusable Logo Component for SOC Central
// Can be used throughout the application with different sizes and styles

import React from "react";
import { useTheme } from "@/pages/Main_dashboard/ThemeProvider";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showText?: boolean;
  onClick?: () => void;
  variant?: "default" | "minimal" | "with-glow";
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-12 w-12", 
  lg: "h-16 w-16",
  xl: "h-20 w-20"
};

const textSizeClasses = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl", 
  xl: "text-3xl"
};

export const Logo: React.FC<LogoProps> = ({ 
  size = "md", 
  className,
  showText = false,
  onClick,
  variant = "default"
}) => {
  const { actualTheme } = useTheme();
  const [imageError, setImageError] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [useNewLogos, setUseNewLogos] = React.useState(true);
  
  // New logo files (user will copy these)
  const newLogoDark = "/logo-dark.png";
  const newLogoLight = "/logo-light.png";
  
  // Existing logo files (fallback)
  const existingLogoDark = "/white.png";
  const existingLogoLight = "/logo.png";
  
  // Determine which logo to use
  const primaryLogoSrc = actualTheme === 'dark' 
    ? (useNewLogos ? newLogoDark : existingLogoDark)
    : (useNewLogos ? newLogoLight : existingLogoLight);
    
  const fallbackLogoSrc = actualTheme === 'dark' ? existingLogoDark : existingLogoLight;
  const logoSrc = imageError ? fallbackLogoSrc : primaryLogoSrc;
  
  const containerClasses = cn(
    "relative flex items-center gap-3",
    onClick && "cursor-pointer group",
    className
  );
  
  const imageClasses = cn(
    sizeClasses[size],
    "object-contain transition-all duration-300",
    onClick && "group-hover:scale-110",
    variant === "with-glow" && "drop-shadow-lg",
    variant === "default" && "drop-shadow-sm",
    !imageLoaded && "opacity-0"
  );
  
  const textClasses = cn(
    textSizeClasses[size],
    "font-bold text-foreground transition-all duration-300",
    onClick && "group-hover:text-primary"
  );

  const handleImageError = () => {
    if (useNewLogos) {
      console.log(`New logo not found: ${primaryLogoSrc}, falling back to existing logo: ${fallbackLogoSrc}`);
      setUseNewLogos(false);
      setImageError(false); // Reset error state to try fallback
      setImageLoaded(false); // Reset loaded state
    } else {
      console.log(`Failed to load fallback logo: ${logoSrc}`);
      setImageError(true);
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  return (
    <div className={containerClasses} onClick={onClick}>
      {/* Logo Image */}
      <div className="relative">
        {/* Loading placeholder */}
        {!imageLoaded && (
          <div className={cn(sizeClasses[size], "bg-muted animate-pulse rounded-lg")} />
        )}
        
        <img 
          src={logoSrc}
          alt="SOC Central Logo" 
          className={imageClasses}
          onError={handleImageError}
          onLoad={handleImageLoad}
          style={{ 
            transition: 'opacity 0.3s ease-in-out',
            opacity: imageLoaded ? 1 : 0 
          }}
        />
        
        {/* Glow effect for with-glow variant */}
        {variant === "with-glow" && onClick && (
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        )}
      </div>
      
      {/* Optional Text */}
      {showText && (
        <span className={textClasses}>
          SOC Central
        </span>
      )}
    </div>
  );
};