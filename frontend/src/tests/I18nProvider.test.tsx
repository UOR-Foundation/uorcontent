import React from 'react';
import { render, screen } from '@testing-library/react';
import { I18nProvider } from '../providers/I18nProvider';

jest.mock('../i18n/config', () => ({
  __esModule: true,
  default: {
    isInitialized: true,
    on: jest.fn(),
  },
}));

jest.mock('react-i18next', () => ({
  I18nextProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="i18next-provider">{children}</div>
  ),
}));

describe('I18nProvider', () => {
  it('should render children when i18n is initialized', () => {
    render(
      <I18nProvider>
        <div data-testid="test-child">Test Child</div>
      </I18nProvider>
    );
    
    const testChild = screen.getByTestId('test-child');
    expect(testChild).toBeInTheDocument();
    expect(testChild).toHaveTextContent('Test Child');
  });
  
  it('should wrap children in I18nextProvider', () => {
    render(
      <I18nProvider>
        <div>Test Child</div>
      </I18nProvider>
    );
    
    const i18nextProvider = screen.getByTestId('i18next-provider');
    expect(i18nextProvider).toBeInTheDocument();
  });
});
