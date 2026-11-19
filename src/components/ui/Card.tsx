'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon?: React.ReactNode;
  color?: string;
  subValue?: string;
}

export function StatCard({ title, value, icon, color = 'vyapar', subValue }: StatCardProps) {
  const colorMap: Record<string, string> = {
    vyapar: 'bg-vyapar-50 text-vyapar-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{title}</span>
        {icon && <div className={`rounded-lg p-1.5 ${colorMap[color]}`}>{icon}</div>}
      </div>
      <div className="mt-2 text-2xl font-bold text-slate-800">{value}</div>
      {subValue && <div className="mt-0.5 text-xs text-slate-400">{subValue}</div>}
    </div>
  );
}
