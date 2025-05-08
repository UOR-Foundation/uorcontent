import React from 'react';
import { render, screen, within } from '@testing-library/react';
import Navigation from '../components/Navigation';

// Mock the next/navigation module before importing it
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

import { usePathname } from 'next/navigation';

describe('Navigation Component', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (usePathname as jest.Mock).mockReturnValue('/');
  });

  it('should render all navigation items', () => {
    render(<Navigation />);
    
    expect(screen.getAllByText('Home')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Concepts')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Predicates')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Resources')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Topics')[0]).toBeInTheDocument();
  });

  it('should highlight the active navigation item', () => {
    (usePathname as jest.Mock).mockReturnValue('/concepts');
    
    const { container } = render(<Navigation />);
    
    // Use querySelector to get the desktop navigation links
    const desktopNav = container.querySelector('.sm\\:flex.sm\\:space-x-8') as HTMLElement;
    
    if (!desktopNav) {
      throw new Error('Desktop navigation not found');
    }
    
    const homeLink = within(desktopNav).getAllByText('Home')[0].closest('a');
    const conceptsLink = within(desktopNav).getAllByText('Concepts')[0].closest('a');
    
    expect(conceptsLink).toHaveClass('border-indigo-500');
    expect(conceptsLink).toHaveClass('text-gray-900');
    
    expect(homeLink).not.toHaveClass('border-indigo-500');
    expect(homeLink).toHaveClass('border-transparent');
  });

  it('should have the correct href attributes', () => {
    const { container } = render(<Navigation />);
    
    // Use querySelector to get the desktop navigation links
    const desktopNav = container.querySelector('.sm\\:flex.sm\\:space-x-8') as HTMLElement;
    
    if (!desktopNav) {
      throw new Error('Desktop navigation not found');
    }
    
    const homeLink = within(desktopNav).getAllByText('Home')[0].closest('a');
    const conceptsLink = within(desktopNav).getAllByText('Concepts')[0].closest('a');
    const predicatesLink = within(desktopNav).getAllByText('Predicates')[0].closest('a');
    const resourcesLink = within(desktopNav).getAllByText('Resources')[0].closest('a');
    const topicsLink = within(desktopNav).getAllByText('Topics')[0].closest('a');
    
    expect(homeLink).toHaveAttribute('href', '/');
    expect(conceptsLink).toHaveAttribute('href', '/concepts');
    expect(predicatesLink).toHaveAttribute('href', '/predicates');
    expect(resourcesLink).toHaveAttribute('href', '/resources');
    expect(topicsLink).toHaveAttribute('href', '/topics');
  });
});
