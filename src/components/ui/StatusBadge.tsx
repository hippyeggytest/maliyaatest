type  StatusType = 'paid' | 'unpaid' | 'partial' | 'pending';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export const StatusBadge = ({ status, className = '' }: StatusBadgeProps) => {
  const statusLabels = {
    paid: 'مدفوع',
    unpaid: 'غير مدفوع',
    partial: 'مدفوع جزئياً',
    pending: 'قيد الانتظار'
  };

  const statusClasses = {
    paid: 'bg-green-100 text-green-800',
    unpaid: 'bg-red-100 text-red-800',
    partial: 'bg-orange-100 text-orange-800',
    pending: 'bg-blue-100 text-blue-800'
  };

  return (
    <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${statusClasses[status]} ${className}`}>
      {statusLabels[status]}
    </span>
  );
};

export default StatusBadge;
 