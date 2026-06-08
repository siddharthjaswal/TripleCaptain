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
        display: 'font-display text-5xl md:text-7xl tracking-[-0.03em] uppercase font-black leading-[0.9]',
        title: 'font-display text-2xl md:text-3xl tracking-tight font-extrabold',
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
