// soccentral/src/components/demo/ScrollAnimationDemo.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AnimatedSection, 
  FadeIn, 
  SlideUp, 
  ScaleIn, 
  StaggeredList, 
  AnimatedCard,
  LazyComponent
} from '@/components/animations/ScrollAnimations';
import { LazyWrapper } from '@/components/common/LazyWrapper';
import { 
  Zap, 
  Shield, 
  Activity, 
  Database, 
  Network, 
  Users, 
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle
} from 'lucide-react';

export const ScrollAnimationDemo: React.FC = () => {
  const demoCards = [
    { icon: Zap, title: "Performance", description: "Lightning fast animations", color: "text-yellow-500" },
    { icon: Shield, title: "Security", description: "Protected and reliable", color: "text-green-500" },
    { icon: Activity, title: "Real-time", description: "Live data updates", color: "text-blue-500" },
    { icon: Database, title: "Storage", description: "Efficient data handling", color: "text-purple-500" },
    { icon: Network, title: "Network", description: "Global connectivity", color: "text-indigo-500" },
    { icon: Users, title: "Users", description: "User-friendly interface", color: "text-pink-500" },
  ];

  const metrics = [
    { label: "Total Users", value: "12,486", trend: "+15%" },
    { label: "Active Sessions", value: "3,247", trend: "+8%" },
    { label: "Response Time", value: "145ms", trend: "-12%" },
    { label: "Uptime", value: "99.9%", trend: "+0.1%" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
      <div className="container mx-auto px-4 space-y-16">
        
        {/* Header Section */}
        <FadeIn delay={0}>
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Scroll Animation Demo
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience smooth, performant scroll animations with lazy loading and intersection observers
            </p>
            <Badge variant="outline" className="mt-4">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              Production Ready
            </Badge>
          </div>
        </FadeIn>

        {/* Slide Up Demo */}
        <AnimatedSection delay={200} direction="up">
          <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-blue-500" />
                Slide Up Animation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This card slides up from the bottom with a smooth easing curve. 
                Perfect for revealing content as users scroll.
              </p>
            </CardContent>
          </Card>
        </AnimatedSection>

        {/* Staggered Cards Grid */}
        <div className="space-y-6">
          <FadeIn delay={400}>
            <h2 className="text-3xl font-bold text-center">Staggered Card Animations</h2>
            <p className="text-center text-muted-foreground">
              Cards appear one by one with a staggered delay for a polished effect
            </p>
          </FadeIn>
          
          <StaggeredList 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            staggerDelay={150}
          >
            {demoCards.map((card, index) => (
              <AnimatedCard key={index} hoverScale={1.03} hoverY={-8}>
                <Card className="h-full bg-card/50 backdrop-blur border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-3">
                      <div className={`p-3 rounded-full bg-muted ${card.color}`}>
                        <card.icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-semibold">{card.title}</h3>
                    </div>
                    <p className="text-muted-foreground">{card.description}</p>
                  </CardContent>
                </Card>
              </AnimatedCard>
            ))}
          </StaggeredList>
        </div>

        {/* Scale In Animation */}
        <ScaleIn delay={600}>
          <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-green-500" />
                Scale In Animation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                This card scales in from 90% to 100% size with opacity fade. 
                Great for drawing attention to important content.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {metrics.map((metric, index) => (
                  <div key={index} className="text-center p-4 bg-background/50 rounded-lg">
                    <div className="text-2xl font-bold text-foreground">{metric.value}</div>
                    <div className="text-sm text-muted-foreground">{metric.label}</div>
                    <div className="text-xs text-green-500">{metric.trend}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </ScaleIn>

        {/* Lazy Loading Demo */}
        <div className="space-y-6">
          <FadeIn delay={800}>
            <h2 className="text-3xl font-bold text-center">Lazy Loading with Animations</h2>
            <p className="text-center text-muted-foreground">
              Content below loads only when it's about to enter the viewport
            </p>
          </FadeIn>

          <LazyWrapper threshold={0.2} minHeight="300px">
            <AnimatedSection delay={100} direction="up">
              <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-200 dark:border-orange-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6 text-orange-500" />
                    Lazy Loaded Content
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    This content was lazy loaded when it approached the viewport, 
                    improving initial page load performance significantly.
                  </p>
                  <div className="mt-4 p-4 bg-background/50 rounded-lg">
                    <div className="animate-pulse">
                      <div className="h-2 bg-muted rounded mb-2"></div>
                      <div className="h-2 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-2 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimatedSection>
          </LazyWrapper>
        </div>

        {/* Performance Benefits */}
        <AnimatedSection delay={1000} direction="up">
          <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-6 h-6 text-purple-500" />
                Performance Benefits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">✨ Features Implemented</h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Intersection Observer API for efficient viewport detection</li>
                    <li>• Lazy loading with placeholder content</li>
                    <li>• Staggered animations for lists and grids</li>
                    <li>• Custom easing curves for smooth motion</li>
                    <li>• GPU-accelerated transforms</li>
                    <li>• Reduced motion support for accessibility</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">🚀 Performance Optimizations</h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Components load only when needed</li>
                    <li>• Minimal JavaScript bundle impact</li>
                    <li>• Smooth 60fps animations</li>
                    <li>• Memory-efficient intersection observers</li>
                    <li>• No animation blocking during scroll</li>
                    <li>• Automatic cleanup on component unmount</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedSection>

        {/* Footer */}
        <FadeIn delay={1200}>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Scroll back to the top to see the animations again! 
              All animations respect user preferences for reduced motion.
            </p>
          </div>
        </FadeIn>

      </div>
    </div>
  );
};