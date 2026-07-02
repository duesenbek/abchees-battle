import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', icon, fullWidth, children, ...props }, ref) => {
    
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-display font-semibold transition-all duration-200 outline-none active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-primary text-white shadow-[0_4px_15px_var(--color-primary-glow)] hover:bg-violet-700 hover:shadow-[0_6px_20px_var(--color-primary-glow)] hover:-translate-y-0.5 border border-white/10',
      secondary: 'bg-secondary text-white shadow-[0_4px_15px_var(--color-secondary-glow)] hover:bg-blue-600 hover:shadow-[0_6px_20px_var(--color-secondary-glow)] hover:-translate-y-0.5 border border-white/10',
      success: 'bg-emerald-500 text-white shadow-[0_4px_15px_rgba(16,185,129,0.4)] hover:bg-emerald-600 hover:-translate-y-0.5',
      danger: 'bg-error text-white shadow-[0_4px_15px_rgba(239,68,68,0.4)] hover:bg-red-600 hover:-translate-y-0.5',
      ghost: 'bg-white/5 text-white/90 hover:bg-white/10 hover:text-white border border-white/10 backdrop-blur-sm',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-[var(--radius-sm)]',
      md: 'px-5 py-2.5 text-base rounded-[var(--radius-md)]',
      lg: 'px-8 py-4 text-lg rounded-[var(--radius-md)]',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
