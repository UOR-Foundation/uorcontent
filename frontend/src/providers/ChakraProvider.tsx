'use client';

import React, { ReactNode } from 'react';
import { ChakraProvider as ChakraUIProvider } from '@chakra-ui/react';
import { CacheProvider } from '@chakra-ui/next-js';
import { defineConfig } from '@chakra-ui/react';

const theme = defineConfig({
  colors: {
    brand: {
      50: '#e6f7ff',
      100: '#b3e0ff',
      200: '#80caff',
      300: '#4db3ff',
      400: '#1a9dff',
      500: '#0080ff',
      600: '#0066cc',
      700: '#004d99',
      800: '#003366',
      900: '#001a33',
    },
  },
  fonts: {
    heading: 'var(--font-geist-sans)',
    body: 'var(--font-geist-sans)',
    mono: 'var(--font-geist-mono)',
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.800',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'medium',
        borderRadius: 'md',
      },
      variants: {
        solid: {
          bg: 'brand.500',
          color: 'white',
          _hover: {
            bg: 'brand.600',
          },
        },
        outline: {
          border: '1px solid',
          borderColor: 'brand.500',
          color: 'brand.500',
        },
      },
      defaultProps: {
        variant: 'solid',
      },
    },
    Heading: {
      baseStyle: {
        fontWeight: 'semibold',
      },
    },
  },
});

interface ChakraProviderProps {
  children: ReactNode;
}

export function ChakraProvider({ children }: ChakraProviderProps): React.ReactElement {
  return (
    <CacheProvider>
      <ChakraUIProvider config={theme}>
        {children}
      </ChakraUIProvider>
    </CacheProvider>
  );
}
