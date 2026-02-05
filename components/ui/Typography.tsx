import React from 'react';

interface TextProps {
    children: React.ReactNode;
    className?: string;
    as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span';
    variant?: 'display' | 'title' | 'body' | 'caption';
    weight?: 'normal' | 'medium' | 'bold' | 'black';
}

export function Typography({ 
    children, 
    className = '', 
    as: Component = 'p', 
    variant = 'body',
    weight = 'normal'
}: TextProps) {
    const variants = {
        display: 'text-4xl md:text-6xl tracking-tight uppercase font-black',
        title: 'text-2xl md:text-3xl tracking-tight',
        body: 'text-base leading-relaxed',
        caption: 'text-xs uppercase tracking-widest text-[color:var(--text-tertiary)]',
    };

    const weights = {
        normal: 'font-normal',
        medium: 'font-medium',
        bold: 'font-bold',
        black: 'font-black',
    };

    return (
        <Component className={`${variants[variant]} ${weights[weight]} ${className}`}>
            {children}
        </Component>
    );
}
