import  { FileText } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState = ({ 
  title, 
  message, 
  icon = <FileText className="h-12 w-12 text-gray-400" />,
  action 
}: EmptyStateProps) => {
  return (
    <div className="text-center py-12 px-4 bg-white rounded-lg shadow">
      <div className="flex justify-center">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
      {message && (
        <p className="mt-2 text-sm text-gray-500">{message}</p>
      )}
      {action && (
        <div className="mt-6">{action}</div>
      )}
    </div>
  );
};

export default EmptyState;
 