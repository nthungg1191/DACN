'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface LabelProps {
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

export function Label({ htmlFor, className = '', children }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        'text-sm font-medium text-gray-700',
        className
      )}
    >
      {children}
    </label>
  );
}
