import  { useState } from 'react';
import { MessageCircle, Edit, Trash, AlertCircle, CheckCircle, Printer, Clock } from 'lucide-react';
import { Installment, Student, Fee } from '../types';

interface InstallmentCardProps {
  installment: Installment;
  student: Student;
  fee: Fee;
  onPayment: (installment: Installment, sendReceipt: boolean) => void;
  onEdit: (installment: Installment) => void;
  onDelete: (installment: Installment) => void;
  onSendReminder: (installment: Installment) => void;
}

const InstallmentCard = ({ 
  installment, 
  student, 
  fee,
  onPayment,
  onEdit,
  onDelete,
  onSendReminder
}: InstallmentCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [sendReceipt, setSendReceipt] = useState(false);

  const isPaid = installment.status === 'paid';
  const isPartial = installment.status === 'partial';
  const isOverdue = !isPaid && new Date(installment.dueDate) < new Date();

  const statusColor = 
    isPaid ? 'bg-green-50 border-green-200' : 
    isPartial ? 'bg-orange-50 border-orange-200' : 
    isOverdue ? 'bg-red-50 border-red-200' : 
    'bg-blue-50 border-blue-200';

  const iconColor =
    isPaid ? 'text-green-600 bg-green-100' : 
    isPartial ? 'text-orange-600 bg-orange-100' : 
    isOverdue ? 'text-red-600 bg-red-100' : 
    'text-blue-600 bg-blue-100';

  const icon = 
    isPaid ? <CheckCircle className="h-6 w-6" /> : 
    isPartial ? <AlertCircle className="h-6 w-6" /> : 
    isOverdue ? <Clock className="h-6 w-6" /> :
    <AlertCircle className="h-6 w-6" />;

  const paymentText = 
    isPaid ? 'تم الدفع بالكامل' : 
    isPartial ? `مدفوع جزئياً (${installment.paidAmount?.toLocaleString() || 0} ريال)` : 
    'غير مدفوع';

  const statusText = 
    isPaid ? 'مدفوع' : 
    isPartial ? 'مدفوع جزئي' : 
    isOverdue ? 'متأخر' : 
    'قيد الانتظار';

  return (
    <div className={`rounded-lg shadow-sm overflow-hidden mb-4 border transition-all ${statusColor} hover:shadow-md`}>
      <div className="px-4 py-3 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center">
          <div className={`p-2 rounded-full mr-3 ${iconColor}`}>
            {icon}
          </div>
          <div>
            <div className="flex items-center">
              <h3 className="text-base font-medium">{fee.name}</h3>
              <span className="mx-2 text-gray-500">•</span>
              <span className="text-sm">القسط {installment.number}</span>
            </div>
            <div className="text-sm text-gray-600">
              {installment.amount.toLocaleString()} ريال - تاريخ الاستحقاق: {new Date(installment.dueDate).toLocaleDateString('ar-SA')}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className={`inline-flex items-center rounded-full text-xs px-2.5 py-0.5 font-medium
            ${isPaid ? 'bg-green-100 text-green-800' : 
              isPartial ? 'bg-orange-100 text-orange-800' : 
              isOverdue ? 'bg-red-100 text-red-800' : 
              'bg-blue-100 text-blue-800'
            }`}>
            {statusText}
          </span>
          <span className="text-sm mt-1 text-gray-600">{paymentText}</span>
        </div>
      </div>

      {expanded && (
        <div className="px-4 py-3 bg-white border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">بيانات القسط</h4>
              <ul className="text-sm space-y-1">
                <li><span className="font-medium">الطالب:</span> {student.name}</li>
                <li><span className="font-medium">الصف:</span> {student.grade}</li>
                <li><span className="font-medium">ولي الأمر:</span> {student.parentName}</li>
                <li><span className="font-medium">رقم الهاتف:</span> {student.parentPhone}</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">بيانات الدفع</h4>
              <ul className="text-sm space-y-1">
                <li><span className="font-medium">مبلغ القسط:</span> {installment.amount.toLocaleString()} ريال</li>
                {isPartial && (
                  <>
                    <li><span className="font-medium">المدفوع:</span> {(installment.paidAmount || 0).toLocaleString()} ريال</li>
                    <li><span className="font-medium">المتبقي:</span> {(installment.amount - (installment.paidAmount || 0)).toLocaleString()} ريال</li>
                  </>
                )}
                <li><span className="font-medium">تاريخ الاستحقاق:</span> {new Date(installment.dueDate).toLocaleDateString('ar-SA')}</li>
                {installment.paidDate && (
                  <li><span className="font-medium">تاريخ الدفع:</span> {new Date(installment.paidDate).toLocaleDateString('ar-SA')}</li>
                )}
              </ul>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4 border-t pt-4">
            {!isPaid && (
              <div className="w-full mb-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={`send-receipt-${installment.id}`}
                    checked={sendReceipt}
                    onChange={() => setSendReceipt(!sendReceipt)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`send-receipt-${installment.id}`} className="mr-2 block text-sm text-gray-600">
                    إرسال تأكيد للواتساب بعد الدفع
                  </label>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {!isPaid && (
                <button
                  onClick={() => onPayment(installment, sendReceipt)}
                  className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none transition-colors"
                >
                  <CheckCircle className="ml-1 h-4 w-4" />
                  {isPartial ? 'استكمال الدفع' : 'تسجيل الدفع'}
                </button>
              )}

              {isPaid && (
                <button
                  onClick={() => onSendReminder(installment)}
                  className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none transition-colors"
                >
                  <Printer className="ml-1 h-4 w-4" />
                  طباعة إيصال
                </button>
              )}

              {!isPaid && (
                <button
                  onClick={() => onSendReminder(installment)}
                  className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-colors"
                >
                  <MessageCircle className="ml-1 h-4 w-4" />
                  إرسال تذكير
                </button>
              )}

              <button
                onClick={() => onEdit(installment)}
                className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none transition-colors"
              >
                <Edit className="ml-1 h-4 w-4" />
                تعديل
              </button>

              <button
                onClick={() => onDelete(installment)}
                className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none transition-colors"
              >
                <Trash className="ml-1 h-4 w-4" />
                حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstallmentCard;
 