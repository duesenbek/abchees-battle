import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'glass' | 'solid';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'glass', padding = 'md', children, ...props }, ref) => {
    
    const baseStyles = 'rounded-[var(--radius-xl)] overflow-hidden transition-all duration-300';
    
    const variants = {
      glass: 'bg-[var(--color-surface)] backdrop-blur-md border border-white/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05),0_8px_32px_0_rgba(0,0,0,0.3)]',
      solid: 'bg-slate-800 border border-slate-700 shadow-xl',
    };

    const paddings = {
      none: 'p-0',
      sm: 'p-4', // 16px
      md: 'p-6', // 24px
      lg: 'p-8', // 32px
    };

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
