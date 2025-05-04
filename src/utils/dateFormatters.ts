/**
  * Utility functions for handling date formatting consistently throughout the application
 */

/**
 * Ensures date is formatted in Georgian calendar format (Gregorian)
 * @param date The date to format
 * @returns Formatted date string
 */
export const formatGeorgianDate = (date: string | Date): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Format to Georgian/Gregorian date with Arabic numerals but western month names
  return dateObj.toLocaleDateString('ar', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    calendar: 'gregory'
  });
};

/**
 * Format date for input fields (YYYY-MM-DD)
 */
export const formatDateForInput = (date: string | Date): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString().split('T')[0];
};

/**
 * Format date for display in the UI
 */
export const formatDisplayDate = (date: string | Date): string => {
  return formatGeorgianDate(date);
};

/**
 * Format date for API requests
 */
export const formatDateForAPI = (date: string | Date): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString();
};

export default {
  formatGeorgianDate,
  formatDateForInput,
  formatDisplayDate,
  formatDateForAPI
};
 