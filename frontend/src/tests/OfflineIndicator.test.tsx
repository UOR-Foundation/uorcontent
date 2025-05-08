import React from 'react';
import { render, screen } from '@testing-library/react';
import OfflineIndicator from '../components/OfflineIndicator';
import { useOfflineStatus } from '../hooks/useOfflineStatus';

jest.mock('../hooks/useOfflineStatus');

describe('OfflineIndicator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should render nothing when online', () => {
    (useOfflineStatus as jest.Mock).mockReturnValue(false);
    
    render(<OfflineIndicator />);
    
    const indicator = screen.queryByText('Offline Mode');
    expect(indicator).not.toBeInTheDocument();
  });
  
  it('should render the offline indicator when offline', () => {
    (useOfflineStatus as jest.Mock).mockReturnValue(true);
    
    render(<OfflineIndicator />);
    
    const indicator = screen.getByText('Offline Mode');
    expect(indicator).toBeInTheDocument();
    
    const container = indicator.closest('div');
    expect(container).toHaveClass('fixed');
    expect(container).toHaveClass('bottom-4');
    expect(container).toHaveClass('right-4');
    expect(container).toHaveClass('bg-orange-500');
    
    expect(container).toHaveAttribute('role', 'status');
    expect(container).toHaveAttribute('aria-live', 'polite');
  });
});
