import React from 'react';
import { render, screen } from '@testing-library/react';
import Navigation from '../components/Navigation';

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
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Concepts')).toBeInTheDocument();
    expect(screen.getByText('Predicates')).toBeInTheDocument();
    expect(screen.getByText('Resources')).toBeInTheDocument();
    expect(screen.getByText('Topics')).toBeInTheDocument();
  });

  it('should highlight the active navigation item', () => {
    (usePathname as jest.Mock).mockReturnValue('/concepts');
    
    render(<Navigation />);
    
    const homeLink = screen.getByText('Home').closest('a');
    const conceptsLink = screen.getByText('Concepts').closest('a');
    
    expect(conceptsLink).toHaveClass('border-indigo-500');
    expect(conceptsLink).toHaveClass('text-gray-900');
    
    expect(homeLink).not.toHaveClass('border-indigo-500');
    expect(homeLink).toHaveClass('border-transparent');
  });

  it('should have the correct href attributes', () => {
    render(<Navigation />);
    
    const homeLink = screen.getByText('Home').closest('a');
    const conceptsLink = screen.getByText('Concepts').closest('a');
    const predicatesLink = screen.getByText('Predicates').closest('a');
    const resourcesLink = screen.getByText('Resources').closest('a');
    const topicsLink = screen.getByText('Topics').closest('a');
    
    expect(homeLink).toHaveAttribute('href', '/');
    expect(conceptsLink).toHaveAttribute('href', '/concepts');
    expect(predicatesLink).toHaveAttribute('href', '/predicates');
    expect(resourcesLink).toHaveAttribute('href', '/resources');
    expect(topicsLink).toHaveAttribute('href', '/topics');
  });
});
