import  { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, CreditCard, Clipboard, CheckCircle, Users, AlertCircle, Calendar, ListFilter } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import db from '../../db';
import { Card, CardBody, CardHeader, CardFooter } from '../../components/ui/Card';

const SchoolDashboard = () => {
  const { user } = useAuth();
  const { currentSchool } = useApp();
  const [stats, setStats] = useState({
    students: 0,
    fees: 0,
    payments: 0,
    pendingPayments: 0,
    totalCollected: 0,
    totalPending: 0,
    overduePayments: 0
  });
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  // Keep track of supervisor's grades
  const [supervisedGrades, setSupervisedGrades] = useState<string[]>([]);

  useEffect(() => {
    if (user?.schoolId) {
      // Parse the grades if this is a grade supervisor
      if (user.role === 'grade-supervisor' && user.grade) {
        const grades = user.grade.includes(',') 
          ? user.grade.split(',').map(g => g.trim()) 
          : [user.grade];
        setSupervisedGrades(grades);
      }
      
      fetchStats();
      fetchRecentPayments();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      let studentsQuery = db.students.where('schoolId').equals(user?.schoolId || 0);
      let feesQuery = db.fees.where('schoolId').equals(user?.schoolId || 0);
      let paymentsQuery = db.payments.where('schoolId').equals(user?.schoolId || 0);
      let installmentsQuery = db.table('installments').where('schoolId').equals(user?.schoolId || 0);
      
      // If grade supervisor, filter by grade(s)
      if (user?.role === 'grade-supervisor' && user?.grade) {
        const grades = user.grade.includes(',') 
          ? user.grade.split(',').map(g => g.trim()) 
          : [user.grade];
        
        // Filter students by grade
        studentsQuery = studentsQuery.and(student => grades.includes(student.grade));
        
        // Filter fees - need to handle both grade fees and student-specific fees
        feesQuery = feesQuery.and(fee => {
          // For student-specific fees, need to check if student is in our grades
          if (fee.studentId) {
            // Use promise to resolve async check
            return db.students.get(fee.studentId).then(student => {
              return student && grades.includes(student.grade);
            });
          }
          // For grade fees, check if the grade is one we supervise
          return grades.includes(fee.grade);
        });
        
        // For installments and payments, we need student IDs first
        const gradeStudents = await studentsQuery.toArray();
        const gradeStudentIds = gradeStudents.map(s => s.id as number);
        
        // Filter installments and payments by student IDs
        if (gradeStudentIds.length > 0) {
          installmentsQuery = installmentsQuery.and(i => gradeStudentIds.includes(i.studentId as number));
          paymentsQuery = paymentsQuery.and(p => gradeStudentIds.includes(p.studentId as number));
        } else {
          // No students in these grades
          setStats({
            students: 0,
            fees: 0,
            payments: 0,
            pendingPayments: 0,
            totalCollected: 0,
            totalPending: 0,
            overduePayments: 0
          });
          return;
        }
      }
      
      const students = await studentsQuery.count();
      const fees = await feesQuery.count();
      const payments = await paymentsQuery.count();
      const installments = await installmentsQuery.toArray() as Installment[];
      
      const totalFees = installments.reduce((sum, i) => sum + i.amount, 0);
      const paidAmount = installments.reduce((sum, i) => {
        if (i.status === 'paid') return sum + i.amount;
        if (i.status === 'partial') return sum + (i.paidAmount || 0);
        return sum;
      }, 0);
      
      const pendingPayments = installments.filter(i => i.status !== 'paid').length;
      const overduePayments = installments.filter(
        i => i.status !== 'paid' && new Date(i.dueDate) < new Date()
      ).length;
      
      setStats({
        students,
        fees,
        payments,
        pendingPayments,
        totalCollected: paidAmount,
        totalPending: totalFees - paidAmount,
        overduePayments
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentPayments = async () => {
    try {
      let paymentsQuery = db.payments.where('schoolId').equals(user?.schoolId || 0);
      
      // If grade supervisor, filter by grade(s)
      if (user?.role === 'grade-supervisor' && user?.grade) {
        const grades = user.grade.includes(',') 
          ? user.grade.split(',').map(g => g.trim()) 
          : [user.grade];
        
        // Get students in these grades
        const students = await db.students
          .where('schoolId').equals(user?.schoolId || 0)
          .and(student => grades.includes(student.grade))
          .toArray();
          
        // Get their IDs
        const studentIds = students.map(s => s.id);
        
        // Filter payments by student IDs
        if (studentIds.length > 0) {
          paymentsQuery = paymentsQuery.and(p => studentIds.includes(p.studentId));
        } else {
          setRecentPayments([]);
          return;
        }
      }
      
      // Get payments sorted by date (newest first)
      const allPayments = await paymentsQuery
        .reverse()
        .sortBy('date');
      
      const recentPayments = [];
      
      // Process up to 5 most recent payments
      for (let i = 0; i < Math.min(allPayments.length, 5); i++) {
        const payment = allPayments[i];
        const student = await db.students.get(payment.studentId);
        const fee = await db.fees.get(payment.feeId);
        
        if (student && fee) {
          recentPayments.push({
            id: payment.id,
            amount: payment.amount,
            date: payment.date,
            studentName: student.name,
            grade: student.grade,
            feeName: fee.name,
            paymentMethod: payment.paymentMethod || 'نقداً'
          });
        }
      }
      
      setRecentPayments(recentPayments);
    } catch (error) {
      console.error('Error fetching recent payments:', error);
    }
  };

  const stats_cards = [
    { 
      name: 'الطلاب', 
      value: stats.students, 
      icon: Users, 
      color: 'from-blue-500 to-blue-600',
      link: '/school/students',
      iconBg: 'bg-blue-100 text-blue-600'
    },
    { 
      name: 'الرسوم المالية', 
      value: stats.fees, 
      icon: Clipboard, 
      color: 'from-primary-600 to-primary-700',
      link: '/school/fees',
      iconBg: 'bg-primary-100 text-primary-600'
    },
    { 
      name: 'المدفوعات', 
      value: stats.payments, 
      icon: CheckCircle, 
      color: 'from-green-500 to-green-600',
      link: '/school/payments',
      iconBg: 'bg-green-100 text-green-600'
    },
    { 
      name: 'المدفوعات المتأخرة', 
      value: stats.overduePayments, 
      icon: AlertCircle, 
      color: 'from-red-500 to-red-600',
      link: '/school/payments',
      iconBg: 'bg-red-100 text-red-600'
    }
  ];

  return (
    <div className="font-tajawal">
      <div className="mb-8">
        <div className="relative rounded-xl overflow-hidden mb-6 h-56 shadow-lg">
          <img 
            src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcmFiaWMlMjBzY2hvb2wlMjBtYW5hZ2VtZW50JTIwZmluYW5jZXxlbnwwfHx8fDE3NDYyNzcyNjB8MA&ixlib=rb-4.0.3&fit=fillmax&h=600&w=800" 
            alt="مبنى المدرسة"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-900/90 to-primary-600/50 flex items-center px-6">
            <div className="text-white max-w-3xl">
              <h2 className="text-3xl font-bold mb-2">مرحباً بك في نظام إدارة مالية المدارس</h2>
              <p className="text-white/90 text-lg">
                {user?.role === 'grade-supervisor' ? 
                  `نظام متكامل لإدارة الرسوم الدراسية والمدفوعات ${supervisedGrades.length > 0 ? `للصفوف: ${supervisedGrades.join('، ')}` : ''}` : 
                  'نظام متكامل لإدارة الرسوم الدراسية والمدفوعات والتقارير المالية مع دعم كامل للعمل دون اتصال بالإنترنت'}
              </p>
            </div>
          </div>
        </div>
        
        <h2 className="text-xl font-bold mb-4 text-gray-900 flex items-center">
          <ListFilter className="h-6 w-6 ml-2" />
          الإحصائيات
          {user?.role === 'grade-supervisor' && supervisedGrades.length > 0 && (
            <span className="mr-2 text-sm font-normal text-gray-500">
              ({supervisedGrades.length > 1 ? `الصفوف: ${supervisedGrades.join('، ')}` : `الصف: ${supervisedGrades[0]}`})
            </span>
          )}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats_cards.map((stat, index) => (
            <Link to={stat.link} key={index} className="hover:-translate-y-1 transition-all duration-200">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden h-full">
                <div className="p-6">
                  <div className="flex items-center mb-3">
                    <div className={`${stat.iconBg} p-3 rounded-lg`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mr-3">{stat.name}</h3>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                </div>
                <div className={`h-1.5 w-full bg-gradient-to-r ${stat.color}`}></div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
          <CreditCard className="h-5 w-5 ml-2" />
          إحصائيات المدفوعات
          {user?.role === 'grade-supervisor' && supervisedGrades.length > 0 && (
            <span className="mr-2 text-sm font-normal text-gray-500">
              ({supervisedGrades.length > 1 ? `الصفوف: ${supervisedGrades.join('، ')}` : `الصف: ${supervisedGrades[0]}`})
            </span>
          )}
        </h3>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                    المدفوع
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-green-600">
                    {stats.totalCollected > 0 && stats.totalPending > 0 ? 
                      Math.floor((stats.totalCollected / (stats.totalCollected + stats.totalPending)) * 100) : 0}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200">
                <div
                  style={{ width: `${stats.totalCollected > 0 && stats.totalPending > 0 ? Math.floor((stats.totalCollected / (stats.totalCollected + stats.totalPending)) * 100) : 0}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-600"
                ></div>
              </div>
            </div>
            
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-red-600 bg-red-200">
                    المتبقي
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-red-600">
                    {stats.totalCollected > 0 && stats.totalPending > 0 ? 
                      Math.floor((stats.totalPending / (stats.totalCollected + stats.totalPending)) * 100) : 0}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-red-200">
                <div
                  style={{ width: `${stats.totalCollected > 0 && stats.totalPending > 0 ? 
                    Math.floor((stats.totalPending / (stats.totalCollected + stats.totalPending)) * 100) : 0}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-600"
                ></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-sm text-green-800 font-medium">إجمالي المدفوع</p>
                <p className="text-xl font-bold text-green-700 mt-1">{stats.totalCollected.toLocaleString()} ريال</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <p className="text-sm text-red-800 font-medium">إجمالي المتبقي</p>
                <p className="text-xl font-bold text-red-700 mt-1">{stats.totalPending.toLocaleString()} ريال</p>
              </div>
            </div>
          </div>
          
          <div className="flex-1">
            <h4 className="text-base font-medium text-gray-800 mb-3">آخر المدفوعات</h4>
            <div className="space-y-4">
              {recentPayments.length > 0 ? (
                recentPayments.map(payment => (
                  <div key={payment.id} className="flex items-start border-b border-gray-100 pb-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="mr-3 flex-1">
                      <p className="text-sm font-medium">{payment.studentName}</p>
                      <p className="text-xs text-gray-500">{payment.feeName}</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500">{new Date(payment.date).toLocaleDateString('ar-SA')}</span>
                        <span className="text-sm font-medium text-primary-600">{payment.amount.toLocaleString()} ريال</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-4">
                  <p className="text-gray-500">لا توجد مدفوعات حديثة</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
            <h3 className="text-lg font-medium mb-2">الطلاب</h3>
            <p className="text-3xl font-bold">{stats.students}</p>
          </div>
          <div className="p-4">
            <div className="flex justify-between items-center">
              <Link to="/school/students" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                إدارة الطلاب
              </Link>
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
            <h3 className="text-lg font-medium mb-2">الرسوم</h3>
            <p className="text-3xl font-bold">{stats.fees}</p>
          </div>
          <div className="p-4">
            <div className="flex justify-between items-center">
              <Link to="/school/fees" className="text-primary-600 hover:text-primary-800 text-sm font-medium">
                إدارة الرسوم
              </Link>
              <Clipboard className="h-5 w-5 text-primary-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
            <h3 className="text-lg font-medium mb-2">الأقساط المتأخرة</h3>
            <p className="text-3xl font-bold">{stats.overduePayments}</p>
          </div>
          <div className="p-4">
            <div className="flex justify-between items-center">
              <Link to="/school/payments" className="text-red-600 hover:text-red-800 text-sm font-medium">
                معالجة المتأخرات
              </Link>
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolDashboard;
 