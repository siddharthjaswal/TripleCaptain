import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    interactive?: boolean;
}

export function Card({ children, className = '', interactive = false, ...props }: CardProps) {
    const baseStyles = 'tc-card';
    const interactiveStyles = interactive ? 'tc-card-interactive' : '';
    
    return (
        <div className={`${baseStyles} ${interactiveStyles} ${className}`} {...props}>
            {children}
        </div>
    );
}
