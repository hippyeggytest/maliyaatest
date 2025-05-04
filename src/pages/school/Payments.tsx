import  { useState, useEffect } from 'react';
import { CreditCard, Calendar, Plus, Edit, Trash, Search, Printer, FileText, User, MessageCircle, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import db from '../../db';
import { Payment, Student, Fee, School, Installment } from '../../types';
import { useConnection } from '../../contexts/ConnectionContext';
import { generateReceipt } from '../../utils/pdfGenerator';
import StudentInstallments from '../../components/StudentInstallments';

const Payments = () => {
  const { user } = useAuth();
  const { isOnline } = useConnection();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [currentSchool, setCurrentSchool] = useState<School | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInstallments, setShowInstallments] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedStudentInstallments, setSelectedStudentInstallments] = useState<Installment[]>([]);
  const [viewMode, setViewMode] = useState<'payments' | 'installments'>('payments');
  const [isEditing, setIsEditing] = useState(false);
  const [sendWhatsapp, setSendWhatsapp] = useState(false);
  const [formData, setFormData] = useState<Partial<Payment>>({
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    studentId: 0,
    feeId: 0,
    schoolId: user?.schoolId,
    paymentMethod: 'نقداً',
    notes: '',
    installmentNumber: undefined
  });
  
  useEffect(() => {
    if (user?.schoolId) {
      fetchPayments();
      fetchStudents();
      fetchFees();
      fetchSchool();
      fetchInstallments();
    }
  }, [user]);

  const fetchSchool = async () => {
    try {
      if (!user?.schoolId) return;
      const school = await db.schools.get(user.schoolId);
      setCurrentSchool(school || null);
    } catch (error) {
      console.error('Error fetching school:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      if (!user?.schoolId) return;
      
      let query = db.payments.where('schoolId').equals(user.schoolId);
      
      // If grade supervisor, we need to filter by student grade
      if (user.role === 'grade-supervisor' && user.grade) {
        // Get students in this grade
        const gradeStudents = await db.students
          .where('schoolId').equals(user.schoolId)
          .and(student => student.grade === user.grade)
          .toArray();
        
        const studentIds = gradeStudents.map(s => s.id);
        
        if (studentIds.length > 0) {
          // Filter payments for these students
          const gradePayments = await db.payments
            .where('schoolId').equals(user.schoolId)
            .and(payment => studentIds.includes(payment.studentId!))
            .toArray();
          
          setPayments(gradePayments);
          return;
        } else {
          setPayments([]);
          return;
        }
      }
      
      const allPayments = await query.toArray();
      setPayments(allPayments);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      if (!user?.schoolId) return;
      
      let query = db.students.where('schoolId').equals(user.schoolId);
      
      // If grade supervisor, only show students from their grade
      if (user.role === 'grade-supervisor' && user.grade) {
        const grades = user.grade.includes(',') ? user.grade.split(',').map(g => g.trim()) : [user.grade];
        query = query.and(student => grades.includes(student.grade));
      }
      
      const allStudents = await query.toArray();
      setStudents(allStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchFees = async () => {
    try {
      if (!user?.schoolId) return;
      
      let query = db.fees.where('schoolId').equals(user.schoolId);
      
      // If grade supervisor, only show fees from their grade
      if (user.role === 'grade-supervisor' && user.grade) {
        const grades = user.grade.includes(',') ? user.grade.split(',').map(g => g.trim()) : [user.grade];
        query = query.and(fee => grades.includes(fee.grade) || fee.studentId !== undefined);
      }
      
      const allFees = await query.toArray();
      setFees(allFees);
    } catch (error) {
      console.error('Error fetching fees:', error);
    }
  };

  const fetchInstallments = async () => {
    try {
      if (!user?.schoolId) return;
      
      let query = db.table('installments').where('schoolId').equals(user.schoolId);
      
      // If selectedStudentId is set, filter by student
      if (selectedStudentId) {
        query = query.and(installment => installment.studentId === selectedStudentId);
      }
      
      const allInstallments = await query.toArray();
      setInstallments(allInstallments as Installment[]);
    } catch (error) {
      console.error('Error fetching installments:', error);
    }
  };

  useEffect(() => {
    if (selectedStudentId) {
      fetchStudentInstallments(selectedStudentId);
    }
  }, [selectedStudentId]);

  const fetchStudentInstallments = async (studentId: number) => {
    try {
      if (!user?.schoolId) return;
      
      const studentInstallments = await db.table('installments')
        .where('schoolId').equals(user.schoolId)
        .and(installment => installment.studentId === studentId)
        .toArray();
      
      setSelectedStudentInstallments(studentInstallments as Installment[]);
    } catch (error) {
      console.error('Error fetching student installments:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'amount') {
      setFormData({ ...formData, [name]: parseFloat(value) || 0 });
    } else if (name === 'studentId' || name === 'feeId') {
      setFormData({ ...formData, [name]: parseInt(value) || 0 });
      
      // If this is the student field and we're in installments mode, update the selected student
      if (name === 'studentId' && showInstallments) {
        setSelectedStudentId(parseInt(value) || null);
      }
    } else if (name === 'installmentNumber') {
      setFormData({ ...formData, [name]: value ? parseInt(value) : undefined });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Save payment
      let paymentId: number;
      
      if (isEditing && formData.id) {
        await db.payments.update(formData.id, formData);
        paymentId = formData.id;
        
        // Add to sync queue if online
        if (isOnline) {
          await db.syncQueue.add({
            operation: 'update',
            entity: 'payment',
            entityId: formData.id,
            data: formData,
            timestamp: Date.now()
          });
        }
      } else {
        paymentId = await db.payments.add(formData as Payment);
        
        // Add to sync queue if online
        if (isOnline) {
          await db.syncQueue.add({
            operation: 'create',
            entity: 'payment',
            entityId: paymentId,
            data: formData,
            timestamp: Date.now()
          });
        }
      }
      
      // Update installment status if applicable
      if (showInstallments && formData.installmentNumber && formData.studentId && formData.feeId) {
        const installment = installments.find(i => 
          i.feeId === formData.feeId && 
          i.studentId === formData.studentId && 
          i.number === formData.installmentNumber
        );
        
        if (installment) {
          const status = formData.amount >= installment.amount ? 'paid' : 'partial';
          
          await db.table('installments').update(installment.id!, {
            status,
            paidAmount: formData.amount,
            paidDate: formData.date
          });
          
          // Refresh installments
          fetchInstallments();
          if (selectedStudentId) {
            fetchStudentInstallments(selectedStudentId);
          }
        }
      }
      
      // Generate receipt
      if (formData.studentId && formData.feeId && currentSchool) {
        const student = await db.students.get(formData.studentId);
        const fee = await db.fees.get(formData.feeId);
        
        if (student && fee) {
          const receiptNumber = `R-${Date.now().toString().slice(-6)}`;
          
          // Save receipt reference
          await db.receipts.add({
            paymentId,
            studentId: student.id!,
            schoolId: currentSchool.id!,
            date: formData.date || new Date().toISOString(),
            receiptNumber
          });
          
          // Generate PDF receipt
          if (isOnline) {
            try {
              await generateReceipt({
                receiptNumber,
                date: formData.date || new Date().toISOString(),
                schoolName: currentSchool.name,
                schoolLogo: currentSchool.logo,
                studentName: student.name,
                grade: student.grade,
                feeName: fee.name,
                amount: formData.amount || 0,
                paymentMethod: formData.paymentMethod || 'نقداً',
                notes: formData.notes || ''
              });
              
              // Send WhatsApp notification if enabled
              if (sendWhatsapp) {
                sendPaymentWhatsApp(student, fee, formData.amount || 0, formData.paymentMethod || 'نقداً', formData.date || new Date().toISOString());
              }
            } catch (error) {
              console.error('Error generating receipt:', error);
            }
          }
        }
      }
      
      setShowForm(false);
      setFormData({
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        studentId: 0,
        feeId: 0,
        schoolId: user?.schoolId,
        paymentMethod: 'نقداً',
        notes: '',
        installmentNumber: undefined
      });
      setIsEditing(false);
      setSendWhatsapp(false);
      fetchPayments();
    } catch (error) {
      console.error('Error saving payment:', error);
    }
  };

  const handleEdit = (payment: Payment) => {
    setFormData({
      ...payment,
      date: new Date(payment.date).toISOString().split('T')[0]
    });
    setIsEditing(true);
    setShowForm(true);
    setShowInstallments(false);
  };

  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
    
    if (confirm('هل أنت متأكد من حذف هذه الدفعة؟')) {
      try {
        await db.payments.delete(id);
        
        // Add to sync queue if online
        if (isOnline) {
          await db.syncQueue.add({
            operation: 'delete',
            entity: 'payment',
            entityId: id,
            data: { id },
            timestamp: Date.now()
          });
        }
        
        fetchPayments();
      } catch (error) {
        console.error('Error deleting payment:', error);
      }
    }
  };

  const handlePrintReceipt = async (payment: Payment) => {
    if (!payment.id || !payment.studentId || !payment.feeId || !currentSchool) return;
    
    try {
      const student = await db.students.get(payment.studentId);
      const fee = await db.fees.get(payment.feeId);
      
      if (student && fee) {
        const receiptNumber = `R-${Date.now().toString().slice(-6)}`;
        
        // Generate PDF receipt
        await generateReceipt({
          receiptNumber,
          date: payment.date,
          schoolName: currentSchool.name,
          schoolLogo: currentSchool.logo,
          studentName: student.name,
          grade: student.grade,
          feeName: fee.name,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod || 'نقداً',
          notes: payment.notes || ''
        });
      }
    } catch (error) {
      console.error('Error generating receipt:', error);
    }
  };

  const sendPaymentWhatsApp = async (student: Student, fee: Fee, amount: number, paymentMethod: string, date: string) => {
    if (!student) return;
    
    // Format phone number for WhatsApp
    let phoneNumber = student.parentPhone.replace(/[^0-9]/g, '');
    
    // Make sure the phone number starts with the country code
    if (!phoneNumber.startsWith('968')) {
      phoneNumber = '968' + phoneNumber;
    }
    
    // Create message content
    const message = `السلام عليكم ورحمة الله وبركاته\nالأخ الكريم / ${student.parentName}\nنشكركم على سداد الرسوم الدراسية للطالب ${student.name} في الصف ${student.grade} بتاريخ ${new Date(date).toLocaleDateString('ar-SA')}.\nاسم الرسوم: ${fee.name}\nالمبلغ المدفوع: ${amount} ريال\nطريقة الدفع: ${paymentMethod}\nمع خالص الشكر والتقدير,\nإدارة المدرسة`;
    
    // Create WhatsApp link with pre-filled message
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    // Open in a new tab
    window.open(whatsappUrl, '_blank');
  };

  const handleSendWhatsApp = async (payment: Payment) => {
    if (!payment.studentId) return;
    
    try {
      const student = await db.students.get(payment.studentId);
      if (!student) return;
      
      const fee = await db.fees.get(payment.feeId);
      if (!fee) return;
      
      sendPaymentWhatsApp(student, fee, payment.amount, payment.paymentMethod || 'نقداً', payment.date);
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
    }
  };

  const handleSelectStudent = (studentId: number) => {
    setSelectedStudentId(studentId);
    setViewMode('installments');
  };

  // Filter payments based on search term
  const filteredPayments = searchTerm
    ? payments.filter(payment => {
        // Get student and fee names for searching
        const student = students.find(s => s.id === payment.studentId);
        const fee = fees.find(f => f.id === payment.feeId);
        
        return (
          (student && student.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (fee && fee.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          payment.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (payment.notes && payment.notes.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      })
    : payments;

  const getStudentName = (studentId: number) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.name : 'غير معروف';
  };

  const getFeeName = (feeId: number) => {
    const fee = fees.find(f => f.id === feeId);
    return fee ? fee.name : 'غير معروف';
  };

  // Get fees applicable for the selected student
  const getStudentFees = (studentId: number | null) => {
    if (!studentId) return [];
    
    const student = students.find(s => s.id === studentId);
    if (!student) return [];
    
    return fees.filter(fee => 
      fee.studentId === studentId || 
      (fee.studentId === undefined && fee.grade === student.grade)
    );
  };

  // Get selected student details
  const selectedStudent = selectedStudentId ? students.find(s => s.id === selectedStudentId) : null;

  return (
    <div>
      <div className="page-header">
        <img
          src="https://images.unsplash.com/photo-1544717305-2782549b5136?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwzfHxhcmFiaWMlMjBzY2hvb2wlMjBzdHVkZW50JTIwZmluYW5jaWFsJTIwcmVjZWlwdCUyMHBheW1lbnR8ZW58MHx8fHwxNzQ2Mjc0ODA0fDA&ixlib=rb-4.0.3&fit=fillmax&h=600&w=800"
          alt="Student Payment"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="pattern-bg absolute inset-0 opacity-5"></div>
        <div className="page-header-content">
          <div className="text-white">
            <h2 className="text-3xl font-bold mb-2">إدارة المدفوعات والأقساط</h2>
            <p className="text-white/90">
              تسجيل وإدارة مدفوعات الطلاب والأقساط
            </p>
          </div>
        </div>
      </div>

      {/* View Selection */}
      {viewMode === 'installments' && selectedStudentId ? (
        <StudentInstallments 
          studentId={selectedStudentId} 
          onBack={() => setViewMode('payments')}
        />
      ) : (
        <>
          {/* Students Section */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">الطلاب والأقساط</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map(student => (
                <div 
                  key={student.id}
                  onClick={() => handleSelectStudent(student.id!)}
                  className="bg-white border rounded-lg shadow-sm hover:shadow-md p-4 cursor-pointer transition-all"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="mr-3">
                      <h4 className="text-base font-medium text-gray-900">{student.name}</h4>
                      <p className="text-sm text-gray-600">{student.grade}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-xs text-gray-600">عرض الأقساط</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                      <CheckCircle className="h-3 w-3 ml-1" />
                      الأقساط والمدفوعات
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Search and Filter for Payments */}
          <div className="mb-6 flex justify-between items-center">
            <div className="relative rounded-md shadow-sm max-w-md w-full">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                className="form-input block w-full pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500"
                placeholder="البحث عن مدفوعات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <div>
                <span className="text-sm text-gray-600">
                  إجمالي المدفوعات: <span className="font-medium">{payments.length}</span>
                </span>
              </div>
              <button
                onClick={() => {
                  setFormData({
                    amount: 0,
                    date: new Date().toISOString().split('T')[0],
                    studentId: 0,
                    feeId: 0,
                    schoolId: user?.schoolId,
                    paymentMethod: 'نقداً',
                    notes: '',
                    installmentNumber: undefined
                  });
                  setIsEditing(false);
                  setShowForm(true);
                  setShowInstallments(false);
                }}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                <Plus className="h-5 w-5 ml-2" />
                دفعة جديدة
              </button>
              <button
                onClick={() => {
                  setFormData({
                    amount: 0,
                    date: new Date().toISOString().split('T')[0],
                    studentId: 0,
                    feeId: 0,
                    schoolId: user?.schoolId,
                    paymentMethod: 'نقداً',
                    notes: '',
                    installmentNumber: undefined
                  });
                  setIsEditing(false);
                  setShowForm(true);
                  setShowInstallments(true);
                }}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                <Calendar className="h-5 w-5 ml-2" />
                دفع قسط
              </button>
            </div>
          </div>

          {/* Payment Form */}
          {showForm && (
            <div className="mb-8 bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {isEditing ? 'تعديل بيانات الدفعة' : showInstallments ? 'تسجيل دفع قسط' : 'إضافة دفعة جديدة'}
              </h3>

              {showInstallments && selectedStudentId && (
                <div className="mb-6">
                  <div className="bg-gray-50 p-4 rounded-md mb-4">
                    <h4 className="text-base font-medium text-gray-900 mb-2">بيانات الطالب</h4>
                    <p><span className="font-medium">الاسم:</span> {selectedStudent?.name}</p>
                    <p><span className="font-medium">الصف:</span> {selectedStudent?.grade}</p>
                    <p><span className="font-medium">ولي الأمر:</span> {selectedStudent?.parentName}</p>
                  </div>

                  <h4 className="text-base font-medium text-gray-900 mb-2">اختيار القسط</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {selectedStudentInstallments.map(installment => {
                      const fee = fees.find(f => f.id === installment.feeId);
                      if (!fee) return null;
                      
                      const isPaid = installment.status === 'paid';
                      const isPartial = installment.status === 'partial';
                      const isOverdue = !isPaid && new Date(installment.dueDate) < new Date();
                      
                      const statusText = 
                        isPaid ? 'مدفوع' : 
                        isPartial ? 'مدفوع جزئي' : 
                        isOverdue ? 'متأخر' : 
                        'قيد الانتظار';
                        
                      const statusColor = 
                        isPaid ? 'bg-green-100 text-green-800' : 
                        isPartial ? 'bg-orange-100 text-orange-800' : 
                        isOverdue ? 'bg-red-100 text-red-800' : 
                        'bg-blue-100 text-blue-800';
                      
                      return (
                        <div 
                          key={installment.id}
                          className={`
                            border rounded-lg p-4 cursor-pointer transition-all
                            ${formData.installmentNumber === installment.number && formData.feeId === installment.feeId
                              ? 'border-primary-500 ring-2 ring-primary-500'
                              : 'hover:bg-gray-50'
                            }
                            ${isPaid ? 'opacity-50' : ''}
                          `}
                          onClick={() => {
                            if (!isPaid) {
                              setFormData({
                                ...formData,
                                feeId: installment.feeId,
                                installmentNumber: installment.number,
                                amount: isPartial ? installment.amount - (installment.paidAmount || 0) : installment.amount,
                                studentId: selectedStudentId
                              });
                            }
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-medium text-gray-900">{fee.name} - القسط {installment.number}</h5>
                              <p className="text-sm text-gray-700 mt-1">{installment.amount.toLocaleString()} ريال</p>
                              <p className="text-xs text-gray-600 mt-1">
                                تاريخ الاستحقاق: {new Date(installment.dueDate).toLocaleDateString('ar-SA')}
                              </p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${statusColor}`}>
                              {statusText}
                            </span>
                          </div>
                          
                          {isPartial && (
                            <div className="mt-2 text-xs">
                              <p className="text-green-700">المدفوع: {installment.paidAmount?.toLocaleString()} ريال</p>
                              <p className="text-red-700">المتبقي: {(installment.amount - (installment.paidAmount || 0)).toLocaleString()} ريال</p>
                              {installment.paidDate && (
                                <p className="text-gray-600">
                                  آخر دفعة: {new Date(installment.paidDate).toLocaleDateString('ar-SA')}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label htmlFor="studentId" className="block text-sm font-medium text-gray-800">
                      الطالب
                    </label>
                    <div className="mt-1">
                      <select
                        id="studentId"
                        name="studentId"
                        required
                        value={formData.studentId || ''}
                        onChange={handleInputChange}
                        disabled={showInstallments && selectedStudentId !== null}
                        className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-100"
                      >
                        <option value="">اختر الطالب</option>
                        {students.map(student => (
                          <option key={student.id} value={student.id}>
                            {student.name} - {student.grade}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="feeId" className="block text-sm font-medium text-gray-800">
                      الرسوم
                    </label>
                    <div className="mt-1">
                      <select
                        id="feeId"
                        name="feeId"
                        required
                        disabled={showInstallments && formData.installmentNumber !== undefined}
                        value={formData.feeId || ''}
                        onChange={handleInputChange}
                        className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-100"
                      >
                        <option value="">اختر الرسوم</option>
                        {getStudentFees(formData.studentId || null).map(fee => (
                          <option key={fee.id} value={fee.id}>
                            {fee.name} - {fee.amount.toLocaleString()} ريال
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-800">
                      المبلغ
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        name="amount"
                        id="amount"
                        required
                        value={formData.amount}
                        onChange={handleInputChange}
                        className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="date" className="block text-sm font-medium text-gray-800">
                      تاريخ الدفع
                    </label>
                    <div className="mt-1">
                      <input
                        type="date"
                        name="date"
                        id="date"
                        required
                        value={formData.date}
                        onChange={handleInputChange}
                        className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-800">
                      طريقة الدفع
                    </label>
                    <div className="mt-1">
                      <select
                        id="paymentMethod"
                        name="paymentMethod"
                        required
                        value={formData.paymentMethod}
                        onChange={handleInputChange}
                        className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      >
                        <option value="نقداً">نقداً</option>
                        <option value="تحويل بنكي">تحويل بنكي</option>
                        <option value="بطاقة ائتمان">بطاقة ائتمان</option>
                        <option value="شيك">شيك</option>
                      </select>
                    </div>
                  </div>

                  <div className="sm:col-span-6">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-800">
                      ملاحظات
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="notes"
                        name="notes"
                        rows={3}
                        value={formData.notes}
                        onChange={handleInputChange}
                        className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      ></textarea>
                    </div>
                  </div>

                  <div className="sm:col-span-6">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="sendWhatsapp"
                        checked={sendWhatsapp}
                        onChange={() => setSendWhatsapp(!sendWhatsapp)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="sendWhatsapp" className="mr-2 block text-sm text-gray-600">
                        إرسال إشعار للواتساب بعد الدفع
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setShowInstallments(false);
                      setSelectedStudentId(null);
                    }}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={showInstallments && (!formData.installmentNumber || !formData.feeId)}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isEditing ? 'تحديث' : 'تسجيل الدفع'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Payments List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul className="divide-y divide-gray-200">
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
                  <li key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <CreditCard className="h-6 w-6 text-primary-600" />
                          </div>
                          <div className="mr-4">
                            <h4 className="text-base font-medium text-gray-900">
                              {getStudentName(payment.studentId)}
                            </h4>
                            <div className="mt-1 flex items-center">
                              <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full bg-green-100 text-green-800">
                                {getFeeName(payment.feeId)}
                              </span>
                              {payment.installmentNumber && (
                                <span className="mr-2 px-2.5 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full bg-blue-100 text-blue-800">
                                  القسط {payment.installmentNumber}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSendWhatsApp(payment)}
                            className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                            title="إرسال رسالة واتساب"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handlePrintReceipt(payment)}
                            className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            title="طباعة إيصال"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(payment)}
                            className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                            title="تعديل"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(payment.id)}
                            className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                            title="حذف"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 sm:flex sm:justify-between">
                        <div className="sm:flex gap-6">
                          <p className="flex items-center text-sm text-gray-700">
                            <span className="font-medium">المبلغ:</span> {payment.amount.toLocaleString()} ريال
                          </p>
                          <p className="mt-2 flex items-center text-sm text-gray-700 sm:mt-0">
                            <span className="font-medium">طريقة الدفع:</span> {payment.paymentMethod}
                          </p>
                          <p className="mt-2 flex items-center text-sm text-gray-700 sm:mt-0">
                            <Calendar className="flex-shrink-0 ml-1.5 h-5 w-5 text-gray-500" />
                            <time dateTime={payment.date}>
                              {new Date(payment.date).toLocaleDateString('ar-SA')}
                            </time>
                          </p>
                        </div>
                      </div>
                      {payment.notes && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">{payment.notes}</p>
                        </div>
                      )}
                    </div>
                  </li>
                ))
              ) : (
                <li className="px-4 py-6 text-center text-gray-500">
                  {searchTerm ? 'لا توجد نتائج مطابقة للبحث' : 'لا توجد مدفوعات مسجلة بعد'}
                </li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default Payments;
 