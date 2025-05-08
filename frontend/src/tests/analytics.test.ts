import { Metric } from 'web-vitals';
import { trackEvent, trackPageView, initAnalytics, initPerformanceMonitoring } from '../lib/analytics';

jest.mock('web-vitals', () => ({
  onCLS: jest.fn((cb) => cb({ name: 'CLS', value: 0.1, id: 'test-cls' })),
  onFCP: jest.fn((cb) => cb({ name: 'FCP', value: 1000, id: 'test-fcp' })),
  onINP: jest.fn((cb) => cb({ name: 'INP', value: 200, id: 'test-inp' })),
  onLCP: jest.fn((cb) => cb({ name: 'LCP', value: 2500, id: 'test-lcp' })),
  onTTFB: jest.fn((cb) => cb({ name: 'TTFB', value: 500, id: 'test-ttfb' })),
}));

global.fetch = jest.fn(() => Promise.resolve({} as Response));

global.console = {
  ...global.console,
  log: jest.fn(),
  error: jest.fn(),
};

class MockPerformanceObserver {
  callback: (list: any) => void;
  
  constructor(callback: (list: any) => void) {
    this.callback = callback;
  }
  
  observe() {
    this.callback({
      getEntries: () => [
        {
          entryType: 'resource',
          name: 'https://example.com/api',
          initiatorType: 'fetch',
          duration: 300,
        },
        {
          entryType: 'navigation',
          name: 'https://example.com',
          duration: 1200,
        },
        {
          entryType: 'longtask',
          name: 'self',
          duration: 100,
          startTime: 1000,
        },
      ],
    });
  }
}

Object.defineProperty(window, 'PerformanceObserver', {
  value: MockPerformanceObserver,
  writable: true,
});

const originalNodeEnv = process.env.NODE_ENV;
Object.defineProperty(process.env, 'NODE_ENV', {
  value: 'development',
  configurable: true,
});
Object.defineProperty(process.env, 'NEXT_PUBLIC_ANALYTICS_ENDPOINT', {
  value: 'https://example.com/analytics',
  configurable: true,
});

describe('Analytics Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('trackEvent', () => {
    it('should track an event', () => {
      trackEvent({
        category: 'User',
        action: 'Click',
        label: 'Button',
        value: 1,
      });
      
      expect(console.log).toHaveBeenCalledWith(
        'Analytics Event:',
        {
          category: 'User',
          action: 'Click',
          label: 'Button',
          value: 1,
        }
      );
      
      expect(fetch).toHaveBeenCalledWith(
        'https://example.com/analytics',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          keepalive: true,
        })
      );
    });
    
    it('should handle events without optional properties', () => {
      trackEvent({
        category: 'User',
        action: 'Click',
      });
      
      expect(console.log).toHaveBeenCalledWith(
        'Analytics Event:',
        {
          category: 'User',
          action: 'Click',
        }
      );
    });
  });
  
  describe('trackPageView', () => {
    it('should track a page view', () => {
      trackPageView('/home', 'Home Page');
      
      expect(console.log).toHaveBeenCalledWith(
        'Page View:',
        {
          url: '/home',
          title: 'Home Page',
        }
      );
      
      expect(fetch).toHaveBeenCalledWith(
        'https://example.com/analytics',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          keepalive: true,
        })
      );
    });
  });
  
  describe('initPerformanceMonitoring', () => {
    it('should initialize performance monitoring', () => {
      const { onCLS, onFCP, onINP, onLCP, onTTFB } = require('web-vitals');
      
      initPerformanceMonitoring();
      
      expect(onCLS).toHaveBeenCalled();
      expect(onFCP).toHaveBeenCalled();
      expect(onINP).toHaveBeenCalled();
      expect(onLCP).toHaveBeenCalled();
      expect(onTTFB).toHaveBeenCalled();
      
      expect(console.log).toHaveBeenCalledWith(
        'Performance Metric:',
        expect.objectContaining({
          name: 'resource-timing',
          value: 300,
          id: 'https://example.com/api',
        })
      );
      
      expect(console.log).toHaveBeenCalledWith(
        'Performance Metric:',
        expect.objectContaining({
          name: 'navigation-timing',
          value: 1200,
          id: 'navigation',
        })
      );
      
      expect(console.log).toHaveBeenCalledWith(
        'Performance Metric:',
        expect.objectContaining({
          name: 'long-task',
          value: 100,
          id: 'self-1000',
        })
      );
    });
  });
  
  describe('initAnalytics', () => {
    it('should initialize analytics', () => {
      Object.defineProperty(window, 'location', {
        value: {
          pathname: '/test',
        },
        writable: true,
      });
      
      Object.defineProperty(document, 'title', {
        value: 'Test Page',
        writable: true,
      });
      
      const addEventListener = jest.spyOn(window, 'addEventListener');
      
      initAnalytics();
      
      expect(addEventListener).toHaveBeenCalledWith('popstate', expect.any(Function));
      
      const popstateHandler = addEventListener.mock.calls[0][1] as EventListener;
      popstateHandler(new Event('popstate'));
      
      expect(console.log).toHaveBeenCalledWith(
        'Page View:',
        {
          url: '/test',
          title: 'Test Page',
        }
      );
    });
  });
});
