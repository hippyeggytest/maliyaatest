import  { Book } from 'lucide-react';

export const Logo = ({ className }: { className?: string }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-700 shadow-md">
        <Book className="h-6 w-6 text-white" />
      </div>
      <span className="mr-2 text-lg font-bold text-primary-700 font-tajawal">نظام المالية</span>
    </div>
  );
};
 