import  { useState, useEffect } from 'react';
import { ArrowRight, Calendar, CreditCard, User, Check, AlertCircle, Printer, MessageCircle } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Installment, Student, Fee } from '../../types';
import db from '../../db';
import { generateReceipt } from '../../utils/pdfGenerator';
import { useApp } from '../../contexts/AppContext';

const InstallmentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentSchool } = useApp();
  
  const [installment, setInstallment] = useState<Installment | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [fee, setFee] = useState<Fee | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPayForm, setShowPayForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('نقداً');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [sendReceipt, setSendReceipt] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        // Fetch installment
        const installmentData = await db.table('installments').get(parseInt(id)) as Installment;
        if (!installmentData) {
          setLoading(false);
          return;
        }
        
        setInstallment(installmentData);
        
        // Fetch student
        const studentData = await db.students.get(installmentData.studentId);
        if (studentData) setStudent(studentData);
        
        // Fetch fee
        const feeData = await db.fees.get(installmentData.feeId);
        if (feeData) setFee(feeData);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching installment data:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleSendReminder = () => {
    if (!student || !fee || !installment) return;
    
    // Format phone number for WhatsApp
    let phoneNumber = student.parentPhone.replace(/[^0-9]/g, '');
    
    // Make sure the phone number starts with the country code
    if (!phoneNumber.startsWith('968')) {
      phoneNumber = '968' + phoneNumber;
    }
    
    const dueDate = new Date(installment.dueDate).toLocaleDateString('ar-SA');
    const isOverdue = new Date(installment.dueDate) < new Date();
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

  const handleGenerateReceipt = async () => {
    if (!installment || !student || !fee || !currentSchool) return;
    
    try {
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
    } catch (error) {
      console.error('Error generating receipt:', error);
      alert('حدث خطأ أثناء إنشاء الإيصال');
    }
  };

  const handlePayment = () => {
    if (!installment) return;
    
    // For partial payments, default to remaining amount
    if (installment.status === 'partial') {
      const remaining = installment.amount - (installment.paidAmount || 0);
      setPaymentAmount(remaining.toString());
    } else {
      setPaymentAmount(installment.amount.toString());
    }
    
    setShowPayForm(true);
  };

  const handleSubmitPayment = async () => {
    if (!installment || !student || !fee) return;
    
    try {
      const amount = parseFloat(paymentAmount);
      if (isNaN(amount) || amount <= 0) {
        alert('الرجاء إدخال مبلغ صحيح');
        return;
      }
      
      // Calculate new status and amount
      const totalPaid = (installment.paidAmount || 0) + amount;
      const newStatus = totalPaid >= installment.amount ? 'paid' : 'partial';
      
      // Update installment status
      await db.table('installments').update(installment.id!, {
        status: newStatus,
        paidAmount: totalPaid,
        paidDate: new Date().toISOString()
      });
      
      // Create payment record
      await db.payments.add({
        amount,
        date: new Date().toISOString(),
        studentId: student.id!,
        feeId: fee.id!,
        schoolId: fee.schoolId,
        paymentMethod,
        notes: `دفع القسط ${installment.number} - ${paymentNotes}`,
        installmentNumber: installment.number
      });
      
      if (sendReceipt && currentSchool) {
        await generateReceipt({
          receiptNumber: `R-${Date.now().toString().slice(-6)}`,
          date: new Date().toISOString(),
          schoolName: currentSchool.name,
          schoolLogo: currentSchool.logo,
          studentName: student.name,
          grade: student.grade,
          feeName: `${fee.name} - القسط ${installment.number}`,
          amount,
          paymentMethod,
          notes: paymentNotes
        });
      }
      
      // Refresh the data
      const updatedInstallment = await db.table('installments').get(installment.id!) as Installment;
      setInstallment(updatedInstallment);
      
      // Close the form
      setShowPayForm(false);
      setPaymentAmount('');
      setPaymentMethod('نقداً');
      setPaymentNotes('');
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('حدث خطأ أثناء تسجيل الدفعة');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-700"></div>
      </div>
    );
  }

  if (!installment || !student || !fee) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">لم يتم العثور على القسط</h3>
        <button 
          onClick={handleBack}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none"
        >
          <ArrowRight className="ml-2 h-5 w-5" />
          العودة
        </button>
      </div>
    );
  }

  const isPaid = installment.status === 'paid';
  const isPartial = installment.status === 'partial';
  const isOverdue = !isPaid && new Date(installment.dueDate) < new Date();

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <button
              onClick={handleBack}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 mr-4">تفاصيل القسط</h2>
          </div>
        </div>
        
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">بيانات القسط</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-4">
                  <div className={`p-2 rounded-full mr-3 ${
                    isPaid ? 'bg-green-100 text-green-600' : 
                    isPartial ? 'bg-orange-100 text-orange-600' : 
                    isOverdue ? 'bg-red-100 text-red-600' : 
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {isPaid ? <Check className="h-6 w-6" /> : 
                     isPartial ? <AlertCircle className="h-6 w-6" /> : 
                     <Calendar className="h-6 w-6" />}
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-gray-900">{fee.name}</h4>
                    <p className="text-sm text-gray-600">القسط {installment.number} من {fee.installments}</p>
                  </div>
                  <div className="mr-auto">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      isPaid ? 'bg-green-100 text-green-800' : 
                      isPartial ? 'bg-orange-100 text-orange-800' : 
                      isOverdue ? 'bg-red-100 text-red-800' : 
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {isPaid ? 'مدفوع' : 
                       isPartial ? 'مدفوع جزئي' : 
                       isOverdue ? 'متأخر' : 
                       'قيد الانتظار'}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">المبلغ الإجمالي</p>
                    <p className="text-base font-semibold">{installment.amount.toLocaleString()} ريال</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">تاريخ الاستحقاق</p>
                    <p className="text-base font-semibold">{new Date(installment.dueDate).toLocaleDateString('ar-SA')}</p>
                  </div>
                  
                  {isPartial && (
                    <>
                      <div>
                        <p className="text-sm text-gray-500">المبلغ المدفوع</p>
                        <p className="text-base font-semibold text-green-600">{installment.paidAmount?.toLocaleString()} ريال</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">المبلغ المتبقي</p>
                        <p className="text-base font-semibold text-red-600">{(installment.amount - (installment.paidAmount || 0)).toLocaleString()} ريال</p>
                      </div>
                    </>
                  )}
                  
                  {isPaid && installment.paidDate && (
                    <div>
                      <p className="text-sm text-gray-500">تاريخ الدفع</p>
                      <p className="text-base font-semibold">{new Date(installment.paidDate).toLocaleDateString('ar-SA')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">بيانات الطالب</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="mr-4">
                    <h4 className="text-base font-medium text-gray-900">{student.name}</h4>
                    <p className="text-sm text-gray-600">{student.grade}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4 mt-2">
                  <div>
                    <p className="text-sm text-gray-500">ولي الأمر</p>
                    <p className="text-base font-semibold">{student.parentName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">رقم الهاتف</p>
                    <p className="text-base font-semibold">{student.parentPhone}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-between">
              <h3 className="text-lg font-medium text-gray-900">الإجراءات</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {!isPaid && (
                <button
                  onClick={handlePayment}
                  className="flex flex-col items-center justify-center py-4 px-4 border border-transparent rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none transition-all"
                >
                  <CreditCard className="mb-2 h-6 w-6" />
                  <span>{isPartial ? 'استكمال الدفع' : 'تسجيل الدفع'}</span>
                </button>
              )}
              
              <button
                onClick={handleSendReminder}
                className="flex flex-col items-center justify-center py-4 px-4 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-all"
              >
                <MessageCircle className="mb-2 h-6 w-6" />
                <span>{isPaid ? 'إرسال تأكيد' : 'إرسال تذكير'}</span>
              </button>
              
              {isPaid && (
                <button
                  onClick={handleGenerateReceipt}
                  className="flex flex-col items-center justify-center py-4 px-4 border border-transparent rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none transition-all"
                >
                  <Printer className="mb-2 h-6 w-6" />
                  <span>طباعة إيصال</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Payment Form Modal */}
      {showPayForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-right overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">تسجيل دفعة</h3>

              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-medium">الطالب:</span> {student.name}</div>
                  <div><span className="font-medium">الصف:</span> {student.grade}</div>
                  <div><span className="font-medium">القسط:</span> {fee.name} - القسط {installment.number}</div>
                  <div><span className="font-medium">المبلغ الإجمالي:</span> {installment.amount.toLocaleString()} ريال</div>
                  {isPartial && (
                    <>
                      <div><span className="font-medium">المدفوع سابقاً:</span> {(installment.paidAmount || 0).toLocaleString()} ريال</div>
                      <div><span className="font-medium">المتبقي:</span> {(installment.amount - (installment.paidAmount || 0)).toLocaleString()} ريال</div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700">المبلغ</label>
                  <input
                    type="number"
                    id="paymentAmount"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">طريقة الدفع</label>
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
                  <label htmlFor="paymentNotes" className="block text-sm font-medium text-gray-700">ملاحظات</label>
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
                    id="sendReceipt"
                    checked={sendReceipt}
                    onChange={() => setSendReceipt(!sendReceipt)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="sendReceipt" className="mr-2 block text-sm text-gray-600">
                    إرسال إيصال للواتساب بعد الدفع
                  </label>
                </div>
              </div>

              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:col-start-2 sm:text-sm"
                  onClick={handleSubmitPayment}
                >
                  تسجيل الدفع
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  onClick={() => setShowPayForm(false)}
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstallmentDetail;
 