import  { AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  type: AlertType;
  title?: string;
  message: string;
  className?: string;
  onClose?: () => void;
}

const getIcon = (type: AlertType) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-400" />;
    case 'error':
      return <AlertCircle className="h-5 w-5 text-red-400" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
    case 'info':
      return <Info className="h-5 w-5 text-blue-400" />;
    default:
      return null;
  }
};

const getColorClasses = (type: AlertType) => {
  switch (type) {
    case 'success':
      return 'bg-green-50 text-green-800';
    case 'error':
      return 'bg-red-50 text-red-800';
    case 'warning':
      return 'bg-yellow-50 text-yellow-800';
    case 'info':
      return 'bg-blue-50 text-blue-800';
    default:
      return '';
  }
};

export const Alert = ({ type, title, message, className = '', onClose }: AlertProps) => {
  const colorClasses = getColorClasses(type);
  const icon = getIcon(type);

  return (
    <div className={`rounded-md p-4 ${colorClasses} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0 ml-3">{icon}</div>
        <div className="flex-1">
          {title && <h3 className="text-sm font-medium">{title}</h3>}
          <div className={`text-sm ${title ? 'mt-2' : ''}`}>{message}</div>
        </div>
        {onClose && (
          <button
            type="button"
            className={`mr-auto -my-1.5 bg-transparent p-1.5 hover:bg-${type}-100 focus:ring-2 focus:ring-${type}-400 rounded-md`}
            onClick={onClose}
          >
            <span className="sr-only">إغلاق</span>
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;
 