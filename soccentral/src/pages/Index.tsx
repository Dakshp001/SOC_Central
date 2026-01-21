import React, { Suspense } from "react";
import { ThemeProvider } from "./Main_dashboard/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "./Main_dashboard/Header";
import { SecurityTools } from "./Main_dashboard/SecurityTools";
import { SystemHealthStatus } from "./Main_dashboard/SystemHealthStatus";
import { RecentIncidents } from "./Main_dashboard/RecentIncidents";
import { Footer } from "./Main_dashboard/Footer";
import {
  AnimatedSection,
  FadeFromLeft,
  FadeFromRight,
  SmoothScaleFade,
  DashboardSection
} from "@/components/animations/ScrollAnimations";
import { LazyWrapper } from "@/components/common/LazyWrapper";
import { usePrefetchData } from "@/hooks/usePrefetchData";
import { DashboardSkeleton } from "@/components/common/SkeletonLoader";

const Index = () => {
  // Prefetch data in the background for instant navigation
  usePrefetchData();

  return (
    <TooltipProvider>
      <div className="min-h-screen transition-colors duration-300 bg-blue-50 dark:bg-gradient-to-b dark:from-black dark:via-gray-900 dark:to-gray-800 smooth-scroll-container gpu-layer">
        <Header />

        <main className="dashboard-container py-8 space-y-8 no-paint-change">
          {/* Security overview removed as requested */}

          {/* Production Optimized - No animations for faster loading */}
          <Suspense fallback={<DashboardSkeleton />}>
            <SecurityTools />
            <SystemHealthStatus />
            <RecentIncidents />
          </Suspense>
        </main>

        <DashboardSection delay={300} direction="up">
          <Footer />
        </DashboardSection>
      </div>
    </TooltipProvider>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <Index />
    </ThemeProvider>
  );
};

export default App;
