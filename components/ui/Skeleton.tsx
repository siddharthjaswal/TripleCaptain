import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  variant?: 'text' | 'rectangular' | 'circular';
}

export function Skeleton({ 
  className = '', 
  width, 
  height,
  variant = 'rectangular'
}: SkeletonProps) {
  const variantStyles = {
    text: 'h-4',
    rectangular: 'h-24',
    circular: 'rounded-full aspect-square',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div 
      className={`tc-skeleton ${variantStyles[variant]} ${className}`}
      style={style}
      aria-label="Loading..."
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="tc-card p-6 space-y-4">
      <Skeleton variant="text" width="60%" />
      <Skeleton variant="rectangular" />
      <div className="flex gap-4">
        <Skeleton variant="text" width="30%" />
        <Skeleton variant="text" width="40%" />
      </div>
    </div>
  );
}
