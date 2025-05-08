import { renderHook, act } from '@testing-library/react';
import { useOfflineStatus } from '../hooks/useOfflineStatus';

describe('useOfflineStatus', () => {
  const originalOnLine = window.navigator.onLine;
  
  const mockAddEventListener = jest.fn();
  const mockRemoveEventListener = jest.fn();
  
  beforeEach(() => {
    mockAddEventListener.mockReset();
    mockRemoveEventListener.mockReset();
    
    window.addEventListener = mockAddEventListener;
    window.removeEventListener = mockRemoveEventListener;
  });
  
  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: originalOnLine,
    });
    
    window.addEventListener = window.addEventListener;
    window.removeEventListener = window.removeEventListener;
  });
  
  it('should return the current online status', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
    
    const { result } = renderHook(() => useOfflineStatus());
    
    expect(result.current).toBe(false); // Not offline
  });
  
  it('should return offline status when navigator.onLine is false', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });
    
    const { result } = renderHook(() => useOfflineStatus());
    
    expect(result.current).toBe(true); // Offline
  });
  
  it('should add event listeners for online and offline events', () => {
    renderHook(() => useOfflineStatus());
    
    expect(mockAddEventListener).toHaveBeenCalledTimes(2);
    expect(mockAddEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(mockAddEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
  });
  
  it('should remove event listeners on unmount', () => {
    const { unmount } = renderHook(() => useOfflineStatus());
    
    unmount();
    
    expect(mockRemoveEventListener).toHaveBeenCalledTimes(2);
    expect(mockRemoveEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(mockRemoveEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
  });
  
  it('should update status when online event is triggered', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });
    
    const { result } = renderHook(() => useOfflineStatus());
    
    expect(result.current).toBe(true);
    
    const onlineHandler = mockAddEventListener.mock.calls.find(
      call => call[0] === 'online'
    )[1];
    
    act(() => {
      onlineHandler();
    });
    
    expect(result.current).toBe(false); // Not offline
  });
  
  it('should update status when offline event is triggered', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
    
    const { result } = renderHook(() => useOfflineStatus());
    
    expect(result.current).toBe(false); // Not offline
    
    const offlineHandler = mockAddEventListener.mock.calls.find(
      call => call[0] === 'offline'
    )[1];
    
    act(() => {
      offlineHandler();
    });
    
    expect(result.current).toBe(true); // Offline
  });
});
