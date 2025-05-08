import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LanguageSelector from '../components/LanguageSelector';

jest.mock('../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'language.en': 'English',
        'language.es': 'Spanish',
        'language.fr': 'French',
        'language.de': 'German',
        'language.ar': 'Arabic',
      };
      return translations[key] || key;
    },
    changeLanguage: jest.fn(),
    getCurrentLanguage: () => 'en',
    getAvailableLanguages: () => ['en', 'es', 'fr', 'de', 'ar'],
  }),
}));

describe('LanguageSelector', () => {
  it('should render with current language', () => {
    render(<LanguageSelector />);
    
    const languageButton = screen.getByRole('button', { name: /English/i });
    expect(languageButton).toBeInTheDocument();
  });
  
  it('should open dropdown when clicked', () => {
    render(<LanguageSelector />);
    
    const languageButton = screen.getByRole('button', { name: /English/i });
    fireEvent.click(languageButton);
    
    const dropdown = screen.getByRole('menu');
    expect(dropdown).toBeInTheDocument();
    
    const languageOptions = screen.getAllByRole('menuitem');
    expect(languageOptions).toHaveLength(5);
    
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Spanish')).toBeInTheDocument();
    expect(screen.getByText('French')).toBeInTheDocument();
    expect(screen.getByText('German')).toBeInTheDocument();
    expect(screen.getByText('Arabic')).toBeInTheDocument();
  });
  
  it('should call changeLanguage when a language is selected', () => {
    const { changeLanguage } = jest.requireMock('../hooks/useTranslation').useTranslation();
    
    render(<LanguageSelector />);
    
    const languageButton = screen.getByRole('button', { name: /English/i });
    fireEvent.click(languageButton);
    
    const spanishOption = screen.getByText('Spanish');
    fireEvent.click(spanishOption);
    
    expect(changeLanguage).toHaveBeenCalledWith('es');
  });
  
  it('should close dropdown after selecting a language', () => {
    render(<LanguageSelector />);
    
    const languageButton = screen.getByRole('button', { name: /English/i });
    fireEvent.click(languageButton);
    
    const spanishOption = screen.getByText('Spanish');
    fireEvent.click(spanishOption);
    
    const dropdown = screen.queryByRole('menu');
    expect(dropdown).not.toBeInTheDocument();
  });
});
