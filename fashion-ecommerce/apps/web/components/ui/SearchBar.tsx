'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Input } from './Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  className?: string;
  showFilterButton?: boolean;
  onFilterClick?: () => void;
  autoFocus?: boolean;
  debounceMs?: number;
}

export function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder = 'Search products...',
  className = '',
  showFilterButton = false,
  onFilterClick,
  autoFocus = false,
  debounceMs = 300,
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, value, onChange, debounceMs]);

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  }, []);

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
  }, [onChange]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(localValue);
    }
  }, [localValue, onSearch]);

  const handleSearchClick = useCallback(() => {
    if (onSearch) {
      onSearch(localValue);
    }
  }, [localValue, onSearch]);

  return (
    <div className={cn('relative flex items-center gap-2', className)}>
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          value={localValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="pl-10 pr-10"
        />
        {localValue && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Search Button */}
      {onSearch && (
        <Button onClick={handleSearchClick} className="px-4">
          Search
        </Button>
      )}

      {/* Filter Button */}
      {showFilterButton && onFilterClick && (
        <Button
          variant="outline"
          onClick={onFilterClick}
          className="px-3"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      )}
    </div>
  );
}