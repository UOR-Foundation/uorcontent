'use client';

import React from 'react';

interface SkipLinkProps {
  targetId: string;
  label?: string;
}

/**
 * Skip link component for keyboard navigation
 * Allows keyboard users to skip navigation and go directly to main content
 */
export default function SkipLink({ targetId, label = 'Skip to main content' }: SkipLinkProps): React.ReactElement {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.tabIndex = -1;
      target.focus();
      setTimeout(() => {
        if (target) {
          target.removeAttribute('tabIndex');
        }
      }, 100);
    }
  };

  return (
    <a 
      href={`#${targetId}`}
      className="skip-link"
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          handleClick(e as unknown as React.MouseEvent<HTMLAnchorElement>);
        }
      }}
    >
      {label}
    </a>
  );
}
