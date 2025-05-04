/**
  * Format a number as currency in Saudi Riyal (SAR)
 */
export const formatCurrency = (amount: number): string => {
  return `${amount.toLocaleString('ar-SA')} ريال`;
};

/**
 * Format a date to Arabic local format
 */
export const formatDate = (date: string | Date): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('ar-SA');
};

/**
 * Format a user's role to a readable Arabic string
 */
export const formatUserRole = (role: string): string => {
  switch (role) {
    case 'admin':
      return 'مدير النظام';
    case 'main-supervisor':
      return 'مشرف رئيسي';
    case 'grade-supervisor':
      return 'مشرف صفوف';
    default:
      return role;
  }
};

/**
 * Format a school status to a readable Arabic string
 */
export const formatSchoolStatus = (status: string): string => {
  switch (status) {
    case 'active':
      return 'نشط';
    case 'inactive':
      return 'غير نشط';
    case 'pending':
      return 'قيد المعالجة';
    default:
      return status;
  }
};

/**
 * Format transportation type to Arabic
 */
export const formatTransportationType = (type: string | undefined): string => {
  switch (type) {
    case 'none':
      return 'لا يوجد';
    case 'one-way':
      return 'اتجاه واحد';
    case 'two-way':
      return 'اتجاهان';
    default:
      return 'لا يوجد';
  }
};

/**
 * Format payment status to Arabic
 */
export const formatPaymentStatus = (status: string): string => {
  switch (status) {
    case 'paid':
      return 'مدفوع';
    case 'unpaid':
      return 'غير مدفوع';
    case 'partial':
      return 'مدفوع جزئياً';
    case 'overdue':
      return 'متأخر';
    case 'pending':
      return 'قيد الانتظار';
    default:
      return status;
  }
};

/**
 * Format a date to YYY-MM-DD
 */
export const formatDateForInput = (date: string | Date): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString().split('T')[0];
};
 