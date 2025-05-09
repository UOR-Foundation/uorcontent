import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useFocusManagement } from '../hooks/useFocusManagement';

function TestComponent() {
  const { FocusTrap, setFocus, returnFocus } = useFocusManagement();
  
  return (
    <div>
      <button 
        id="outside-button" 
        data-testid="outside-button"
      >
        Outside Button
      </button>
      
      <FocusTrap>
        <div data-testid="focus-trap">
          <button 
            id="first-button" 
            data-testid="first-button"
          >
            First Button
          </button>
          <button 
            id="second-button" 
            data-testid="second-button"
          >
            Second Button
          </button>
          <button 
            id="third-button" 
            data-testid="third-button"
          >
            Third Button
          </button>
        </div>
      </FocusTrap>
      
      <button 
        data-testid="set-focus-button"
        onClick={() => setFocus('second-button')}
      >
        Set Focus
      </button>
      
      <button 
        data-testid="return-focus-button"
        onClick={returnFocus}
      >
        Return Focus
      </button>
    </div>
  );
}

describe('useFocusManagement', () => {
  it('should render the focus trap with children', () => {
    render(<TestComponent />);
    
    const focusTrap = screen.getByTestId('focus-trap');
    const firstButton = screen.getByTestId('first-button');
    const secondButton = screen.getByTestId('second-button');
    const thirdButton = screen.getByTestId('third-button');
    
    expect(focusTrap).toBeInTheDocument();
    expect(firstButton).toBeInTheDocument();
    expect(secondButton).toBeInTheDocument();
    expect(thirdButton).toBeInTheDocument();
  });
  
  it('should set focus to a specific element when setFocus is called', () => {
    render(<TestComponent />);
    
    const setFocusButton = screen.getByTestId('set-focus-button');
    const secondButton = screen.getByTestId('second-button');
    
    const focusSpy = jest.spyOn(secondButton, 'focus');
    
    fireEvent.click(setFocusButton);
    
    expect(focusSpy).toHaveBeenCalled();
    
    focusSpy.mockRestore();
  });
  
  it('should trap focus within the focus trap component', () => {
    render(<TestComponent />);
    
    const firstButton = screen.getByTestId('first-button');
    
    firstButton.focus();
    
    fireEvent.keyDown(document.activeElement || document.body, { key: 'Tab' });
    
    expect(document.activeElement).toHaveAttribute('id', 'second-button');
    
    fireEvent.keyDown(document.activeElement || document.body, { key: 'Tab' });
    
    expect(document.activeElement).toHaveAttribute('id', 'third-button');
    
    fireEvent.keyDown(document.activeElement || document.body, { key: 'Tab' });
    
    expect(document.activeElement).toHaveAttribute('id', 'first-button');
    
    fireEvent.keyDown(document.activeElement || document.body, { key: 'Tab', shiftKey: true });
    
    expect(document.activeElement).toHaveAttribute('id', 'third-button');
  });
});
