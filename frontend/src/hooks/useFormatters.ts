'use client';

import { useCallback } from 'react';
import { useTranslation } from './useTranslation';

/**
 * Custom hook for formatting dates, numbers, and currencies
 * @returns Formatting utilities
 */
export function useFormatters() {
  const { getCurrentLanguage } = useTranslation();

  /**
   * Format a date according to the current locale
   * @param date - Date to format
   * @param options - Intl.DateTimeFormat options
   * @returns Formatted date string
   */
  const formatDate = useCallback(
    (
      date: Date | number | string,
      options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    ): string => {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return new Intl.DateTimeFormat(getCurrentLanguage(), options).format(dateObj);
    },
    [getCurrentLanguage]
  );

  /**
   * Format a number according to the current locale
   * @param number - Number to format
   * @param options - Intl.NumberFormat options
   * @returns Formatted number string
   */
  const formatNumber = useCallback(
    (
      number: number,
      options: Intl.NumberFormatOptions = {
        maximumFractionDigits: 2,
      }
    ): string => {
      return new Intl.NumberFormat(getCurrentLanguage(), options).format(number);
    },
    [getCurrentLanguage]
  );

  /**
   * Format a currency amount according to the current locale
   * @param amount - Amount to format
   * @param currency - Currency code (e.g., 'USD', 'EUR')
   * @returns Formatted currency string
   */
  const formatCurrency = useCallback(
    (amount: number, currency = 'USD'): string => {
      return new Intl.NumberFormat(getCurrentLanguage(), {
        style: 'currency',
        currency,
      }).format(amount);
    },
    [getCurrentLanguage]
  );

  /**
   * Format a relative time according to the current locale
   * @param value - Time value
   * @param unit - Time unit
   * @returns Formatted relative time string
   */
  const formatRelativeTime = useCallback(
    (
      value: number,
      unit: Intl.RelativeTimeFormatUnit = 'day'
    ): string => {
      return new Intl.RelativeTimeFormat(getCurrentLanguage(), {
        numeric: 'auto',
      }).format(value, unit);
    },
    [getCurrentLanguage]
  );

  return {
    formatDate,
    formatNumber,
    formatCurrency,
    formatRelativeTime,
  };
}
