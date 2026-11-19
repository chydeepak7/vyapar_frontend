'use client';

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = '', ...rest }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-slate-600">{label}</label>}
      <input
        className={`rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-vyapar-500 focus:ring-1 focus:ring-vyapar-500 ${className}`}
        {...rest}
      />
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export function Select({ label, className = '', children, ...rest }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-slate-600">{label}</label>}
      <select
        className={`rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-vyapar-500 focus:ring-1 focus:ring-vyapar-500 bg-white ${className}`}
        {...rest}
      >
        {children}
      </select>
    </div>
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function TextArea({ label, className = '', ...rest }: TextAreaProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-slate-600">{label}</label>}
      <textarea
        className={`rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-vyapar-500 focus:ring-1 focus:ring-vyapar-500 ${className}`}
        {...rest}
      />
    </div>
  );
}
