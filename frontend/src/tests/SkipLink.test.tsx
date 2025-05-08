import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SkipLink from '../components/SkipLink';

describe('SkipLink', () => {
  beforeEach(() => {
    const mainContent = document.createElement('div');
    mainContent.id = 'main-content';
    mainContent.setAttribute('tabIndex', '-1');
    document.body.appendChild(mainContent);
  });

  afterEach(() => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      document.body.removeChild(mainContent);
    }
  });

  it('should render with default label', () => {
    render(<SkipLink targetId="main-content" />);
    
    const skipLink = screen.getByText('Skip to main content');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveClass('skip-link');
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  it('should render with custom label', () => {
    render(<SkipLink targetId="main-content" label="Skip to content" />);
    
    const skipLink = screen.getByText('Skip to content');
    expect(skipLink).toBeInTheDocument();
  });

  it('should focus on target element when clicked', () => {
    render(<SkipLink targetId="main-content" />);
    
    const skipLink = screen.getByText('Skip to main content');
    const mainContent = document.getElementById('main-content');
    
    if (!mainContent) {
      throw new Error('Main content element not found');
    }
    
    const focusSpy = jest.spyOn(mainContent, 'focus');
    
    fireEvent.click(skipLink);
    
    expect(focusSpy).toHaveBeenCalled();
    
    focusSpy.mockRestore();
  });

  it('should focus on target element when Enter key is pressed', () => {
    render(<SkipLink targetId="main-content" />);
    
    const skipLink = screen.getByText('Skip to main content');
    const mainContent = document.getElementById('main-content');
    
    if (!mainContent) {
      throw new Error('Main content element not found');
    }
    
    const focusSpy = jest.spyOn(mainContent, 'focus');
    
    fireEvent.keyDown(skipLink, { key: 'Enter' });
    
    expect(focusSpy).toHaveBeenCalled();
    
    focusSpy.mockRestore();
  });

  it('should not throw error if target element does not exist', () => {
    render(<SkipLink targetId="non-existent-id" />);
    
    const skipLink = screen.getByText('Skip to main content');
    
    expect(() => {
      fireEvent.click(skipLink);
    }).not.toThrow();
  });
});
