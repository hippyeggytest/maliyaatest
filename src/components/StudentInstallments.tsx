import  { useState, useEffect, useRef } from 'react';
import { ArrowRight, User, AlertCircle, CheckCircle, X, Search } from 'lucide-react';
import db from '../db';
import { Student, Installment, Fee } from '../types';
import InstallmentCard from './InstallmentCard.tsx';
 
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { generateReceipt } from '../utils/pdfGenerator';

interface StudentInstallmentsProps {
  studentId: number;
  onBack: () => void;
}

const StudentInstallments = ({ studentId, onBack }: StudentInstallmentsProps) => {
  const { user } = useAuth();
  const { currentSchool } = useApp();
  const [student, setStudent] = useState<Student | null>(null);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [filteredInstallments, setFilteredInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid' | 'partial' | 'overdue'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('نقداً');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [sendReceipt, setSendReceipt] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!studentId) return;
        
        // Fetch student
        const fetchedStudent = await db.students.get(studentId);
        if (!fetchedStudent) {
          console.error('Student not found');
          return;
        }
        setStudent(fetchedStudent);
        
        // Fetch installments
        const fetchedInstallments = await db.table('installments')
          .where('studentId').equals(studentId)
          .toArray() as Installment[];
        setInstallments(fetchedInstallments);
        
        // Fetch all fees - Fix: Use where() instead of bulkGet with possible undefined IDs
        if (fetchedInstallments.length > 0) {
          const feeIds = [...new Set(fetchedInstallments.map(i => i.feeId))];
          // Only fetch fees that have valid IDs
          const validFeeIds = feeIds.filter(id => id !== undefined);
          if (validFeeIds.length > 0) {
            const fetchedFees = await db.fees.bulkGet(validFeeIds);
            setFees(fetchedFees.filter(Boolean) as Fee[]);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [studentId]);

  useEffect(() => {
    // Apply filtering
    let filtered = [...installments];
    
    // Filter by status
    if (filter === 'paid') {
      filtered = filtered.filter(i => i.status === 'paid');
    } else if (filter === 'unpaid') {
      filtered = filtered.filter(i => i.status === 'unpaid');
    } else if (filter === 'partial') {
      filtered = filtered.filter(i => i.status === 'partial');
    } else if (filter === 'overdue') {
      filtered = filtered.filter(i => i.status !== 'paid' && new Date(i.dueDate) < new Date());
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(installment => {
        const fee = fees.find(f => f.id === installment.feeId);
        return fee?.name.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }
    
    // Sort by due date (closest first)
    filtered.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    
    setFilteredInstallments(filtered);
  }, [installments, filter, searchTerm, fees]);

  const handleFilterChange = (newFilter: 'all' | 'paid' | 'unpaid' | 'partial' | 'overdue') => {
    setFilter(newFilter);
  };

  const handlePaymentClick = (installment: Installment) => {
    setSelectedInstallment(installment);
    
    // Default to remaining amount for partial payments
    if (installment.status === 'partial') {
      const remainingAmount = installment.amount - (installment.paidAmount || 0);
      setPaymentAmount(remainingAmount.toString());
    } else {
      setPaymentAmount(installment.amount.toString());
    }
    
    setShowPaymentForm(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedInstallment || !student) return;
    
    try {
      const amount = parseFloat(paymentAmount);
      if (isNaN(amount) || amount <= 0) {
        setConfirmationMessage('الرجاء إدخال مبلغ صحيح');
        return;
      }
      
      // Calculate new status and paid amount
      const totalPaid = (selectedInstallment.paidAmount || 0) + amount;
      const newStatus = totalPaid >= selectedInstallment.amount ? 'paid' : 'partial';
      
      // Update installment
      if (selectedInstallment.id) {
        await db.table('installments').update(selectedInstallment.id, {
          status: newStatus,
          paidAmount: totalPaid,
          paidDate: new Date().toISOString()
        });
      }
      
      // Create payment record
      const fee = fees.find(f => f.id === selectedInstallment.feeId);
      if (!fee) return;
      
      const paymentId = await db.payments.add({
        amount,
        date: new Date().toISOString(),
        studentId: student.id!,
        feeId: fee.id!,
        schoolId: user?.schoolId!,
        paymentMethod,
        notes: paymentNotes,
        installmentNumber: selectedInstallment.number
      });
      
      // Generate receipt if requested
      if (sendReceipt && currentSchool) {
        await generateReceipt({
          receiptNumber: `R-${Date.now().toString().slice(-6)}`,
          date: new Date().toISOString(),
          schoolName: currentSchool.name,
          schoolLogo: currentSchool.logo,
          studentName: student.name,
          grade: student.grade,
          feeName: `${fee.name} - القسط ${selectedInstallment.number}`,
          amount,
          paymentMethod,
          notes: paymentNotes
        });
      }
      
      // Send WhatsApp confirmation if requested
      if (sendReceipt) {
        sendPaymentWhatsApp(student, fee, amount, paymentMethod);
      }
      
      // Reset form and refresh data
      setShowPaymentForm(false);
      setPaymentAmount('');
      setPaymentMethod('نقداً');
      setPaymentNotes('');
      setSendReceipt(false);
      setSelectedInstallment(null);
      
      // Refresh installments
      const updatedInstallments = await db.table('installments')
        .where('studentId').equals(studentId)
        .toArray() as Installment[];
      setInstallments(updatedInstallments);
      
      setConfirmationMessage('تم تسجيل الدفعة بنجاح');
      setTimeout(() => setConfirmationMessage(null), 3000);
    } catch (error) {
      console.error('Error processing payment:', error);
      setConfirmationMessage('حدث خطأ أثناء تسجيل الدفعة');
    }
  };

  const handleSendReminder = async (installment: Installment) => {
    if (!student) return;
    
    try {
      const fee = fees.find(f => f.id === installment.feeId);
      if (!fee) return;
      
      // Generate receipt if it's a paid installment
      if (installment.status === 'paid' && currentSchool) {
        await generateReceipt({
          receiptNumber: `R-${Date.now().toString().slice(-6)}`,
          date: installment.paidDate || new Date().toISOString(),
          schoolName: currentSchool.name,
          schoolLogo: currentSchool.logo,
          studentName: student.name,
          grade: student.grade,
          feeName: `${fee.name} - القسط ${installment.number}`,
          amount: installment.paidAmount || installment.amount,
          paymentMethod: 'نقداً',
          notes: ''
        });
        return;
      }
      
      // For unpaid installments, send WhatsApp reminder
      sendReminderWhatsApp(student, fee, installment);
    } catch (error) {
      console.error('Error sending reminder:', error);
    }
  };

  const sendReminderWhatsApp = (student: Student, fee: Fee, installment: Installment) => {
    // Format phone number for WhatsApp
    let phoneNumber = student.parentPhone.replace(/[^0-9]/g, '');
    
    // Make sure the phone number starts with the country code
    if (!phoneNumber.startsWith('968')) {
      phoneNumber = '968' + phoneNumber;
    }
    
    const dueDate = new Date(installment.dueDate).toLocaleDateString('ar-SA');
    const isOverdue = new Date(installment.dueDate) < new Date();
    
    // Create message content
    let message = '';
    if (isOverdue) {
      message = `السلام عليكم ورحمة الله وبركاته\nالأخ الكريم / ${student.parentName}\nنود تذكيركم بأن القسط رقم ${installment.number} من ${fee.name} للطالب ${student.name} في الصف ${student.grade} متأخر عن موعد استحقاقه (${dueDate}).\nمبلغ القسط: ${installment.amount} ريال\n${installment.status === 'partial' ? `المبلغ المتبقي: ${installment.amount - (installment.paidAmount || 0)} ريال` : ''}\nنرجو التكرم بسداد المبلغ في أقرب وقت ممكن.\nمع خالص الشكر والتقدير,\nإدارة المدرسة`;
    } else {
      message = `السلام عليكم ورحمة الله وبركاته\nالأخ الكريم / ${student.parentName}\nنود تذكيركم بموعد استحقاق القسط رقم ${installment.number} من ${fee.name} للطالب ${student.name} في الصف ${student.grade} بتاريخ ${dueDate}.\nمبلغ القسط: ${installment.amount} ريال\n${installment.status === 'partial' ? `المبلغ المتبقي: ${installment.amount - (installment.paidAmount || 0)} ريال` : ''}\nنرجو التكرم بسداد المبلغ في الموعد المحدد.\nمع خالص الشكر والتقدير,\nإدارة المدرسة`;
    }
    
    // Create WhatsApp link with pre-filled message
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    // Open in a new tab
    window.open(whatsappUrl, '_blank');
  };

  const sendPaymentWhatsApp = (student: Student, fee: Fee, amount: number, paymentMethod: string) => {
    // Format phone number for WhatsApp
    let phoneNumber = student.parentPhone.replace(/[^0-9]/g, '');
    
    // Make sure the phone number starts with the country code
    if (!phoneNumber.startsWith('968')) {
      phoneNumber = '968' + phoneNumber;
    }
    
    // Create confirmation message
    const message = `السلام عليكم ورحمة الله وبركاته\nالأخ الكريم / ${student.parentName}\nنشكركم على سداد ${selectedInstallment ? `القسط ${selectedInstallment.number} من ` : ''}${fee.name} للطالب ${student.name} في الصف ${student.grade}.\nالمبلغ المدفوع: ${amount} ريال\nطريقة الدفع: ${paymentMethod}\nتاريخ الدفع: ${new Date().toLocaleDateString('ar-SA')}\nمع خالص الشكر والتقدير,\nإدارة المدرسة`;
    
    // Create WhatsApp link with pre-filled message
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    // Open in a new tab
    window.open(whatsappUrl, '_blank');
  };

  const handleEditInstallment = (installment: Installment) => {
    // In a real implementation, you'd show an edit form
    console.log('Edit installment:', installment);
  };

  const handleDeleteInstallment = async (installment: Installment) => {
    if (!installment.id) return;
    
    if (confirm('هل أنت متأكد من حذف هذا القسط؟')) {
      try {
        await db.table('installments').delete(installment.id);
        
        // Refresh installments
        const updatedInstallments = await db.table('installments')
          .where('studentId').equals(studentId)
          .toArray() as Installment[];
        setInstallments(updatedInstallments);
        
        setConfirmationMessage('تم حذف القسط بنجاح');
        setTimeout(() => setConfirmationMessage(null), 3000);
      } catch (error) {
        console.error('Error deleting installment:', error);
        setConfirmationMessage('حدث خطأ أثناء حذف القسط');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100">
            <ArrowRight className="h-5 w-5 text-gray-600" />
          </button>
          
          <div>
            <h2 className="text-lg font-bold">{student?.name}</h2>
            <p className="text-sm text-gray-600">{student?.grade} - {student?.parentName}</p>
          </div>
          
          <div className="w-8"></div> {/* Spacer for alignment */}
        </div>
        
        <div className="px-4 py-3">
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-3 py-1 text-sm rounded-full ${
                filter === 'all' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              } transition-colors`}
            >
              الكل
            </button>
            <button
              onClick={() => handleFilterChange('unpaid')}
              className={`px-3 py-1 text-sm rounded-full ${
                filter === 'unpaid' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-red-100 text-red-800 hover:bg-red-200'
              } transition-colors`}
            >
              غير مدفوع
            </button>
            <button
              onClick={() => handleFilterChange('partial')}
              className={`px-3 py-1 text-sm rounded-full ${
                filter === 'partial' 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
              } transition-colors`}
            >
              مدفوع جزئياً
            </button>
            <button
              onClick={() => handleFilterChange('paid')}
              className={`px-3 py-1 text-sm rounded-full ${
                filter === 'paid' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-green-100 text-green-800 hover:bg-green-200'
              } transition-colors`}
            >
              مدفوع
            </button>
            <button
              onClick={() => handleFilterChange('overdue')}
              className={`px-3 py-1 text-sm rounded-full ${
                filter === 'overdue' 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
              } transition-colors`}
            >
              متأخر
            </button>
          </div>
          
          {confirmationMessage && (
            <div className={`mb-4 p-3 rounded-md text-sm ${
              confirmationMessage.includes('خطأ') 
                ? 'bg-red-100 text-red-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {confirmationMessage}
            </div>
          )}
          
          <div className="relative mb-4">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="البحث عن أقساط..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
          
          {filteredInstallments.length > 0 ? (
            <div>
              {filteredInstallments.map((installment) => {
                const fee = fees.find(f => f.id === installment.feeId);
                if (!fee || !student) return null;
                
                return (
                  <InstallmentCard
                    key={installment.id}
                    installment={installment}
                    student={student}
                    fee={fee}
                    onPayment={(installment, sendReceipt) => {
                      setSendReceipt(sendReceipt);
                      handlePaymentClick(installment);
                    }}
                    onEdit={handleEditInstallment}
                    onDelete={handleDeleteInstallment}
                    onSendReminder={handleSendReminder}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-10 w-10 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد أقساط</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter !== 'all' 
                  ? 'لا توجد أقساط مطابقة للمعايير المحددة' 
                  : 'لا توجد أقساط مسجلة لهذا الطالب'}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Payment Form Modal */}
      {showPaymentForm && selectedInstallment && (
        <div className="fixed inset-0 z-10 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-right overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full p-6">
              <div className="absolute top-0 left-0 pt-4 pr-4">
                <button
                  type="button"
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                  onClick={() => setShowPaymentForm(false)}
                >
                  <span className="sr-only">إغلاق</span>
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                تسجيل دفعة
              </h3>
              
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-medium">الطالب:</span> {student?.name}</div>
                  <div><span className="font-medium">الصف:</span> {student?.grade}</div>
                  
                  {fees.find(f => f.id === selectedInstallment.feeId) && (
                    <div><span className="font-medium">الرسوم:</span> {fees.find(f => f.id === selectedInstallment.feeId)?.name}</div>
                  )}
                  
                  <div><span className="font-medium">القسط:</span> {selectedInstallment.number}</div>
                  <div><span className="font-medium">المبلغ الإجمالي:</span> {selectedInstallment.amount.toLocaleString()} ريال</div>
                  
                  {selectedInstallment.status === 'partial' && (
                    <>
                      <div><span className="font-medium">المدفوع سابقاً:</span> {(selectedInstallment.paidAmount || 0).toLocaleString()} ريال</div>
                      <div><span className="font-medium">المتبقي:</span> {(selectedInstallment.amount - (selectedInstallment.paidAmount || 0)).toLocaleString()} ريال</div>
                    </>
                  )}
                </div>
              </div>
              
              <form className="space-y-4">
                <div>
                  <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700">
                    المبلغ
                  </label>
                  <input
                    type="number"
                    id="paymentAmount"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
                    طريقة الدفع
                  </label>
                  <select
                    id="paymentMethod"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value="نقداً">نقداً</option>
                    <option value="تحويل بنكي">تحويل بنكي</option>
                    <option value="بطاقة ائتمان">بطاقة ائتمان</option>
                    <option value="شيك">شيك</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="paymentNotes" className="block text-sm font-medium text-gray-700">
                    ملاحظات
                  </label>
                  <textarea
                    id="paymentNotes"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  ></textarea>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sendReceiptCheck"
                    checked={sendReceipt}
                    onChange={() => setSendReceipt(!sendReceipt)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="sendReceiptCheck" className="mr-2 block text-sm text-gray-600">
                    إرسال إيصال للواتساب بعد الدفع
                  </label>
                </div>
              </form>
              
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  onClick={() => setShowPaymentForm(false)}
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  onClick={handlePaymentSubmit}
                >
                  تسجيل الدفع
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentInstallments;
 