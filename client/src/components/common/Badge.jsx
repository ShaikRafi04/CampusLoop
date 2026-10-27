import React from 'react';

export const Badge = ({ children, status, variant = 'neutral', className = '' }) => {
  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';

  if (status) {
    const s = status.toUpperCase();
    switch (s) {
      case 'PENDING':
        badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'ACCEPTED':
        badgeStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200';
        break;
      case 'COMPLETED':
        badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'REJECTED':
        badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
        break;
      case 'CANCELLED':
        badgeStyle = 'bg-slate-100 text-slate-600 border-slate-200';
        break;
      case 'DISPUTED':
        badgeStyle = 'bg-rose-50 border-2 border-rose-500 text-rose-700';
        break;
      default:
        badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
    }
  } else if (variant === 'primary') {
    badgeStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200';
  } else if (variant === 'secondary') {
    badgeStyle = 'bg-teal-50 text-teal-700 border-teal-200';
  } else if (variant === 'success') {
    badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyle} ${className}`}
    >
      {children || status}
    </span>
  );
};
