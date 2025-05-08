# Performance Monitoring Implementation Specification

**Role**: PM  
**Date**: May 8, 2025  
**Feature**: Performance Monitoring and Analytics  
**Branch**: devin/1746716283-frontend-improvements  

## Overview

This specification outlines the implementation of performance monitoring and analytics for the UOR Content Management Client. The monitoring system will provide insights into application performance, user behavior, and potential bottlenecks, enabling data-driven optimization and improved user experience.

## Requirements

1. **Core Functionality**
   - Implement real-time performance monitoring
   - Track key performance metrics (LCP, FID, CLS, TTFB)
   - Collect user behavior analytics
   - Enable error tracking and reporting

2. **Performance Metrics Requirements**
   - Track Core Web Vitals (LCP, FID, CLS)
   - Monitor network requests and response times
   - Track JavaScript execution time
   - Measure time to interactive and first contentful paint

3. **User Analytics Requirements**
   - Track page views and navigation patterns
   - Measure feature usage and engagement
   - Collect session duration and bounce rates
   - Support custom event tracking

4. **Integration Requirements**
   - Seamless integration with Next.js App Router
   - Compatibility with React Query's performance tracking
   - Support for service worker metrics
   - Integration with error handling system

## User Stories

### As a developer, I want to:

1. Monitor application performance in real-time.
2. Track Core Web Vitals and other key metrics.
3. Identify performance bottlenecks and optimization opportunities.
4. Receive alerts for critical performance issues.

### As a product manager, I want to:

1. Understand user behavior and engagement patterns.
2. Measure feature adoption and usage.
3. Track conversion rates and user flows.
4. Make data-driven decisions for product improvements.

## Technical Specifications

### Performance Monitoring Implementation

1. **Web Vitals Tracking**
   ```typescript
   // utils/webVitals.ts
   import { ReportHandler } from 'web-vitals';

   export function reportWebVitals(onPerfEntry?: ReportHandler) {
     if (onPerfEntry && typeof onPerfEntry === 'function') {
       import('web-vitals').then(({ getCLS, getFID, getLCP, getTTFB, getFCP }) => {
         getCLS(onPerfEntry);
         getFID(onPerfEntry);
         getLCP(onPerfEntry);
         getTTFB(onPerfEntry);
         getFCP(onPerfEntry);
       });
     }
   }
   ```

2. **Performance Monitoring Provider**
   ```typescript
   // components/PerformanceMonitoringProvider.tsx
   import { createContext, useContext, ReactNode, useEffect } from 'react';
   import { reportWebVitals } from '../utils/webVitals';

   interface PerformanceMetric {
     name: string;
     value: number;
     id: string;
     delta: number;
     entries: PerformanceEntry[];
   }

   interface PerformanceContextType {
     trackEvent: (name: string, properties?: Record<string, any>) => void;
     trackError: (error: Error, context?: Record<string, any>) => void;
   }

   const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

   export function PerformanceMonitoringProvider({ children }: { children: ReactNode }) {
     useEffect(() => {
       // Initialize performance monitoring
       reportWebVitals((metric) => {
         sendToAnalyticsService(metric);
       });
     }, []);

     const sendToAnalyticsService = (metric: PerformanceMetric) => {
       // Send metrics to analytics service
       console.log(metric);
       
       // Example implementation with Google Analytics
       if (window.gtag) {
         window.gtag('event', metric.name, {
           value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
           event_category: 'Web Vitals',
           event_label: metric.id,
           non_interaction: true,
         });
       }
     };

     const trackEvent = (name: string, properties?: Record<string, any>) => {
       // Track custom events
       if (window.gtag) {
         window.gtag('event', name, properties);
       }
     };

     const trackError = (error: Error, context?: Record<string, any>) => {
       // Track errors
       if (window.gtag) {
         window.gtag('event', 'error', {
           error_message: error.message,
           error_stack: error.stack,
           ...context,
         });
       }
     };

     return (
       <PerformanceContext.Provider value={{ trackEvent, trackError }}>
         {children}
       </PerformanceContext.Provider>
     );
   }

   export function usePerformanceMonitoring() {
     const context = useContext(PerformanceContext);
     if (context === undefined) {
       throw new Error('usePerformanceMonitoring must be used within a PerformanceMonitoringProvider');
     }
     return context;
   }
   ```

### Analytics Implementation

1. **Analytics Provider**
   ```typescript
   // components/AnalyticsProvider.tsx
   import { createContext, useContext, ReactNode, useEffect } from 'react';
   import { useRouter } from 'next/navigation';

   interface AnalyticsContextType {
     trackPageView: (url: string, title?: string) => void;
     trackEvent: (category: string, action: string, label?: string, value?: number) => void;
   }

   const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

   export function AnalyticsProvider({ children }: { children: ReactNode }) {
     const router = useRouter();

     useEffect(() => {
       // Initialize analytics
       if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_GA_ID) {
         // Google Analytics initialization
         window.dataLayer = window.dataLayer || [];
         function gtag(...args: any[]) {
           window.dataLayer.push(args);
         }
         gtag('js', new Date());
         gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
           page_path: window.location.pathname,
         });
       }

       // Track page views on route change
       const handleRouteChange = (url: string) => {
         if (window.gtag) {
           window.gtag('config', process.env.NEXT_PUBLIC_GA_ID as string, {
             page_path: url,
           });
         }
       };

       // Add event listener for route changes
       // This is a simplified example - Next.js App Router requires different approach
       // We would need to use the usePathname hook in a component
     }, [router]);

     const trackPageView = (url: string, title?: string) => {
       if (window.gtag) {
         window.gtag('config', process.env.NEXT_PUBLIC_GA_ID as string, {
           page_path: url,
           page_title: title,
         });
       }
     };

     const trackEvent = (category: string, action: string, label?: string, value?: number) => {
       if (window.gtag) {
         window.gtag('event', action, {
           event_category: category,
           event_label: label,
           value: value,
         });
       }
     };

     return (
       <AnalyticsContext.Provider value={{ trackPageView, trackEvent }}>
         {children}
       </AnalyticsContext.Provider>
     );
   }

   export function useAnalytics() {
     const context = useContext(AnalyticsContext);
     if (context === undefined) {
       throw new Error('useAnalytics must be used within an AnalyticsProvider');
     }
     return context;
   }
   ```

### Error Tracking

1. **Error Boundary with Tracking**
   ```typescript
   // components/ErrorBoundaryWithTracking.tsx
   import React, { Component, ErrorInfo, ReactNode } from 'react';
   import { Box, Heading, Text, Button } from '@chakra-ui/react';

   interface Props {
     children: ReactNode;
     fallback?: ReactNode;
     onError?: (error: Error, errorInfo: ErrorInfo) => void;
   }

   interface State {
     hasError: boolean;
     error?: Error;
   }

   export class ErrorBoundaryWithTracking extends Component<Props, State> {
     constructor(props: Props) {
       super(props);
       this.state = { hasError: false };
     }

     static getDerivedStateFromError(error: Error): State {
       return { hasError: true, error };
     }

     componentDidCatch(error: Error, errorInfo: ErrorInfo) {
       // Track the error
       if (this.props.onError) {
         this.props.onError(error, errorInfo);
       }

       // Send to analytics
       if (window.gtag) {
         window.gtag('event', 'error', {
           error_message: error.message,
           error_stack: error.stack,
           component_stack: errorInfo.componentStack,
         });
       }

       console.error('Error caught by ErrorBoundary:', error, errorInfo);
     }

     render() {
       if (this.state.hasError) {
         if (this.props.fallback) {
           return this.props.fallback;
         }

         return (
           <Box p={4} borderWidth="1px" borderRadius="lg" textAlign="center">
             <Heading size="lg" mb={4}>Something went wrong</Heading>
             <Text mb={4}>
               We've encountered an error and our team has been notified.
             </Text>
             <Button
               colorScheme="blue"
               onClick={() => this.setState({ hasError: false })}
             >
               Try again
             </Button>
           </Box>
         );
       }

       return this.props.children;
     }
   }
   ```

### Performance Dashboard

1. **Performance Dashboard Component**
   ```typescript
   // components/PerformanceDashboard.tsx
   import { useState, useEffect } from 'react';
   import {
     Box,
     Heading,
     Text,
     SimpleGrid,
     Stat,
     StatLabel,
     StatNumber,
     StatHelpText,
     Progress,
     Tabs,
     TabList,
     TabPanels,
     Tab,
     TabPanel,
   } from '@chakra-ui/react';

   interface PerformanceMetric {
     name: string;
     value: number;
     timestamp: number;
   }

   export default function PerformanceDashboard() {
     const [metrics, setMetrics] = useState<Record<string, PerformanceMetric[]>>({
       LCP: [],
       FID: [],
       CLS: [],
       TTFB: [],
       FCP: [],
     });

     useEffect(() => {
       // In a real implementation, this would fetch data from an API
       // This is just a mock implementation for demonstration
       const mockData = {
         LCP: [
           { name: 'LCP', value: 2.1, timestamp: Date.now() - 86400000 },
           { name: 'LCP', value: 1.9, timestamp: Date.now() - 43200000 },
           { name: 'LCP', value: 2.3, timestamp: Date.now() },
         ],
         FID: [
           { name: 'FID', value: 15, timestamp: Date.now() - 86400000 },
           { name: 'FID', value: 12, timestamp: Date.now() - 43200000 },
           { name: 'FID', value: 18, timestamp: Date.now() },
         ],
         CLS: [
           { name: 'CLS', value: 0.12, timestamp: Date.now() - 86400000 },
           { name: 'CLS', value: 0.09, timestamp: Date.now() - 43200000 },
           { name: 'CLS', value: 0.11, timestamp: Date.now() },
         ],
         TTFB: [
           { name: 'TTFB', value: 120, timestamp: Date.now() - 86400000 },
           { name: 'TTFB', value: 110, timestamp: Date.now() - 43200000 },
           { name: 'TTFB', value: 115, timestamp: Date.now() },
         ],
         FCP: [
           { name: 'FCP', value: 1.2, timestamp: Date.now() - 86400000 },
           { name: 'FCP', value: 1.1, timestamp: Date.now() - 43200000 },
           { name: 'FCP', value: 1.3, timestamp: Date.now() },
         ],
       };

       setMetrics(mockData);
     }, []);

     const getLatestMetric = (metricName: string) => {
       const metricData = metrics[metricName];
       if (!metricData || metricData.length === 0) return null;
       return metricData[metricData.length - 1];
     };

     const getMetricStatus = (metricName: string) => {
       const metric = getLatestMetric(metricName);
       if (!metric) return 'unknown';

       switch (metricName) {
         case 'LCP':
           return metric.value < 2.5 ? 'good' : metric.value < 4 ? 'needs-improvement' : 'poor';
         case 'FID':
           return metric.value < 100 ? 'good' : metric.value < 300 ? 'needs-improvement' : 'poor';
         case 'CLS':
           return metric.value < 0.1 ? 'good' : metric.value < 0.25 ? 'needs-improvement' : 'poor';
         case 'TTFB':
           return metric.value < 200 ? 'good' : metric.value < 500 ? 'needs-improvement' : 'poor';
         case 'FCP':
           return metric.value < 1.8 ? 'good' : metric.value < 3 ? 'needs-improvement' : 'poor';
         default:
           return 'unknown';
       }
     };

     const getStatusColor = (status: string) => {
       switch (status) {
         case 'good':
           return 'green.500';
         case 'needs-improvement':
           return 'orange.500';
         case 'poor':
           return 'red.500';
         default:
           return 'gray.500';
       }
     };

     const getMetricUnit = (metricName: string) => {
       switch (metricName) {
         case 'LCP':
         case 'FCP':
           return 's';
         case 'FID':
         case 'TTFB':
           return 'ms';
         case 'CLS':
           return '';
         default:
           return '';
       }
     };

     return (
       <Box p={4}>
         <Heading size="lg" mb={6}>Performance Dashboard</Heading>
         
         <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} mb={8}>
           {Object.keys(metrics).map((metricName) => {
             const metric = getLatestMetric(metricName);
             const status = getMetricStatus(metricName);
             const color = getStatusColor(status);
             const unit = getMetricUnit(metricName);
             
             return (
               <Stat key={metricName} p={4} borderWidth="1px" borderRadius="lg">
                 <StatLabel>{metricName}</StatLabel>
                 <StatNumber color={color}>
                   {metric ? `${metric.value}${unit}` : 'N/A'}
                 </StatNumber>
                 <StatHelpText textTransform="capitalize">{status}</StatHelpText>
                 <Progress
                   value={status === 'good' ? 100 : status === 'needs-improvement' ? 50 : 25}
                   colorScheme={status === 'good' ? 'green' : status === 'needs-improvement' ? 'orange' : 'red'}
                   size="sm"
                   mt={2}
                 />
               </Stat>
             );
           })}
         </SimpleGrid>
         
         <Tabs>
           <TabList>
             <Tab>Core Web Vitals</Tab>
             <Tab>User Analytics</Tab>
             <Tab>Error Tracking</Tab>
           </TabList>
           
           <TabPanels>
             <TabPanel>
               <Text>Detailed Core Web Vitals metrics and trends would be displayed here.</Text>
             </TabPanel>
             <TabPanel>
               <Text>User analytics data including page views, session duration, and user flows would be displayed here.</Text>
             </TabPanel>
             <TabPanel>
               <Text>Error tracking information including error rates, types, and affected components would be displayed here.</Text>
             </TabPanel>
           </TabPanels>
         </Tabs>
       </Box>
     );
   }
   ```

## Implementation Plan

1. **Phase 1: Performance Monitoring Setup**
   - Install performance monitoring dependencies
   - Configure Web Vitals tracking
   - Set up performance monitoring provider
   - Implement metric collection and reporting

2. **Phase 2: Analytics Integration**
   - Set up analytics provider
   - Implement page view tracking
   - Add event tracking
   - Configure user behavior analytics

3. **Phase 3: Error Tracking**
   - Implement error boundary with tracking
   - Set up error reporting
   - Add context to error reports
   - Configure error alerts

4. **Phase 4: Performance Dashboard**
   - Create performance dashboard component
   - Implement metric visualization
   - Add trend analysis
   - Create admin access controls

5. **Phase 5: Testing and Validation**
   - Test performance monitoring in development
   - Validate analytics tracking
   - Test error reporting
   - Ensure proper integration with Next.js and React Query

## Success Criteria

1. Core Web Vitals are tracked and reported
2. User behavior analytics are collected
3. Error tracking and reporting is implemented
4. Performance dashboard provides actionable insights
5. Metrics are stored and accessible for analysis
6. Real-time monitoring alerts for critical issues
7. Comprehensive test coverage for monitoring features
8. Zero linting warnings or errors
9. Successful integration with Next.js and React Query
10. Minimal performance impact from monitoring code

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Performance impact of monitoring code | Optimize monitoring code and use sampling |
| Privacy concerns with analytics | Implement proper data anonymization and consent management |
| False positives in error tracking | Implement filtering and context-aware error reporting |
| Overwhelming amount of data | Implement data aggregation and prioritization |

## Dependencies

- web-vitals: ^3.0.0
- @next/bundle-analyzer: ^15.0.0
- @chakra-ui/react: ^2.8.0
- Next.js: ^15.0.0
- TypeScript: ^5.0.0

## References

- [Web Vitals Documentation](https://web.dev/vitals/)
- [Next.js Analytics](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Google Analytics 4](https://developers.google.com/analytics/devguides/collection/ga4)
- [Error Tracking Best Practices](https://sentry.io/for/javascript/)
