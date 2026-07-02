import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, leftIcon, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-sm font-medium text-white/80 ml-1">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-4 text-white/40 pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full bg-black/40 border outline-none transition-all duration-200
              text-white placeholder:text-white/40 rounded-2xl h-[54px] text-[18px]
              ${leftIcon ? 'pl-12 pr-5' : 'px-5'}
              ${error 
                ? 'border-error/50 focus:border-error focus:ring-2 focus:ring-error/50' 
                : 'border-white/10 focus:border-primary/50 focus:bg-black/60 focus:ring-2 focus:ring-primary/60 focus:shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:border-white/20'
              }
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <span className="text-xs text-error ml-1 font-medium animate-fade-in">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
