import  React, { Fragment, ReactNode } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
  size?: 'small' | 'medium' | 'large';
}

export const Dialog = ({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  actions, 
  children,
  size = 'medium' 
}: DialogProps) => {
  if (!isOpen) return null;

  const sizeClasses = {
    small: 'sm:max-w-md',
    medium: 'sm:max-w-lg',
    large: 'sm:max-w-2xl',
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          aria-hidden="true"
          onClick={onClose}
        ></div>

        {/* This element is to trick the browser into centering the modal contents. */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className={`inline-block align-bottom bg-white rounded-lg text-right overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle ${sizeClasses[size]} sm:w-full px-4 pt-5 pb-4 sm:p-6`}>
          <div className="hidden sm:block absolute top-0 left-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={onClose}
            >
              <span className="sr-only">إغلاق</span>
              <X className="h-6 w-6" />
            </button>
          </div>

          <div>
            <div className="mt-3 sm:mt-0 sm:ml-4 sm:text-right">
              <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                {title}
              </h3>
              {description && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    {description}
                  </p>
                </div>
              )}
              
              {children && (
                <div className="mt-4">
                  {children}
                </div>
              )}
            </div>
          </div>
          
          {actions && (
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dialog;
 