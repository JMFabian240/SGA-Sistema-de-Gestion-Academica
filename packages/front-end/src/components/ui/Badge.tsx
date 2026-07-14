import React from 'react';

interface BadgeProps {
  variant?: 'success' | 'danger' | 'info' | 'warning' | 'default';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children }) => {
  const variants = {
    success: 'bg-green-50 text-green-700',
    danger: 'bg-red-50 text-red-700',
    info: 'bg-blue-50 text-blue-700',
    warning: 'bg-yellow-50 text-yellow-700',
    default: 'bg-navy-50 text-navy-700',
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
};
