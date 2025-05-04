import  * as XLSX from 'xlsx';
import { Student, Fee } from '../types';
import db from '../db';

// Function to convert text to proper Arabic encoding for Excel
const convertToArabicFriendlyText = (text: string): string => {
  // Ensure proper Unicode representation for Arabic text
  return text;
};

// Import students from Excel or CSV file
export const importStudentsFromFile = async (file: File, schoolId: number): Promise<{
  students: Student[],
  studentFees: {studentName: string, fee: Partial<Fee>}[]
}> => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          if (!e.target || !e.target.result) {
            reject(new Error('Failed to read file'));
            return;
          }
          
          // Parse file based on file type
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON
          const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (rawData.length < 2) {
            reject(new Error('No data found in file or invalid format'));
            return;
          }
          
          // Check header row
          const headers = rawData[0] as string[];
          
          // Map header indices (case insensitive)
          const headerMap: {[key: string]: number} = {};
          for (let i = 0; i < headers.length; i++) {
            const header = String(headers[i]).toLowerCase().trim();
            if (header === 'name' || header === 'الاسم') headerMap['name'] = i;
            else if (header === 'grade' || header === 'الصف') headerMap['grade'] = i;
            else if (header === 'parentname' || header === 'اسم ولي الأمر') headerMap['parentName'] = i;
            else if (header === 'parentphone' || header === 'رقم الهاتف') headerMap['parentPhone'] = i;
            else if (header === 'usetransportation' || header === 'النقل المدرسي') headerMap['useTransportation'] = i;
            else if (header === 'transportationtype' || header === 'نوع النقل') headerMap['transportationType'] = i;
            else if (header === 'transportationfee' || header === 'رسوم النقل') headerMap['transportationFee'] = i;
            else if (header === 'busroute' || header === 'مسار الحافلة') headerMap['busRoute'] = i;
            else if (header === 'feename' || header === 'اسم الرسوم') headerMap['feeName'] = i;
            else if (header === 'feeamount' || header === 'مبلغ الرسوم') headerMap['feeAmount'] = i;
            else if (header === 'installments' || header === 'الأقساط') headerMap['installments'] = i;
          }
          
          // Check required columns
          const requiredColumns = ['name', 'grade', 'parentName', 'parentPhone'];
          const missingColumns = requiredColumns.filter(col => headerMap[col] === undefined);
          
          if (missingColumns.length > 0) {
            reject(new Error(`Missing required columns: ${missingColumns.join(', ')}`));
            return;
          }
          
          // Process data rows
          const students: Student[] = [];
          const studentFees: {studentName: string, fee: Partial<Fee>}[] = [];
          
          for (let i = 1; i < rawData.length; i++) {
            const row = rawData[i] as any[];
            if (!row || row.length === 0) continue;
            
            // Extract student data
            const name = row[headerMap['name']] ? String(row[headerMap['name']]).trim() : '';
            if (!name) continue; // Skip rows without a name
            
            // Process transportation settings
            let useTransportation = false;
            let transportationType = 'none';
            let transportationFee = 0;
            let busRoute = '';
            
            if (headerMap['useTransportation'] !== undefined) {
              const transportValue = row[headerMap['useTransportation']] ? 
                String(row[headerMap['useTransportation']]).toLowerCase().trim() : '';
              useTransportation = transportValue === 'true' || transportValue === 'yes' || 
                               transportValue === '1' || transportValue === 'نعم' || 
                               transportValue === 'صح';
            }
            
            if (useTransportation && headerMap['transportationType'] !== undefined) {
              const transportType = row[headerMap['transportationType']] ? 
                String(row[headerMap['transportationType']]).toLowerCase().trim() : '';
              if (transportType === 'one-way' || transportType === 'اتجاه واحد' || transportType === 'ذهاب فقط') {
                transportationType = 'one-way';
              } else if (transportType === 'two-way' || transportType === 'اتجاهان' || 
                         transportType === 'ذهاب وإياب' || transportType === 'ذهاب و إياب') {
                transportationType = 'two-way';
              }
            }
            
            if (useTransportation && headerMap['transportationFee'] !== undefined) {
              const fee = row[headerMap['transportationFee']];
              transportationFee = typeof fee === 'number' ? fee : 
                                parseFloat(String(fee).replace(/[^\d.-]/g, '') || '0');
            }
            
            if (useTransportation && headerMap['busRoute'] !== undefined) {
              busRoute = row[headerMap['busRoute']] ? String(row[headerMap['busRoute']]).trim() : '';
            }
            
            const grade = row[headerMap['grade']] ? String(row[headerMap['grade']]).trim() : '';
            const parentName = row[headerMap['parentName']] ? String(row[headerMap['parentName']]).trim() : '';
            const parentPhone = row[headerMap['parentPhone']] ? String(row[headerMap['parentPhone']]).trim() : '';
            
            // Create student object
            const student: Student = {
              name,
              grade,
              parentName,
              parentPhone,
              enrollmentDate: new Date().toISOString(),
              schoolId,
              useTransportation,
              transportationType,
              transportationFee,
              busRoute
            };
            
            students.push(student);
            
            // Check if fee data is available
            if (headerMap['feeName'] !== undefined && headerMap['feeAmount'] !== undefined) {
              const feeName = row[headerMap['feeName']] ? String(row[headerMap['feeName']]).trim() : '';
              const feeAmount = row[headerMap['feeAmount']];
              
              if (feeName && feeAmount) {
                const feeAmountValue = typeof feeAmount === 'number' ? feeAmount : 
                                    parseFloat(String(feeAmount).replace(/[^\d.-]/g, '') || '0');
                
                const installments = headerMap['installments'] !== undefined && row[headerMap['installments']] ? 
                  parseInt(String(row[headerMap['installments']])) || 1 : 1;
                
                studentFees.push({
                  studentName: name,
                  fee: {
                    name: feeName,
                    amount: feeAmountValue,
                    dueDate: new Date().toISOString(),
                    grade,
                    schoolId,
                    installments,
                    description: `رسوم مستوردة للطالب ${name}`
                  }
                });
              }
            }
          }
          
          resolve({ students, studentFees });
        } catch (error) {
          console.error('Error parsing file:', error);
          reject(error);
        }
      };
      
      reader.onerror = (error) => {
        console.error('File reading error:', error);
        reject(error);
      };
      
      // Read file as array buffer for better compatibility with XLSX
      reader.readAsArrayBuffer(file);
      
    } catch (error) {
      console.error('Import error:', error);
      reject(error);
    }
  });
};

// Save imported students and their fees to the database
export const saveImportedStudents = async (
  students: Student[], 
  studentFees: {studentName: string, fee: Partial<Fee>}[]
): Promise<{
  savedStudents: number,
  savedFees: number
}> => {
  try {
    // First, save all students
    const studentIds: {[name: string]: number} = {};
    
    for (const student of students) {
      const id = await db.students.add(student);
      studentIds[student.name] = id;
    }
    
    // Then, save all fees with proper student IDs
    let savedFees = 0;
    
    for (const item of studentFees) {
      const studentId = studentIds[item.studentName];
      
      if (studentId) {
        const feeId = await db.fees.add({
          ...item.fee,
          studentId
        } as Fee);
        
        // Create installments if specified
        if (item.fee.installments && item.fee.installments > 1 && item.fee.amount) {
          const installmentAmount = item.fee.amount / item.fee.installments;
          const baseDate = new Date(item.fee.dueDate || new Date());
          
          for (let i = 1; i <= item.fee.installments; i++) {
            const dueDate = new Date(baseDate);
            dueDate.setMonth(baseDate.getMonth() + (i - 1));
            
            await db.table('installments').add({
              feeId,
              studentId,
              schoolId: item.fee.schoolId,
              number: i,
              amount: installmentAmount,
              dueDate: dueDate.toISOString(),
              status: 'unpaid'
            });
          }
        }
        
        savedFees++;
      }
    }
    
    return {
      savedStudents: students.length,
      savedFees
    };
  } catch (error) {
    console.error('Error saving imported data:', error);
    throw error;
  }
};

// Export template for student import with Arabic support
export const exportStudentTemplate = async (): Promise<boolean> => {
  try {
    // Create template data with Arabic headers
    const templateData = [
      {
        'الاسم': 'محمد أحمد (مثال)',
        'الصف': 'الصف 1',
        'اسم ولي الأمر': 'أحمد محمد',
        'رقم الهاتف': '968-12345678',
        'النقل المدرسي': 'نعم',
        'نوع النقل': 'اتجاهان',
        'رسوم النقل': 1200,
        'مسار الحافلة': 'المسار 1',
        'اسم الرسوم': 'الرسوم الدراسية',
        'مبلغ الرسوم': 5000,
        'الأقساط': 2
      },
      {
        'الاسم': 'فاطمة علي (مثال)',
        'الصف': 'الصف 2',
        'اسم ولي الأمر': 'علي محمد',
        'رقم الهاتف': '968-87654321',
        'النقل المدرسي': 'نعم',
        'نوع النقل': 'اتجاه واحد',
        'رسوم النقل': 800,
        'مسار الحافلة': 'المسار 2',
        'اسم الرسوم': 'رسوم الأنشطة',
        'مبلغ الرسوم': 1000,
        'الأقساط': 1
      }
    ];
    
    // Create worksheet with RTL support
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    
    // Set RTL format for the worksheet
    if (!worksheet['!cols']) worksheet['!cols'] = [];
    
    // Set column widths
    const columnWidths = [
      { wch: 20 }, // الاسم
      { wch: 15 }, // الصف
      { wch: 20 }, // اسم ولي الأمر
      { wch: 15 }, // رقم الهاتف
      { wch: 10 }, // النقل المدرسي
      { wch: 10 }, // نوع النقل
      { wch: 10 }, // رسوم النقل
      { wch: 15 }, // مسار الحافلة
      { wch: 20 }, // اسم الرسوم
      { wch: 10 }, // مبلغ الرسوم
      { wch: 10 }  // الأقساط
    ];
    worksheet['!cols'] = columnWidths;
    
    // Create workbook with RTL properties
    const workbook = XLSX.utils.book_new();
    workbook.Workbook = workbook.Workbook || {};
    workbook.Workbook.Views = workbook.Workbook.Views || [];
    workbook.Workbook.Views[0] = { RTL: true };
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'قالب الطلاب');
    
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'قالب_استيراد_الطلاب.xlsx';
    link.click();
    
    // Clean up
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error creating template:', error);
    return false;
  }
};

// Export students to Excel file with Arabic support
export const exportStudentsToExcel = async (students: Student[]): Promise<boolean> => {
  try {
    // Create data with Arabic headers
    const studentsData = students.map(student => ({
      'الاسم': student.name,
      'الصف': student.grade,
      'اسم ولي الأمر': student.parentName,
      'رقم الهاتف': student.parentPhone,
      'النقل المدرسي': student.useTransportation ? 'نعم' : 'لا',
      'نوع النقل': student.transportationType === 'one-way' ? 'اتجاه واحد' : 
                    student.transportationType === 'two-way' ? 'اتجاهان' : 'لا يوجد',
      'رسوم النقل': student.transportationFee || 0,
      'مسار الحافلة': student.busRoute || ''
    }));
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(studentsData);
    
    // Set RTL format for the worksheet
    if (!worksheet['!cols']) worksheet['!cols'] = [];
    
    // Set column widths
    const columnWidths = [
      { wch: 20 }, // الاسم
      { wch: 15 }, // الصف
      { wch: 20 }, // اسم ولي الأمر
      { wch: 15 }, // رقم الهاتف
      { wch: 10 }, // النقل المدرسي
      { wch: 10 }, // نوع النقل
      { wch: 10 }, // رسوم النقل
      { wch: 15 }  // مسار الحافلة
    ];
    worksheet['!cols'] = columnWidths;
    
    // Create workbook with RTL properties
    const workbook = XLSX.utils.book_new();
    workbook.Workbook = workbook.Workbook || {};
    workbook.Workbook.Views = workbook.Workbook.Views || [];
    workbook.Workbook.Views[0] = { RTL: true };
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'الطلاب');
    
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `تصدير_الطلاب_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    
    // Clean up
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error exporting students to Excel:', error);
    return false;
  }
};
 