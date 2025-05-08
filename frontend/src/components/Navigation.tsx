'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LanguageSelector from './LanguageSelector';
import { useTranslation } from '../hooks/useTranslation';

interface NavigationItem {
  name: string;
  href: string;
  description: string;
}

export default function Navigation() {
  const pathname = usePathname();
  const { t } = useTranslation('navigation');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navigationItems: NavigationItem[] = [
    {
      name: t('navigation.home'),
      href: '/',
      description: t('app.title')
    },
    {
      name: t('navigation.concepts'),
      href: '/concepts',
      description: t('navigation.conceptsDescription', 'Browse and manage UOR concepts')
    },
    {
      name: t('navigation.predicates'),
      href: '/predicates',
      description: t('navigation.predicatesDescription', 'Browse and manage UOR predicates')
    },
    {
      name: t('navigation.resources'),
      href: '/resources',
      description: t('navigation.resourcesDescription', 'Browse and manage UOR resources')
    },
    {
      name: t('navigation.topics'),
      href: '/topics',
      description: t('navigation.topicsDescription', 'Browse and manage UOR topics')
    }
  ];
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-gray-900">{t('app.title', 'UOR Content')}</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      isActive
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            <LanguageSelector />
            <span className="text-sm text-gray-500">UOR Foundation</span>
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              onClick={toggleMobileMenu}
              data-testid="mobile-menu-button"
            >
              <span className="sr-only">{t('accessibility.toggleMenu', 'Toggle menu')}</span>
              <svg
                className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div 
        className={`${isMobileMenuOpen ? 'block' : 'hidden'} sm:hidden`} 
        id="mobile-menu"
      >
        <div className="pt-2 pb-3 space-y-1">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  isActive
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            );
          })}
          <div className="pl-3 pr-4 py-2">
            <LanguageSelector />
          </div>
        </div>
      </div>
    </nav>
  );
}
