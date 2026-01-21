import React from "react";
import { useTheme } from "@/pages/Main_dashboard/ThemeProvider";

type LogoProps = {
  className?: string;
  onClick?: () => void;
  alt?: string;
  height?: number;
  width?: number;
};

export const Logo: React.FC<LogoProps> = ({
  className,
  onClick,
  alt = "SOC Central",
  height,
  width,
}) => {
  const { actualTheme } = useTheme();
  const src = actualTheme === "dark" ? "/logo-dark.png" : "/logo-light.png";

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={{ height, width }}
      onClick={onClick}
    />
  );
};

export default Logo;



