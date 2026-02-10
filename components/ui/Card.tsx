import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    interactive?: boolean;
    glass?: boolean;
    hover?: boolean;
}

export function Card({ 
    children, 
    className = '', 
    interactive = false, 
    glass = false,
    hover = true,
    ...props 
}: CardProps) {
    const baseStyles = 'tc-card';
    const interactiveStyles = interactive ? 'tc-card-interactive' : '';
    const hoverStyles = hover ? '' : 'hover:shadow-sm hover:border-[color:var(--surface-border)]';
    
    return (
        <div className={`${baseStyles} ${interactiveStyles} ${hoverStyles} ${className}`} {...props}>
            {children}
        </div>
    );
}
