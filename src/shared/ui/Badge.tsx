import React from 'react';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    
    const baseStyles = 'inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-semibold rounded-[var(--radius-sm)] border backdrop-blur-sm';
    
    const variants = {
      default: 'bg-white/5 text-white/80 border-white/10',
      primary: 'bg-primary/20 text-violet-300 border-primary/30',
      success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      error: 'bg-red-500/20 text-red-400 border-red-500/30',
    };

    return (
      <span
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
