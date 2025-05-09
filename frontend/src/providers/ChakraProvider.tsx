'use client';

import React, { ReactNode } from 'react';
import { CacheProvider } from '@chakra-ui/next-js';

interface ChakraProviderProps {
  children: ReactNode;
}

export function ChakraProvider({ children }: ChakraProviderProps): React.ReactElement {
  return (
    <CacheProvider>
      {children}
    </CacheProvider>
  );
}
