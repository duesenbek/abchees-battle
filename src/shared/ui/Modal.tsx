import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Card } from './Card';

export interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className={`relative w-full ${maxWidthClasses[maxWidth]} animate-slide-in z-10`}>
        <Card variant="glass" padding="none" className="flex flex-col max-h-[90vh]">
          {/* Header */}
          {(title || onClose) && (
            <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
              {title && <h2 className="text-xl font-display font-bold text-white">{title}</h2>}
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 -mr-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors ml-auto"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          )}
          
          {/* Body */}
          <div className="p-6 overflow-y-auto">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="p-6 border-t border-white/10 bg-black/20 shrink-0">
              {footer}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
