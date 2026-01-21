// HeaderLogo Component
// Save as: src/pages/Main_dashboard/HeaderLogo.tsx

import React from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/shared/Logo";

export const HeaderLogo: React.FC = () => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate("/");
  };

  return (
    <div className="relative group cursor-pointer" onClick={handleLogoClick}>
      <Logo
        alt="Security Dashboard Logo"
        className="h-16 w-16 drop-shadow-sm transition-all duration-300 group-hover:scale-105"
      />
    </div>
  );
};