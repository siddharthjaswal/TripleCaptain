import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
    className?: string;
}

export function Badge({ children, variant = 'primary', className = '' }: BadgeProps) {
    const baseStyles = 'tc-badge';
    
    const variants = {
        primary: 'bg-[color:var(--accent)] text-[color:var(--accent-contrast)]',
        secondary: 'bg-[color:var(--surface-hover)] text-[color:var(--text-secondary)]',
        success: 'bg-[color:var(--success-bg)] text-[color:var(--success-text)] border border-[color:var(--success-border)]',
        warning: 'bg-[color:var(--warning-bg)] text-[color:var(--warning-text)] border border-[color:var(--warning-border)]',
        error: 'bg-[color:var(--error-bg)] text-[color:var(--error-text)] border border-[color:var(--error-border)]',
    };

    return (
        <span className={`${baseStyles} ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
}
