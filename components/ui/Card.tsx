import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    glass?: boolean;
    hover?: boolean;
}

export function Card({ children, className = '', glass = false, hover = true }: CardProps) {
    const baseStyles = glass ? 'tc-card-glass' : 'tc-card';
    const hoverStyles = hover ? 'hover:-translate-y-1' : '';
    
    return (
        <div className={`${baseStyles} ${hoverStyles} ${className}`}>
            {children}
        </div>
    );
}
