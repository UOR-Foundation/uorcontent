import { renderHook, act } from '@testing-library/react';
import { useTranslation } from '../hooks/useTranslation';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: jest.fn((lang) => Promise.resolve(lang)),
      options: {
        supportedLngs: ['en', 'es', 'fr', 'de', 'ar'],
      },
    },
  }),
}));

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

Object.defineProperty(document, 'documentElement', {
  value: {
    lang: 'en',
    dir: 'ltr',
  },
  writable: true,
});

describe('useTranslation', () => {
  beforeEach(() => {
    localStorageMock.clear();
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
  });
  
  it('should return translation functions', () => {
    const { result } = renderHook(() => useTranslation());
    
    expect(result.current.t).toBeDefined();
    expect(result.current.i18n).toBeDefined();
    expect(result.current.changeLanguage).toBeDefined();
    expect(result.current.getCurrentLanguage).toBeDefined();
    expect(result.current.isCurrentLanguageRTL).toBeDefined();
    expect(result.current.getAvailableLanguages).toBeDefined();
  });
  
  it('should return current language', () => {
    const { result } = renderHook(() => useTranslation());
    
    expect(result.current.getCurrentLanguage()).toBe('en');
  });
  
  it('should return available languages', () => {
    const { result } = renderHook(() => useTranslation());
    
    expect(result.current.getAvailableLanguages()).toEqual(['en', 'es', 'fr', 'de', 'ar']);
  });
  
  it('should change language', () => {
    const { result } = renderHook(() => useTranslation());
    
    act(() => {
      result.current.changeLanguage('ar');
    });
    
    expect(result.current.i18n.changeLanguage).toHaveBeenCalledWith('ar');
    expect(localStorageMock.getItem('i18nextLng')).toBe('ar');
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
  });
  
  it('should detect RTL languages', () => {
    const { result } = renderHook(() => useTranslation());
    
    act(() => {
      result.current.changeLanguage('ar');
    });
    
    expect(result.current.isCurrentLanguageRTL()).toBe(true);
    
    act(() => {
      result.current.changeLanguage('en');
    });
    
    expect(result.current.isCurrentLanguageRTL()).toBe(false);
  });
});
