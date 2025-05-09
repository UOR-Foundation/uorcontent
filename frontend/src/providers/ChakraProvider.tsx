'use client';

import React, { ReactNode } from 'react';
import { ChakraProvider as ChakraUIProvider, createContext } from '@chakra-ui/react';
import { CacheProvider } from '@chakra-ui/next-js';

const defaultContext = {
  colorMode: 'light',
  toggleColorMode: () => {},
  theme: {
    colors: {
      brand: {
        500: '#0080ff',
      }
    }
  }
};

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
