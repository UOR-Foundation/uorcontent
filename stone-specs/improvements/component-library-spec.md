# Component Library Integration Specification

**Role**: PM  
**Date**: May 8, 2025  
**Feature**: Component Library Integration with Chakra UI  
**Branch**: devin/1746716283-frontend-improvements  

## Overview

This specification outlines the integration of Chakra UI as the component library for the UOR Content Management Client. Chakra UI will provide a comprehensive set of accessible, customizable, and reusable components that follow design best practices and improve the overall user experience.

## Requirements

1. **Core Functionality**
   - Integrate Chakra UI as the primary component library
   - Replace current custom components with Chakra UI equivalents
   - Implement a consistent theme across the application
   - Ensure proper integration with Next.js App Router

2. **Design Requirements**
   - Create a cohesive design system using Chakra UI's theming capabilities
   - Implement responsive design for all components
   - Support dark mode and light mode
   - Maintain visual consistency across all pages

3. **Accessibility Requirements**
   - Ensure all components meet WCAG 2.1 AA standards
   - Implement proper keyboard navigation
   - Add screen reader support
   - Provide proper color contrast

4. **Performance Requirements**
   - Minimize bundle size through selective imports
   - Implement code splitting for components
   - Optimize rendering performance
   - Reduce layout shifts during loading

## User Stories

### As a developer, I want to:

1. Use Chakra UI components to build consistent UIs quickly.
   ```tsx
   <Box p={4} shadow="md" borderWidth="1px">
     <Heading fontSize="xl">Dashboard</Heading>
     <Text mt={4}>Welcome to the UOR Content Management Client</Text>
   </Box>
   ```

2. Customize components using the theme to maintain consistency.
   ```tsx
   <Button colorScheme="brand" size="lg">Create Concept</Button>
   ```

3. Create responsive layouts using Chakra UI's responsive syntax.
   ```tsx
   <Flex direction={{ base: "column", md: "row" }} justify="space-between">
     <Box width={{ base: "100%", md: "30%" }}>Sidebar</Box>
     <Box width={{ base: "100%", md: "65%" }}>Main Content</Box>
   </Flex>
   ```

4. Implement accessible components without additional configuration.
   ```tsx
   <FormControl isRequired>
     <FormLabel htmlFor="name">Name</FormLabel>
     <Input id="name" placeholder="Enter name" />
     <FormHelperText>Enter the concept name</FormHelperText>
   </FormControl>
   ```

### As a user, I want to:

1. Experience a consistent and professional UI across all pages.
2. Navigate the application easily with intuitive components.
3. Use the application on different devices with responsive layouts.
4. Access all functionality with keyboard navigation and screen readers.

## Technical Specifications

### Chakra UI Integration

1. **Provider Setup**
   ```tsx
   // app/layout.tsx
   import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
   import theme from '../theme';

   export default function RootLayout({
     children,
   }: {
     children: React.ReactNode;
   }) {
     return (
       <html lang="en">
         <head>
           <ColorModeScript initialColorMode={theme.config.initialColorMode} />
         </head>
         <body>
           <ChakraProvider theme={theme}>
             {children}
           </ChakraProvider>
         </body>
       </html>
     );
   }
   ```

2. **Theme Configuration**
   ```tsx
   // theme/index.ts
   import { extendTheme } from '@chakra-ui/react';
   import { mode } from '@chakra-ui/theme-tools';

   const theme = extendTheme({
     colors: {
       brand: {
         50: '#e6f6ff',
         100: '#b3e0ff',
         500: '#0078d4',
         900: '#004578',
       },
     },
     fonts: {
       heading: 'var(--font-geist-sans)',
       body: 'var(--font-geist-sans)',
       mono: 'var(--font-geist-mono)',
     },
     config: {
       initialColorMode: 'light',
       useSystemColorMode: true,
     },
     styles: {
       global: (props) => ({
         body: {
           bg: mode('gray.50', 'gray.900')(props),
         },
       }),
     },
     components: {
       Button: {
         baseStyle: {
           fontWeight: 'semibold',
           borderRadius: 'md',
         },
         variants: {
           solid: (props) => ({
             bg: props.colorScheme === 'brand' ? 'brand.500' : undefined,
             color: 'white',
             _hover: {
               bg: props.colorScheme === 'brand' ? 'brand.600' : undefined,
             },
           }),
         },
       },
     },
   });

   export default theme;
   ```

3. **Component Migration**
   
   **Navigation Component**
   ```tsx
   // components/Navigation.tsx
   import { Box, Flex, HStack, Link, useColorModeValue, IconButton, useDisclosure, VStack, CloseButton } from '@chakra-ui/react';
   import { HamburgerIcon } from '@chakra-ui/icons';
   import NextLink from 'next/link';
   import { usePathname } from 'next/navigation';

   const Links = [
     { name: 'Home', href: '/' },
     { name: 'Concepts', href: '/concepts' },
     { name: 'Predicates', href: '/predicates' },
     { name: 'Resources', href: '/resources' },
     { name: 'Topics', href: '/topics' },
   ];

   export default function Navigation() {
     const { isOpen, onOpen, onClose } = useDisclosure();
     const pathname = usePathname();
     
     return (
       <Box bg={useColorModeValue('white', 'gray.800')} px={4} boxShadow="sm">
         <Flex h={16} alignItems="center" justifyContent="space-between">
           <IconButton
             size="md"
             icon={<HamburgerIcon />}
             aria-label="Open Menu"
             display={{ md: 'none' }}
             onClick={onOpen}
           />
           <HStack spacing={8} alignItems="center">
             <Box fontWeight="bold">UOR Content</Box>
             <HStack as="nav" spacing={4} display={{ base: 'none', md: 'flex' }}>
               {Links.map((link) => (
                 <Link
                   key={link.name}
                   as={NextLink}
                   href={link.href}
                   px={2}
                   py={1}
                   rounded="md"
                   fontWeight={pathname === link.href ? 'semibold' : 'normal'}
                   color={pathname === link.href ? 'brand.500' : useColorModeValue('gray.600', 'gray.200')}
                   _hover={{
                     textDecoration: 'none',
                     bg: useColorModeValue('gray.100', 'gray.700'),
                   }}
                 >
                   {link.name}
                 </Link>
               ))}
             </HStack>
           </HStack>
         </Flex>

         {isOpen ? (
           <Box pb={4} display={{ md: 'none' }}>
             <Flex justify="flex-end">
               <CloseButton onClick={onClose} />
             </Flex>
             <VStack as="nav" spacing={4} align="start">
               {Links.map((link) => (
                 <Link
                   key={link.name}
                   as={NextLink}
                   href={link.href}
                   w="full"
                   px={2}
                   py={1}
                   rounded="md"
                   fontWeight={pathname === link.href ? 'semibold' : 'normal'}
                   color={pathname === link.href ? 'brand.500' : useColorModeValue('gray.600', 'gray.200')}
                   _hover={{
                     textDecoration: 'none',
                     bg: useColorModeValue('gray.100', 'gray.700'),
                   }}
                   onClick={onClose}
                 >
                   {link.name}
                 </Link>
               ))}
             </VStack>
           </Box>
         ) : null}
       </Box>
     );
   }
   ```

   **ContentList Component**
   ```tsx
   // components/ContentList.tsx
   import { Box, Heading, Text, VStack, Spinner, Alert, AlertIcon, AlertTitle, AlertDescription, Divider } from '@chakra-ui/react';
   import { useQuery } from '@tanstack/react-query';
   import { fetchConcepts, fetchPredicates, fetchResources, fetchTopics } from '../api/queries';

   interface ContentListProps {
     contentType: 'concepts' | 'predicates' | 'resources' | 'topics';
     title: string;
   }

   interface ContentItem {
     id: string;
     name: string;
     description?: string;
   }

   export default function ContentList({ contentType, title }: ContentListProps) {
     const fetchFunctions = {
       concepts: fetchConcepts,
       predicates: fetchPredicates,
       resources: fetchResources,
       topics: fetchTopics,
     };

     const { data, isLoading, error } = useQuery({
       queryKey: [contentType],
       queryFn: fetchFunctions[contentType],
     });

     if (isLoading) {
       return (
         <Box p={4}>
           <Heading size="md" mb={4}>{title}</Heading>
           <Box textAlign="center" py={10}>
             <Spinner size="xl" color="brand.500" />
             <Text mt={4}>Loading {contentType}...</Text>
           </Box>
         </Box>
       );
     }

     if (error) {
       return (
         <Box p={4}>
           <Heading size="md" mb={4}>{title}</Heading>
           <Alert status="error" variant="left-accent" borderRadius="md">
             <AlertIcon />
             <Box>
               <AlertTitle>Error</AlertTitle>
               <AlertDescription>{error instanceof Error ? error.message : String(error)}</AlertDescription>
             </Box>
           </Alert>
         </Box>
       );
     }

     return (
       <Box p={4}>
         <Heading size="md" mb={4}>{title}</Heading>
         {data && data.length === 0 ? (
           <Text color="gray.500">No {contentType} found.</Text>
         ) : (
           <VStack spacing={4} align="stretch" divider={<Divider />}>
             {data && data.map((item: ContentItem) => (
               <Box key={item.id} p={4} borderWidth="1px" borderRadius="md" shadow="sm">
                 <Heading size="sm">{item.name}</Heading>
                 {item.description && (
                   <Text mt={2} color="gray.600">{item.description}</Text>
                 )}
                 <Text fontSize="xs" color="gray.400" mt={2}>ID: {item.id}</Text>
               </Box>
             ))}
           </VStack>
         )}
       </Box>
     );
   }
   ```

## Implementation Plan

1. **Phase 1: Setup and Configuration**
   - Install Chakra UI dependencies
   - Configure ChakraProvider
   - Set up theme configuration
   - Add color mode support

2. **Phase 2: Theme Development**
   - Create custom theme extending Chakra UI's default theme
   - Define color palette
   - Configure typography
   - Set up component variants

3. **Phase 3: Component Migration**
   - Migrate Navigation component to Chakra UI
   - Update ContentList component
   - Refactor page layouts
   - Implement responsive design

4. **Phase 4: Advanced Components**
   - Create form components with Chakra UI
   - Implement modals and dialogs
   - Add toast notifications
   - Create data visualization components

5. **Phase 5: Testing and Validation**
   - Test components across different screen sizes
   - Validate accessibility with automated tools
   - Ensure theme consistency
   - Verify performance metrics

## Success Criteria

1. All components successfully migrated to Chakra UI
2. Consistent theme applied across the application
3. Responsive design working on all screen sizes
4. Accessibility standards met (WCAG 2.1 AA)
5. Dark mode and light mode support
6. Improved user experience with professional UI
7. Zero linting warnings or errors
8. Comprehensive test coverage for all components

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Increased bundle size | Use tree-shaking and selective imports |
| Breaking changes in component interfaces | Provide backward compatibility layer during migration |
| Accessibility issues | Use Chakra UI's built-in accessibility features and test with screen readers |
| Performance degradation | Implement code splitting and optimize rendering |

## Dependencies

- @chakra-ui/react: ^2.8.0
- @chakra-ui/next-js: ^2.2.0
- @emotion/react: ^11.11.0
- @emotion/styled: ^11.11.0
- framer-motion: ^10.16.0

## References

- [Chakra UI Documentation](https://chakra-ui.com/docs/getting-started)
- [Chakra UI + Next.js Integration](https://chakra-ui.com/getting-started/nextjs-guide)
- [Chakra UI Theming](https://chakra-ui.com/docs/styled-system/theming/theme)
- [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/)
