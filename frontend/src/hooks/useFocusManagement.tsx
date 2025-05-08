'use client';

import React, { useRef, useEffect, useState } from 'react';

interface FocusManagementHook {
  FocusTrap: React.FC<FocusTrapProps>;
  setFocus: (elementId: string) => void;
  returnFocus: () => void;
}

interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
  initialFocusId?: string;
  returnFocusOnDeactivate?: boolean;
}

/**
 * Hook for managing focus in modals and dialogs
 * @returns Object with FocusTrap component and focus management functions
 */
export function useFocusManagement(): FocusManagementHook {
  const previousFocusRef = useRef<HTMLElement | null>(null);
  
  useEffect(() => {
    return () => {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, []);
  
  /**
   * Set focus to a specific element by ID
   * @param elementId - The ID of the element to focus
   */
  const setFocus = (elementId: string) => {
    if (typeof document === 'undefined') return;
    
    const element = document.getElementById(elementId);
    if (element) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      element.focus();
    }
  };
  
  /**
   * Return focus to the previously focused element
   */
  const returnFocus = () => {
    if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  };
  
  /**
   * Component that traps focus within its children
   */
  const FocusTrap: React.FC<FocusTrapProps> = ({
    children,
    active = true,
    initialFocusId,
    returnFocusOnDeactivate = true,
  }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [focusableElements, setFocusableElements] = useState<HTMLElement[]>([]);
    
    useEffect(() => {
      if (!active || !containerRef.current) return;
      
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
      const elements = Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(selector)
      ).filter(el => !el.hasAttribute('disabled') && el.getAttribute('tabindex') !== '-1');
      
      setFocusableElements(elements);
      
      if (initialFocusId) {
        const initialFocusElement = document.getElementById(initialFocusId);
        if (initialFocusElement) {
          initialFocusElement.focus();
        } else if (elements.length > 0) {
          elements[0].focus();
        }
      } else if (elements.length > 0) {
        elements[0].focus();
      }
    }, [active, initialFocusId]);
    
    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (!active || focusableElements.length === 0) return;
      
      if (event.key === 'Tab') {
        const currentFocusIndex = focusableElements.indexOf(
          document.activeElement as HTMLElement
        );
        
        if (event.shiftKey && currentFocusIndex === 0) {
          event.preventDefault();
          focusableElements[focusableElements.length - 1].focus();
        }
        else if (!event.shiftKey && currentFocusIndex === focusableElements.length - 1) {
          event.preventDefault();
          focusableElements[0].focus();
        }
      }
      
      if (event.key === 'Escape' && returnFocusOnDeactivate) {
        returnFocus();
      }
    };
    
    useEffect(() => {
      if (!active && returnFocusOnDeactivate) {
        returnFocus();
      }
    }, [active, returnFocusOnDeactivate]);
    
    return (
      <div ref={containerRef} onKeyDown={handleKeyDown}>
        {children}
      </div>
    );
  };
  
  return {
    FocusTrap,
    setFocus,
    returnFocus,
  };
}
