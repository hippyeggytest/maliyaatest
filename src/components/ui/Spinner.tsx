interface  SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'white';
  className?: string;
}

export const Spinner = ({ 
  size = 'medium', 
  color = 'primary',
  className = ''
}: SpinnerProps) => {
  const sizeClasses = {
    small: 'h-4 w-4 border-2',
    medium: 'h-8 w-8 border-2',
    large: 'h-12 w-12 border-3'
  };

  const colorClasses = {
    primary: 'border-primary-500',
    white: 'border-white'
  };

  return (
    <div 
      className={`inline-block border-t-transparent rounded-full animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      role="status"
      aria-label="جاري التحميل..."
    >
      <span className="sr-only">جاري التحميل...</span>
    </div>
  );
};

export default Spinner;
 