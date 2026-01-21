import React from "react";
import {
  Shield,
  Mail,
  Phone,
  Globe,
  ExternalLink,
  MapPin,
  Linkedin,
} from "lucide-react";
import { HeaderLogo } from "./HeaderLogo";

export const Footer: React.FC = () => {
  return (
    <>
      {/* Footer Container */}
      <div className="mt-16 px-4">
        <div className="flex justify-center">
          {/* Floating Footer */}
          <footer className="w-[98%] max-w-8xl transition-all duration-500 ease-in-out mb-6">
            {/* Main glass morphism container */}
            <div
              className="
              relative overflow-hidden
              backdrop-blur-2xl 
              bg-background/60 dark:bg-background/40 
              border border-border/30 dark:border-border/20
              rounded-2xl
              shadow-xl shadow-black/5 dark:shadow-black/20
              transition-all duration-300
              hover:shadow-2xl hover:shadow-black/8 dark:hover:shadow-black/30
              hover:bg-background/70 dark:hover:bg-background/50
            "
            >
              {/* Enhanced gradient overlays for depth */}
              <div className="absolute inset-0 bg-gradient-to-r from-background/20 via-transparent to-background/20 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/10 via-transparent to-background/5 pointer-events-none" />

              <div className="relative px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  {/* Brand Section */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 group">
                      <div className="relative">
                        <HeaderLogo />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-base leading-tight">
                          SOC Analytics Platform
                        </h3>
                        <p className="text-xs text-muted-foreground font-medium">
                          Advanced Security Operations
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                      Empowering security teams with intelligent analytics and
                      real-time threat detection capabilities.
                    </p>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                      <div className="w-1 h-3 bg-primary rounded-full"></div>
                      Contact Support
                    </h4>
                    <div className="space-y-2">
                      <a
                        href="tel:8008581251"
                        className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-all duration-200 group p-2 rounded-lg hover:bg-primary/5 backdrop-blur-sm"
                      >
                        <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors duration-200">
                          <Phone className="h-3 w-3 text-primary" />
                        </div>
                        <span className="font-medium text-xs">
                          800-858-1251
                        </span>
                        <span className="text-xs text-muted-foreground/70">
                          (Toll-Free)
                        </span>
                      </a>

                      <a
                        href="mailto:soc@cybersecurityumbrella.com"
                        className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-all duration-200 group p-2 rounded-lg hover:bg-primary/5 backdrop-blur-sm"
                      >
                        <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors duration-200">
                          <Mail className="h-3 w-3 text-primary" />
                        </div>
                        <span className="font-medium text-xs">
                          soc@cybersecurityumbrella.com
                        </span>
                      </a>

                      <a
                        href="mailto:support@cybersecurityumbrella.com"
                        className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-all duration-200 group p-2 rounded-lg hover:bg-primary/5 backdrop-blur-sm"
                      >
                        <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors duration-200">
                          <Mail className="h-3 w-3 text-primary" />
                        </div>
                        <span className="font-medium text-xs">
                          support@cybersecurityumbrella.com
                        </span>
                      </a>

                      <a
                        href="https://in.linkedin.com/company/cybersecurityumbrella"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-all duration-200 group p-2 rounded-lg hover:bg-primary/5 backdrop-blur-sm"
                      >
                        <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors duration-200">
                          <Linkedin className="h-3 w-3 text-primary" />
                        </div>
                        <span className="font-medium text-xs">
                          LinkedIn
                        </span>
                        <ExternalLink className="h-2.5 w-2.5 text-muted-foreground/60 group-hover:text-primary/70 transition-colors duration-200" />
                      </a>

                      <a
                        href="https://www.cybersecurityumbrella.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-all duration-200 group p-2 rounded-lg hover:bg-primary/5 backdrop-blur-sm"
                      >
                        <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors duration-200">
                          <Globe className="h-3 w-3 text-primary" />
                        </div>
                        <span className="font-medium text-xs">
                          www.cybersecurityumbrella.com
                        </span>
                        <ExternalLink className="h-2.5 w-2.5 text-muted-foreground/60 group-hover:text-primary/70 transition-colors duration-200" />
                      </a>
                    </div>
                  </div>

                  {/* Quick Links & Status */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                      <div className="w-1 h-3 bg-primary rounded-full"></div>
                      Quick Access
                    </h4>
                    <div className="grid grid-cols-2 gap-1 mb-4">
                      <a
                        href="#documentation"
                        className="text-xs text-muted-foreground hover:text-primary transition-colors duration-200 p-1 rounded hover:bg-primary/5"
                      >
                        Documentation
                      </a>
                      <a
                        href="#status"
                        className="text-xs text-muted-foreground hover:text-primary transition-colors duration-200 p-1 rounded hover:bg-primary/5"
                      >
                        System Status
                      </a>
                      <a
                        href="#privacy"
                        className="text-xs text-muted-foreground hover:text-primary transition-colors duration-200 p-1 rounded hover:bg-primary/5"
                      >
                        Privacy Policy
                      </a>
                      <a
                        href="#terms"
                        className="text-xs text-muted-foreground hover:text-primary transition-colors duration-200 p-1 rounded hover:bg-primary/5"
                      >
                        Terms of Service
                      </a>
                    </div>

                    {/* Status Indicators */}
                    <div className="space-y-2 pt-3 border-t border-border/30">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-muted-foreground font-medium">
                          All Systems Operational
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-muted-foreground/70" />
                        <span className="text-xs text-muted-foreground">
                          24/7 Global Security Operations
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Status Bar */}
                <div className="mt-4 pt-4 border-t border-border/20">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>© Security Operations Center</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Built with security-first principles</span>
                      <Shield className="h-3 w-3 text-primary/70" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced accent lines for depth */}
              <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
              <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
            </div>
          </footer>
        </div>
      </div>
    </>
  );
};
