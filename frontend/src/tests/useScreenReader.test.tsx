import React from 'react';
import { render, screen } from '@testing-library/react';
import { useScreenReader } from '../hooks/useScreenReader';

function TestComponent() {
  const { announce, ScreenReaderAnnouncer } = useScreenReader();
  
  const announcePolite = () => {
    announce('This is a polite announcement');
  };
  
  const announceAssertive = () => {
    announce('This is an assertive announcement', 'assertive');
  };
  
  return (
    <div>
      <ScreenReaderAnnouncer />
      <button onClick={announcePolite} data-testid="polite-button">
        Announce Polite
      </button>
      <button onClick={announceAssertive} data-testid="assertive-button">
        Announce Assertive
      </button>
    </div>
  );
}

describe('useScreenReader', () => {
  it('should render screen reader announcer elements', () => {
    render(<TestComponent />);
    
    const politeAnnouncer = screen.getByTestId('screen-reader-polite');
    const assertiveAnnouncer = screen.getByTestId('screen-reader-assertive');
    
    expect(politeAnnouncer).toBeInTheDocument();
    expect(assertiveAnnouncer).toBeInTheDocument();
    
    expect(politeAnnouncer).toHaveAttribute('aria-live', 'polite');
    expect(assertiveAnnouncer).toHaveAttribute('aria-live', 'assertive');
    
    expect(politeAnnouncer).toHaveClass('sr-only');
    expect(assertiveAnnouncer).toHaveClass('sr-only');
  });
  
  it('should update polite announcer when announce is called with polite politeness', () => {
    render(<TestComponent />);
    
    const politeButton = screen.getByTestId('polite-button');
    const politeAnnouncer = screen.getByTestId('screen-reader-polite');
    
    expect(politeAnnouncer).toHaveTextContent('');
    
    politeButton.click();
    
    expect(politeAnnouncer).toHaveTextContent('This is a polite announcement');
  });
  
  it('should update assertive announcer when announce is called with assertive politeness', () => {
    render(<TestComponent />);
    
    const assertiveButton = screen.getByTestId('assertive-button');
    const assertiveAnnouncer = screen.getByTestId('screen-reader-assertive');
    
    expect(assertiveAnnouncer).toHaveTextContent('');
    
    assertiveButton.click();
    
    expect(assertiveAnnouncer).toHaveTextContent('This is an assertive announcement');
  });
});
