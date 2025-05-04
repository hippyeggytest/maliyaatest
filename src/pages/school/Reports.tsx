import  { useState, useEffect } from 'react';
import { Download, FileText, Filter } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import db from '../../db';
import { generateFinancialReport } from '../../utils/pdfGenerator';
import { Student, Fee, Payment } from '../../types';

const Reports = () => {
  const { user } = useAuth();
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of the current year
    to: new Date().toISOString().split('T')[0] // Today
  });
  const [reportData, setReportData] = useState({
    totalStudents: 0,
    totalFees: 0,
    totalCollected: 0,
    totalPending: 0,
    paymentsByGrade: [] as any[],
    recentPayments: [] as any[]
  });

  useEffect(() => {
    if (user?.schoolId) {
      generateReport();
    }
  }, [user, selectedGrade, dateRange]);

  const grades = [
    'الكل',
    'روضة 1',
    'التمهيدي',
    'الصف 1',
    'الصف 2',
    'الصف 3',
    'الصف 4',
    'الصف 5',
    'الصف 6',
    'الصف 7',
    'الصف 8',
    'الصف 9',
    'الصف 10',
    'الصف 11',
    'الصف 12'
  ];

  const generateReport = async () => {
    try {
      if (!user?.schoolId) return;
      
      // Filter conditions
      const fromDate = new Date(dateRange.from);
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999); // End of the day
      
      // Get all relevant data
      let studentsQuery = db.students.where('schoolId').equals(user.schoolId);
      let feesQuery = db.fees.where('schoolId').equals(user.schoolId);
      let paymentsQuery = db.payments.where('schoolId').equals(user.schoolId);
      
      // Filter by grade if not 'all'
      if (selectedGrade !== 'all' && selectedGrade !== 'الكل') {
        studentsQuery = studentsQuery.and(s => s.grade === selectedGrade);
        feesQuery = feesQuery.and(f => f.grade === selectedGrade);
        
        // For payments, we need to filter by grade of student
        const gradeStudents = await studentsQuery.toArray();
        const gradeStudentIds = gradeStudents.map(s => s.id);
        
        if (gradeStudentIds.length > 0) {
          paymentsQuery = paymentsQuery.and(p => gradeStudentIds.includes(p.studentId!));
        } else {
          // No students in this grade
          setReportData({
            totalStudents: 0,
            totalFees: 0,
            totalCollected: 0,
            totalPending: 0,
            paymentsByGrade: [],
            recentPayments: []
          });
          return;
        }
      }
      
      // Get payments within date range
      const allPayments = await paymentsQuery.toArray();
      const paymentsInRange = allPayments.filter(payment => {
        const paymentDate = new Date(payment.date);
        return paymentDate >= fromDate && paymentDate <= toDate;
      });
      
      // Get students and fees
      const students = await studentsQuery.toArray();
      const fees = await feesQuery.toArray();
      
      // Calculate totals
      const totalStudents = students.length;
      const totalFees = fees.reduce((sum, fee) => sum + fee.amount, 0);
      const totalCollected = paymentsInRange.reduce((sum, payment) => sum + payment.amount, 0);
      
      // Calculate pending (due) amount - this is simplified
      const totalPending = totalFees - totalCollected;
      
      // Group payments by grade
      const gradeMap = new Map();
      
      for (const payment of paymentsInRange) {
        const student = await db.students.get(payment.studentId);
        if (student) {
          const grade = student.grade;
          const current = gradeMap.get(grade) || { total: 0, count: 0 };
          current.total += payment.amount;
          current.count += 1;
          gradeMap.set(grade, current);
        }
      }
      
      const paymentsByGrade = Array.from(gradeMap.entries()).map(([grade, data]) => ({
        grade,
        total: data.total,
        count: data.count
      }));
      
      // Get recent payments with details
      const recentPayments = [];
      
      // Sort payments by date (newest first) and take the first 5
      const sortedPayments = [...paymentsInRange].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ).slice(0, 5);
      
      for (const payment of sortedPayments) {
        const student = await db.students.get(payment.studentId);
        const fee = await db.fees.get(payment.feeId);
        
        if (student && fee) {
          recentPayments.push({
            id: payment.id,
            amount: payment.amount,
            date: payment.date,
            studentName: student.name,
            feeName: fee.name,
            paymentMethod: payment.paymentMethod
          });
        }
      }
      
      setReportData({
        totalStudents,
        totalFees,
        totalCollected,
        totalPending,
        paymentsByGrade,
        recentPayments
      });
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const handleExportPdf = async () => {
    try {
      if (!user?.schoolId) return;
      
      const school = await db.schools.get(user.schoolId);
      if (!school) return;
      
      await generateFinancialReport({
        schoolName: school.name,
        schoolLogo: school.logo,
        fromDate: dateRange.from,
        toDate: dateRange.to,
        grade: selectedGrade === 'all' || selectedGrade === 'الكل' ? 'جميع الصفوف' : selectedGrade,
        totalStudents: reportData.totalStudents,
        totalFees: reportData.totalFees,
        totalCollected: reportData.totalCollected,
        totalPending: reportData.totalPending,
        paymentsByGrade: reportData.paymentsByGrade
      });
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-lg font-semibold">التقارير المالية</h2>
        <button
          onClick={handleExportPdf}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <Download className="h-5 w-5 ml-2" />
          تصدير التقرير (PDF)
        </button>
      </div>

      <div className="mb-8 bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          <Filter className="inline-block h-5 w-5 ml-2" />
          تصفية التقرير
        </h3>
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-3">
          <div>
            <label htmlFor="grade" className="block text-sm font-medium text-gray-700">
              الصف
            </label>
            <select
              id="grade"
              name="grade"
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            >
              <option value="all">جميع الصفوف</option>
              {grades.slice(1).map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="date-from" className="block text-sm font-medium text-gray-700">
              من تاريخ
            </label>
            <input
              type="date"
              id="date-from"
              name="date-from"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="mt-1 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label htmlFor="date-to" className="block text-sm font-medium text-gray-700">
              إلى تاريخ
            </label>
            <input
              type="date"
              id="date-to"
              name="date-to"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="mt-1 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">ملخص التقرير</h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-md p-3 bg-blue-500">
                  <FileText className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <div className="mr-5">
                  <p className="text-sm font-medium text-gray-500 truncate">إجمالي الطلاب</p>
                  <p className="mt-1 text-3xl font-semibold text-gray-900">{reportData.totalStudents}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-md p-3 bg-purple-500">
                  <FileText className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <div className="mr-5">
                  <p className="text-sm font-medium text-gray-500 truncate">إجمالي الرسوم</p>
                  <p className="mt-1 text-3xl font-semibold text-gray-900">{reportData.totalFees.toLocaleString()} ريال</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-md p-3 bg-green-500">
                  <FileText className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <div className="mr-5">
                  <p className="text-sm font-medium text-gray-500 truncate">إجمالي المحصل</p>
                  <p className="mt-1 text-3xl font-semibold text-gray-900">{reportData.totalCollected.toLocaleString()} ريال</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-md p-3 bg-red-500">
                  <FileText className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <div className="mr-5">
                  <p className="text-sm font-medium text-gray-500 truncate">إجمالي المتبقي</p>
                  <p className="mt-1 text-3xl font-semibold text-gray-900">{reportData.totalPending.toLocaleString()} ريال</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">المدفوعات حسب الصف</h3>
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  الصف
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  عدد المدفوعات
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  إجمالي المبالغ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.paymentsByGrade.length > 0 ? (
                reportData.paymentsByGrade.map((item) => (
                  <tr key={item.grade}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.grade}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.total.toLocaleString()} ريال</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                    لا توجد بيانات متاحة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">آخر المدفوعات</h3>
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  الطالب
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  الرسوم
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  المبلغ
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  التاريخ
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  طريقة الدفع
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.recentPayments.length > 0 ? (
                reportData.recentPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{payment.studentName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.feeName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.amount.toLocaleString()} ريال</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(payment.date).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.paymentMethod}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    لا توجد مدفوعات حديثة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
 