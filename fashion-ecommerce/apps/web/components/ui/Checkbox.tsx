'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckboxProps {
  id?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function Checkbox({
  id,
  checked = false,
  onCheckedChange,
  disabled = false,
  className = '',
  children,
}: CheckboxProps) {
  const handleClick = () => {
    if (!disabled && onCheckedChange) {
      onCheckedChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <div
        className={cn(
          'relative inline-flex items-center justify-center w-4 h-4 border-2 rounded cursor-pointer transition-all duration-200',
          checked
            ? 'bg-primary border-primary text-white'
            : 'bg-white border-gray-300 hover:border-gray-400',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="checkbox"
        aria-checked={checked}
        aria-disabled={disabled}
      >
        {checked && (
          <Check className="w-3 h-3" />
        )}
      </div>
      {children && (
        <label
          htmlFor={id}
          className={cn(
            'text-sm font-medium cursor-pointer select-none',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onClick={handleClick}
        >
          {children}
        </label>
      )}
    </div>
  );
}
