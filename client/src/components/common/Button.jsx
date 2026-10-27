import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-[0.99]';

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-2.5 text-base gap-2.5',
  };

  const variants = {
    primary:
      'bg-indigo-600 hover:bg-indigo-700 text-white focus-visible:ring-indigo-500 shadow-indigo-100 hover:shadow-indigo-200 shadow-md',
    secondary:
      'bg-teal-600 hover:bg-teal-700 text-white focus-visible:ring-teal-500 shadow-teal-100 shadow-md',
    outline:
      'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 focus-visible:ring-slate-400',
    ghost:
      'bg-transparent hover:bg-slate-100 text-slate-600 focus-visible:ring-slate-300 shadow-none',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white focus-visible:ring-rose-500 shadow-rose-100 shadow-md',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
      {children}
    </button>
  );
};
