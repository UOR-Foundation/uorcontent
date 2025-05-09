'use client';

import { Metric, onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

/**
 * Analytics and performance monitoring module
 * Provides functions for tracking user interactions and monitoring application performance
 */

export interface PerformanceMetrics {
  timeToFirstByte: number;
  timeToFirstPaint: number;
  timeToFirstContentfulPaint: number;
  timeToInteractive: number;
  largestContentfulPaint: number;
  interactionToNextPaint: number;
  cumulativeLayoutShift: number;
}

/**
 * Initialize performance monitoring
 * Sets up performance observers and collects web vitals metrics
 */
export function initPerformanceMonitoring(): void {
  if (typeof window === 'undefined') return;

  // Report Web Vitals
  onCLS(sendToAnalytics);
  onINP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
  onFCP(sendToAnalytics);

  // Set up Performance Observer for custom metrics
  if ('PerformanceObserver' in window) {
    try {
      // Long Tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) {
            sendToAnalytics({
              name: 'long-task',
              value: entry.duration,
              id: `${entry.name}-${entry.startTime}`,
            });
          }
        });
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });

      // Resource Timing
      const resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            if (resourceEntry.initiatorType === 'fetch' || resourceEntry.initiatorType === 'xmlhttprequest') {
              sendToAnalytics({
                name: 'resource-timing',
                value: resourceEntry.duration,
                id: resourceEntry.name,
              });
            }
          }
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });

      // Navigation Timing
      const navigationObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            sendToAnalytics({
              name: 'navigation-timing',
              value: navEntry.duration,
              id: 'navigation',
            });
          }
        });
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        document.dispatchEvent(new CustomEvent('performanceObserverError', { 
          detail: { error: e instanceof Error ? e.message : 'Unknown error' } 
        }));
      }
    }
  }
}

export interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  nonInteraction?: boolean;
}

/**
 * Track a user event
 * @param event - Analytics event to track
 */
export function trackEvent(event: AnalyticsEvent): void {
  if (typeof window === 'undefined') return;

  sendToAnalytics({
    name: event.action,
    value: event.value || 0,
    id: `${event.category}-${event.action}-${event.label || ''}`,
  });

  // In production, they are sent to the analytics service
}

/**
 * Track a page view
 * @param url - URL of the page
 * @param title - Title of the page
 */
export function trackPageView(url: string, title: string): void {
  if (typeof window === 'undefined') return;

  sendToAnalytics({
    name: 'page-view',
    value: 1,
    id: url,
  });

  // In production, they are sent to the analytics service
}

/**
 * Initialize analytics
 * Sets up analytics tracking and performance monitoring
 */
export function initAnalytics(): void {
  if (typeof window === 'undefined') return;

  initPerformanceMonitoring();

  trackPageView(window.location.pathname, document.title);

  if (typeof window !== 'undefined') {
    const handleRouteChange = (url: string) => {
      trackPageView(url, document.title);
    };

    window.addEventListener('popstate', () => {
      handleRouteChange(window.location.pathname);
    });
  }
}

/**
 * Send metrics to analytics service
 * @param metric - Metric to send
 */
function sendToAnalytics(metric: Metric | { name: string; value: number; id: string }): void {
  // In production, they are sent to the analytics service

  if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
    fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metric,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
      keepalive: true,
    }).catch((error) => {
      if (process.env.NODE_ENV === 'development') {
        document.dispatchEvent(new CustomEvent('analyticsError', { 
          detail: { error: error instanceof Error ? error.message : 'Unknown error' } 
        }));
      }
    });
  }
}
