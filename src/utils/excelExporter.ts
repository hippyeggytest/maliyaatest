/**
  * Utility functions for exporting data to Excel format with proper Arabic support
 */

import * as XLSX from 'xlsx';
import { normalizeArabicText } from './arabicSupport';

/**
 * Exports data to an Excel file with proper RTL and Arabic support
 * @param data - Array of objects to export
 * @param filename - Name for the exported file (without extension)
 * @param sheetName - Name for the Excel sheet
 */
export const exportToExcel = (
  data: any[],
  filename: string = 'exported-data',
  sheetName: string = 'البيانات'
): void => {
  try {
    // Normalize Arabic text for better rendering
    const normalizedData = data.map(item => {
      const normalizedItem: Record<string, any> = {};
      for (const key in item) {
        if (typeof item[key] === 'string') {
          normalizedItem[key] = normalizeArabicText(item[key]);
        } else {
          normalizedItem[key] = item[key];
        }
      }
      return normalizedItem;
    });

    // Create worksheet with RTL direction
    const worksheet = XLSX.utils.json_to_sheet(normalizedData);
    
    // Set RTL direction for the sheet
    if (!worksheet['!cols']) {
      worksheet['!cols'] = [];
    }

    // Create workbook with RTL properties
    const workbook = XLSX.utils.book_new();
    workbook.Workbook = workbook.Workbook || {};
    workbook.Workbook.Views = workbook.Workbook.Views || [];
    workbook.Workbook.Views[0] = { RTL: true };
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, normalizeArabicText(sheetName));
    
    // Generate Excel file and trigger download
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.xlsx`;
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
};

/**
 * Creates and exports an Excel template file with sample data and columns
 * @param headers - Object mapping header keys to Arabic display names
 * @param sampleData - Array of sample data objects
 * @param filename - Name for the template file
 * @param sheetName - Name for the Excel sheet
 */
export const exportTemplate = (
  headers: Record<string, string>,
  sampleData: any[],
  filename: string = 'template',
  sheetName: string = 'القالب'
): void => {
  try {
    // Create formatted data with Arabic headers
    const formattedData = sampleData.map(item => {
      const formattedItem: Record<string, any> = {};
      for (const key in headers) {
        if (item[key] !== undefined) {
          formattedItem[normalizeArabicText(headers[key])] = 
            typeof item[key] === 'string' ? normalizeArabicText(item[key]) : item[key];
        } else {
          formattedItem[normalizeArabicText(headers[key])] = '';
        }
      }
      return formattedItem;
    });

    // Export to Excel
    exportToExcel(formattedData, filename, sheetName);
  } catch (error) {
    console.error('Error exporting template:', error);
    throw error;
  }
};

export default {
  exportToExcel,
  exportTemplate
};
 