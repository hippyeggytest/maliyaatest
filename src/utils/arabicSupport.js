/**
  * Utilities for better Arabic language support in the application
 */

/**
 * Normalizes Arabic text to improve rendering and avoid encoding issues
 * @param {string} text - Arabic text to normalize
 * @returns {string} - Normalized text
 */
export const normalizeArabicText = (text) => {
  if (!text) return '';
  return text.normalize('NFKD');
};

/**
 * Formats a date to be displayed in Arabic format
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date
 */
export const formatArabicDate = (date) => {
  if (!date) return '';
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    calendar: 'gregory'
  };
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('ar-SA', options).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return typeof date === 'string' ? date : date.toISOString();
  }
};

/**
 * Formats a number as currency with Arabic numerals
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted amount
 */
export const formatArabicCurrency = (amount) => {
  if (typeof amount !== 'number') return '';
  
  try {
    return amount.toLocaleString('ar-SA', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }) + ' ريال';
  } catch (error) {
    console.error('Error formatting currency:', error);
    return amount + ' ريال';
  }
};

export default {
  normalizeArabicText,
  formatArabicDate,
  formatArabicCurrency
};
 