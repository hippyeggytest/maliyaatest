/**
   * Utility functions for formatting grade names consistently
 */

/**
 * Convert numeric grade format to Arabic written format 
 * (e.g., "الصف 1" to "الصف الأول")
 */
export const formatGradeToArabic = (grade: string): string => {
  if (!grade) return '';
  
  return grade
    .replace('الصف 1', 'الصف الأول')
    .replace('الصف 2', 'الصف الثاني')
    .replace('الصف 3', 'الصف الثالث')
    .replace('الصف 4', 'الصف الرابع')
    .replace('الصف 5', 'الصف الخامس')
    .replace('الصف 6', 'الصف السادس')
    .replace('الصف 7', 'الصف السابع')
    .replace('الصف 8', 'الصف الثامن')
    .replace('الصف 9', 'الصف التاسع')
    .replace('الصف 10', 'الصف العاشر')
    .replace('الصف 11', 'الصف الحادي عشر')
    .replace('الصف 12', 'الصف الثاني عشر');
};

/**
 * Convert Arabic written format to numeric grade format
 * (e.g., "الصف الأول" to "الصف 1")
 */
export const formatGradeToNumeric = (grade: string): string => {
  if (!grade) return '';
  
  return grade
    .replace('الصف الأول', 'الصف 1')
    .replace('الصف الثاني', 'الصف 2')
    .replace('الصف الثالث', 'الصف 3')
    .replace('الصف الرابع', 'الصف 4')
    .replace('الصف الخامس', 'الصف 5')
    .replace('الصف السادس', 'الصف 6')
    .replace('الصف السابع', 'الصف 7')
    .replace('الصف الثامن', 'الصف 8')
    .replace('الصف التاسع', 'الصف 9')
    .replace('الصف العاشر', 'الصف 10')
    .replace('الصف الحادي عشر', 'الصف 11')
    .replace('الصف الثاني عشر', 'الصف 12');
};

/**
 * Get all available grade options for select dropdowns
 */
export const getFormattedGradeOptions = (): string[] => {
  return [
    'روضة أولى',
    'روضة ثانية',
    'التمهيدي',
    'الصف الأول',
    'الصف الثاني',
    'الصف الثالث',
    'الصف الرابع',
    'الصف الخامس',
    'الصف السادس',
    'الصف السابع',
    'الصف الثامن',
    'الصف التاسع',
    'الصف العاشر',
    'الصف الحادي عشر',
    'الصف الثاني عشر'
  ];
};

export default {
  formatGradeToArabic,
  formatGradeToNumeric,
  getFormattedGradeOptions
};
 