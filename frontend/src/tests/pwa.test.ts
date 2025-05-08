import { registerServiceWorker } from '../lib/serviceWorker';

Object.defineProperty(window, 'navigator', {
  value: {
    serviceWorker: {
      register: jest.fn().mockImplementation(() => Promise.resolve({
        scope: '/test-scope/',
      })),
    },
  },
  writable: true,
});

global.console = {
  ...global.console,
  log: jest.fn(),
  error: jest.fn(),
};

describe('PWA Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should register service worker on load', () => {
    const loadEvent = new Event('load');
    
    registerServiceWorker();
    
    window.dispatchEvent(loadEvent);
    
    expect(window.navigator.serviceWorker.register).toHaveBeenCalledWith('/service-worker.js');
  });
  
  it('should log successful registration', async () => {
    const loadEvent = new Event('load');
    
    registerServiceWorker();
    
    window.dispatchEvent(loadEvent);
    
    await Promise.resolve();
    
    expect(console.log).toHaveBeenCalledWith(
      'ServiceWorker registration successful with scope: ',
      '/test-scope/'
    );
  });
  
  it('should handle registration errors', async () => {
    window.navigator.serviceWorker.register = jest.fn().mockImplementation(() => 
      Promise.reject(new Error('Registration failed'))
    );
    
    const loadEvent = new Event('load');
    
    registerServiceWorker();
    
    window.dispatchEvent(loadEvent);
    
    await Promise.resolve();
    
    expect(console.error).toHaveBeenCalledWith(
      'ServiceWorker registration failed: ',
      new Error('Registration failed')
    );
  });
});
