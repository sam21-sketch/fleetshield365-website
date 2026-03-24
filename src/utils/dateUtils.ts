/**
 * Australian Date/Time Utilities for Website
 * 
 * All dates stored in UTC, displayed in Australia/Sydney timezone
 * Format: DD/MM/YYYY with 24-hour time
 */

// Timezone constant - enforces Australian Eastern Time
const AU_TIMEZONE = 'Australia/Sydney';

/**
 * Format date to DD/MM/YYYY (Sydney timezone)
 */
export const formatDateAU = (dateInput: string | Date | undefined | null): string => {
  if (!dateInput) return '-';
  
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return '-';
    
    return date.toLocaleDateString('en-AU', {
      timeZone: AU_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
};

/**
 * Format date to DD/MM/YYYY HH:MM (24-hour, Sydney timezone)
 */
export const formatDateTimeAU = (dateInput: string | Date | undefined | null): string => {
  if (!dateInput) return '-';
  
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return '-';
    
    const dateStr = date.toLocaleDateString('en-AU', {
      timeZone: AU_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    
    const timeStr = date.toLocaleTimeString('en-AU', {
      timeZone: AU_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    
    return `${dateStr} ${timeStr}`;
  } catch {
    return '-';
  }
};

/**
 * Format date to short format: 23 Mar 2026 (Sydney timezone)
 */
export const formatDateShortAU = (dateInput: string | Date | undefined | null): string => {
  if (!dateInput) return '-';
  
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return '-';
    
    return date.toLocaleDateString('en-AU', {
      timeZone: AU_TIMEZONE,
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
};

/**
 * Format time only: 14:30 (24-hour, Sydney timezone)
 */
export const formatTimeAU = (dateInput: string | Date | undefined | null): string => {
  if (!dateInput) return '-';
  
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return '-';
    
    return date.toLocaleTimeString('en-AU', {
      timeZone: AU_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return '-';
  }
};

/**
 * Format for display in tables/lists: DD/MM/YYYY HH:MM
 */
export const formatForDisplay = (dateInput: string | Date | undefined | null): string => {
  return formatDateTimeAU(dateInput);
};

/**
 * Format currency: $1,234.56
 */
export const formatCurrencyAU = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null) return '$0.00';
  
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount);
};

/**
 * Format number with commas: 1,234,567
 */
export const formatNumberAU = (num: number | undefined | null): string => {
  if (num === undefined || num === null) return '0';
  
  return new Intl.NumberFormat('en-AU').format(num);
};

export default {
  formatDateAU,
  formatDateTimeAU,
  formatDateShortAU,
  formatTimeAU,
  formatForDisplay,
  formatCurrencyAU,
  formatNumberAU,
};
