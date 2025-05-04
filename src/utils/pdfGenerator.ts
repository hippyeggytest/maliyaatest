import  { formatGeorgianDate } from './dateFormatters';

// Interface for Receipt Data
export interface ReceiptData {
  receiptNumber: string;
  date: string;
  schoolName: string;
  schoolLogo?: string;
  studentName: string;
  grade: string;
  feeName: string;
  amount: number;
  paymentMethod: string;
  notes: string;
}

// This function will use the browser-friendly HTML/CSS approach
// instead of jsPDF which has issues with Arabic text encoding
export const generateReceipt = async (data: ReceiptData): Promise<string> => {
  try {
    // Make sure dates are in Georgian format
    const formattedData = {
      ...data,
      date: formatGeorgianDate(data.date)
    };
    
    // Use browser-native approach
    printReceipt(formattedData);
    return 'success';
  } catch (error) {
    console.error('Error generating receipt:', error);
    throw error;
  }
};

interface FinancialReportData {
  schoolName: string;
  schoolLogo?: string;
  fromDate: string;
  toDate: string;
  grade: string;
  totalStudents: number;
  totalFees: number;
  totalCollected: number;
  totalPending: number;
  paymentsByGrade: Array<{
    grade: string;
    total: number;
    count: number;
  }>;
}

export const generateFinancialReport = async (data: FinancialReportData): Promise<string> => {
  try {
    // Ensure dates are in Georgian format
    const formattedData = {
      ...data,
      fromDate: formatGeorgianDate(data.fromDate),
      toDate: formatGeorgianDate(data.toDate)
    };
    
    // Use browser-native approach
    printFinancialReport(formattedData);
    return 'success';
  } catch (error) {
    console.error('Error generating financial report:', error);
    throw error;
  }
};

// Print receipt using browser's printing functionality
function printReceipt(data: ReceiptData) {
  // Open a new window for printing
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('يرجى السماح بفتح النوافذ المنبثقة لطباعة الإيصال');
    return;
  }

  const formattedDate = data.date;
  
  // Write the receipt HTML to the new window with proper Arabic font support
  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>إيصال - ${data.receiptNumber}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
      <style>
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            margin: 1cm;
          }
          .no-print {
            display: none !important;
          }
        }
        
        * {
          box-sizing: border-box;
          font-family: 'Tajawal', sans-serif;
        }
        
        body {
          direction: rtl;
          text-align: right;
          font-family: 'Tajawal', sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f8f8f8;
          margin: 0;
          padding: 20px;
        }
        
        .receipt-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        
        .receipt-header {
          background: #800000;
          color: white;
          padding: 20px;
          text-align: center;
          position: relative;
        }
        
        .receipt-title {
          font-size: 28px;
          font-weight: bold;
          margin: 0;
          padding: 10px 0;
        }
        
        .receipt-school {
          font-size: 18px;
          margin: 5px 0;
        }
        
        .logo-container {
          position: absolute;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
          width: 80px;
          height: 80px;
          border-radius: 50%;
          overflow: hidden;
          background: white;
          display: ${data.schoolLogo ? 'flex' : 'none'};
          align-items: center;
          justify-content: center;
          border: 2px solid white;
        }
        
        .logo-container img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        
        .receipt-info {
          background-color: #f5f5f5;
          padding: 15px 20px;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
        }
        
        .receipt-info-item {
          margin-bottom: 5px;
        }
        
        .receipt-info-value {
          font-weight: bold;
        }
        
        .receipt-section {
          padding: 20px;
          border-bottom: 1px solid #eee;
        }
        
        .receipt-section h3 {
          margin-top: 0;
          color: #800000;
          border-bottom: 1px solid #f0f0f0;
          padding-bottom: 10px;
          font-size: 18px;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px dashed #eee;
        }
        
        .detail-label {
          font-weight: bold;
          color: #555;
        }
        
        .amount-row {
          display: flex;
          justify-content: space-between;
          padding: 15px 0;
          border-top: 2px solid #eee;
          margin-top: 10px;
          font-size: 18px;
        }
        
        .amount-value {
          font-weight: bold;
          color: #800000;
        }
        
        .receipt-footer {
          text-align: center;
          padding: 20px;
          background-color: #800000;
          color: white;
          font-size: 14px;
        }
        
        .stamp-signature {
          display: flex;
          justify-content: space-around;
          margin-top: 40px;
          margin-bottom: 20px;
        }
        
        .stamp, .signature {
          width: 150px;
          height: 100px;
          border: 1px dashed #ccc;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #333;
        }
        
        .receipt-notes {
          font-style: italic;
          color: #666;
          padding: 10px 0;
        }
        
        .print-button {
          background-color: #800000;
          color: white;
          border: none;
          padding: 10px 20px;
          font-size: 16px;
          border-radius: 4px;
          cursor: pointer;
          margin: 20px auto;
          display: block;
        }
        
        .print-button:hover {
          background-color: #600000;
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="receipt-header">
          ${data.schoolLogo ? `
            <div class="logo-container">
              <img src="${data.schoolLogo}" alt="${data.schoolName}" />
            </div>
          ` : ''}
          <h1 class="receipt-title">إيصال استلام مدفوعات</h1>
          <p class="receipt-school">${data.schoolName}</p>
        </div>
        
        <div class="receipt-info">
          <div class="receipt-info-item">
            <span>رقم الإيصال: </span>
            <span class="receipt-info-value">${data.receiptNumber}</span>
          </div>
          <div class="receipt-info-item">
            <span>التاريخ: </span>
            <span class="receipt-info-value">${formattedDate}</span>
          </div>
        </div>
        
        <div class="receipt-section">
          <h3>بيانات الطالب</h3>
          <div class="detail-row">
            <span class="detail-label">اسم الطالب:</span>
            <span>${data.studentName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">الصف:</span>
            <span>${data.grade.replace('الصف 1', 'الصف الأول')
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
                       .replace('الصف 12', 'الصف الثاني عشر')}</span>
          </div>
        </div>
        
        <div class="receipt-section">
          <h3>بيانات الدفعة</h3>
          <div class="detail-row">
            <span class="detail-label">نوع الرسوم:</span>
            <span>${data.feeName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">طريقة الدفع:</span>
            <span>${data.paymentMethod}</span>
          </div>
          ${data.notes ? `
            <div class="receipt-notes">
              <p>ملاحظات: ${data.notes}</p>
            </div>
          ` : ''}
          <div class="amount-row">
            <span class="detail-label">المبلغ المدفوع:</span>
            <span class="amount-value">${data.amount.toLocaleString()} ريال</span>
          </div>
        </div>
        
        <div class="receipt-section">
          <div class="stamp-signature">
            <div class="stamp">
              <p>ختم المدرسة</p>
            </div>
            <div class="signature">
              <p>توقيع المستلم</p>
            </div>
          </div>
        </div>
        
        <div class="receipt-footer">
          <p>تم إنشاء هذا الإيصال بواسطة نظام إدارة مالية المدارس</p>
          <p>تاريخ الطباعة: ${new Date().toLocaleString('ar', { calendar: 'gregory' })}</p>
        </div>
      </div>
      
      <button class="print-button no-print" onclick="window.print(); setTimeout(() => window.close(), 500);">
        طباعة الإيصال
      </button>
      
      <script>
        // Auto-print on load
        window.onload = function() {
          // Give time for fonts to load
          setTimeout(() => {
            window.print();
          }, 500);
        };
      </script>
    </body>
    </html>
  `);
  
  printWindow.document.close();
}

// Print financial report using browser's printing functionality
function printFinancialReport(data: FinancialReportData) {
  // Open a new window for printing
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('يرجى السماح بفتح النوافذ المنبثقة لطباعة التقرير');
    return;
  }
  
  const fromDate = data.fromDate;
  const toDate = data.toDate;
  
  // Calculate totals and percentages
  const collectionPercentage = data.totalFees > 0 
    ? Math.round((data.totalCollected / data.totalFees) * 100) 
    : 0;
  
  // Write the report HTML to the new window
  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>التقرير المالي - ${data.schoolName}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
      <style>
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            margin: 1cm;
          }
          .no-print {
            display: none !important;
          }
        }
        
        * {
          box-sizing: border-box;
          font-family: 'Tajawal', sans-serif;
        }
        
        body {
          direction: rtl;
          text-align: right;
          font-family: 'Tajawal', sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f8f8f8;
          margin: 0;
          padding: 20px;
        }
        
        .report-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        
        .report-header {
          background: #800000;
          color: white;
          padding: 20px;
          text-align: center;
          position: relative;
        }
        
        .report-title {
          font-size: 28px;
          font-weight: bold;
          margin: 0;
          padding: 10px 0;
        }
        
        .report-school {
          font-size: 18px;
          margin: 5px 0;
        }
        
        .logo-container {
          position: absolute;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
          width: 80px;
          height: 80px;
          border-radius: 50%;
          overflow: hidden;
          background: white;
          display: ${data.schoolLogo ? 'flex' : 'none'};
          align-items: center;
          justify-content: center;
          border: 2px solid white;
        }
        
        .logo-container img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        
        .report-info {
          background-color: #f5f5f5;
          padding: 15px 20px;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
        }
        
        .report-info-item {
          margin-bottom: 5px;
        }
        
        .report-info-value {
          font-weight: bold;
        }
        
        .report-section {
          padding: 20px;
          border-bottom: 1px solid #eee;
        }
        
        .report-section h3 {
          margin-top: 0;
          color: #800000;
          border-bottom: 1px solid #f0f0f0;
          padding-bottom: 10px;
          font-size: 18px;
        }
        
        .stats-container {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .stat-card {
          flex: 1;
          min-width: 200px;
          background-color: #f9f9f9;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .stat-title {
          color: #555;
          font-size: 14px;
          margin-bottom: 8px;
        }
        
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #800000;
        }
        
        .progress-container {
          margin: 20px 0;
        }
        
        .progress-bar {
          height: 20px;
          background-color: #e0e0e0;
          border-radius: 10px;
          overflow: hidden;
          margin-top: 8px;
        }
        
        .progress-fill {
          height: 100%;
          background-color: #800000;
        }
        
        .progress-label {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
        }
        
        .grade-payments {
          border-collapse: collapse;
          width: 100%;
          margin-top: 20px;
        }
        
        .grade-payments th {
          background-color: #f0f0f0;
          border: 1px solid #ddd;
          padding: 10px;
          text-align: right;
        }
        
        .grade-payments td {
          border: 1px solid #ddd;
          padding: 10px;
        }
        
        .grade-payments tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        
        .report-footer {
          text-align: center;
          padding: 20px;
          background-color: #800000;
          color: white;
          font-size: 14px;
        }
        
        .print-button {
          background-color: #800000;
          color: white;
          border: none;
          padding: 10px 20px;
          font-size: 16px;
          border-radius: 4px;
          cursor: pointer;
          margin: 20px auto;
          display: block;
        }
        
        .print-button:hover {
          background-color: #600000;
        }
      </style>
    </head>
    <body>
      <div class="report-container">
        <div class="report-header">
          ${data.schoolLogo ? `
            <div class="logo-container">
              <img src="${data.schoolLogo}" alt="${data.schoolName}" />
            </div>
          ` : ''}
          <h1 class="report-title">التقرير المالي</h1>
          <p class="report-school">${data.schoolName}</p>
        </div>
        
        <div class="report-info">
          <div class="report-info-item">
            <span>الفترة من: </span>
            <span class="report-info-value">${fromDate}</span>
          </div>
          <div class="report-info-item">
            <span>إلى: </span>
            <span class="report-info-value">${toDate}</span>
          </div>
          <div class="report-info-item">
            <span>الصف: </span>
            <span class="report-info-value">${
              data.grade === 'جميع الصفوف' ? data.grade : data.grade
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
                .replace('الصف 12', 'الصف الثاني عشر')
            }</span>
          </div>
        </div>
        
        <div class="report-section">
          <h3>ملخص المالي</h3>
          <div class="stats-container">
            <div class="stat-card">
              <div class="stat-title">إجمالي الطلاب</div>
              <div class="stat-value">${data.totalStudents}</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">إجمالي الرسوم</div>
              <div class="stat-value">${data.totalFees.toLocaleString()} ريال</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">إجمالي المحصّل</div>
              <div class="stat-value">${data.totalCollected.toLocaleString()} ريال</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">إجمالي المتبقي</div>
              <div class="stat-value">${data.totalPending.toLocaleString()} ريال</div>
            </div>
          </div>
          
          <div class="progress-container">
            <div class="progress-label">
              <span>نسبة التحصيل: ${collectionPercentage}%</span>
              <span>${data.totalCollected.toLocaleString()} / ${data.totalFees.toLocaleString()} ريال</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${collectionPercentage}%"></div>
            </div>
          </div>
        </div>
        
        <div class="report-section">
          <h3>المدفوعات حسب الصف</h3>
          <table class="grade-payments">
            <thead>
              <tr>
                <th>الصف</th>
                <th>عدد المدفوعات</th>
                <th>المبلغ الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              ${data.paymentsByGrade.map(item => `
                <tr>
                  <td>${
                    item.grade
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
                      .replace('الصف 12', 'الصف الثاني عشر')
                  }</td>
                  <td>${item.count}</td>
                  <td>${item.total.toLocaleString()} ريال</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="report-footer">
          <p>تم إنشاء هذا التقرير بواسطة نظام إدارة مالية المدارس</p>
          <p>تاريخ الطباعة: ${new Date().toLocaleString('ar', { calendar: 'gregory' })}</p>
        </div>
      </div>
      
      <button class="print-button no-print" onclick="window.print(); setTimeout(() => window.close(), 500);">
        طباعة التقرير
      </button>
      
      <script>
        // Auto-print on load
        window.onload = function() {
          // Give time for fonts to load
          setTimeout(() => {
            window.print();
          }, 500);
        };
      </script>
    </body>
    </html>
  `);
  
  printWindow.document.close();
}
 