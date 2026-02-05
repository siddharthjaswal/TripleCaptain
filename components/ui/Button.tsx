import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    loading?: boolean;
}

export function Button({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    loading = false,
    className = '',
    disabled,
    ...props 
}: ButtonProps) {
    const baseStyles = 'tc-button';
    
    const variants = {
        primary: 'tc-button-primary',
        outline: 'tc-button-outline',
        ghost: 'hover:bg-[color:var(--surface-hover)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-5 py-2.5 text-sm',
        lg: 'px-8 py-3.5 text-base',
        icon: 'p-2',
    };

    const combinedClassName = `${baseStyles} ${variants[variant]} ${sizes[size]} ${loading || disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`;

    return (
        <button className={combinedClassName} disabled={loading || disabled} {...props}>
            {loading ? (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : null}
            {children}
        </button>
    );
}
