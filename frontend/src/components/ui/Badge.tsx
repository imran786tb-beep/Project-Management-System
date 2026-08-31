import React from 'react';
import { Priority } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  priority?: Priority;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  priority,
  size = 'sm',
  className = '',
}) => {
  let styleClasses = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700';

  if (priority) {
    switch (priority) {
      case 'URGENT':
        styleClasses = 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 font-semibold';
        break;
      case 'HIGH':
        styleClasses = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium';
        break;
      case 'MEDIUM':
        styleClasses = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
        break;
      case 'LOW':
        styleClasses = 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20';
        break;
    }
  } else {
    switch (variant) {
      case 'primary':
        styleClasses = 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60';
        break;
      case 'success':
        styleClasses = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60';
        break;
      case 'warning':
        styleClasses = 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60';
        break;
      case 'danger':
        styleClasses = 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/60';
        break;
      case 'info':
        styleClasses = 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60';
        break;
    }
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-full ${sizes[size]} ${styleClasses} ${className}`}>
      {children}
    </span>
  );
};
