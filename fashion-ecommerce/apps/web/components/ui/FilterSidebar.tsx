'use client';

import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { Label } from './Label';
import { Checkbox } from './Checkbox';
import { Slider } from './Slider';
import { cn } from '@/lib/utils';

export interface FilterOptions {
  priceRange: [number, number];
  brands: string[];
  sizes: string[];
  colors: string[];
  ratings: number[];
  inStock: boolean;
}

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onClearFilters: () => void;
  priceRangeMax?: number; // Max price from API
  className?: string;
}

interface FilterOptionData {
  brands: string[];
  sizes: string[];
  colors: Array<{ name: string; hex: string }>;
  priceRange: { min: number; max: number };
}

export function FilterSidebar({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onClearFilters,
  priceRangeMax = 1000000,
  className = '',
}: FilterSidebarProps) {
  const [filterOptions, setFilterOptions] = useState<FilterOptionData>({
    brands: [],
    sizes: [],
    colors: [],
    priceRange: { min: 0, max: priceRangeMax },
  });
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [expandedSections, setExpandedSections] = useState({
    price: true,
    brands: true,
    sizes: true,
    colors: true,
    ratings: true,
  });

  // Fetch filter options from API
  useEffect(() => {
    const fetchFilterOptions = async () => {
      setLoadingOptions(true);
      try {
        const response = await fetch('/api/products/filter-options');
        const result = await response.json();
        if (result.success && result.data) {
          setFilterOptions(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch filter options:', error);
      } finally {
        setLoadingOptions(false);
      }
    };

    if (isOpen) {
      fetchFilterOptions();
    }
  }, [isOpen]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const updateFilter = <K extends keyof FilterOptions>(
    key: K,
    value: FilterOptions[K]
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const toggleArrayFilter = <K extends keyof Pick<FilterOptions, 'brands' | 'sizes' | 'colors' | 'ratings'>>(
    key: K,
    value: string | number
  ) => {
    const currentArray = filters[key] as (string | number)[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    updateFilter(key, newArray as FilterOptions[K]);
  };

  if (!isOpen) return null;

  return (
    <div className={cn('fixed inset-0 z-50', className)}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Filters</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Clear Filters */}
          <Button 
            variant="outline" 
            onClick={onClearFilters}
            className="w-full mb-6"
          >
            Clear All Filters
          </Button>

          {/* Price Range */}
          <FilterSection
            title="Price Range"
            isExpanded={expandedSections.price}
            onToggle={() => toggleSection('price')}
          >
            <div className="space-y-4">
              <div className="px-1">
                <Slider
                  value={filters.priceRange}
                  onValueChange={(value) => updateFilter('priceRange', value as [number, number])}
                  max={filterOptions.priceRange.max || priceRangeMax}
                  min={filterOptions.priceRange.min || 0}
                  step={Math.max(1000, Math.floor((filterOptions.priceRange.max || priceRangeMax) / 100))}
                  className="w-full"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Label htmlFor="min-price" className="text-xs text-gray-500">Min (₫)</Label>
                  <Input
                    id="min-price"
                    type="number"
                    min={filterOptions.priceRange.min || 0}
                    max={filterOptions.priceRange.max || priceRangeMax}
                    value={filters.priceRange[0]}
                    onChange={(e) => {
                      const min = Math.max(filterOptions.priceRange.min || 0, Number(e.target.value) || 0);
                      const max = Math.max(min, filters.priceRange[1]);
                      updateFilter('priceRange', [min, max]);
                    }}
                    className="text-sm"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="max-price" className="text-xs text-gray-500">Max (₫)</Label>
                  <Input
                    id="max-price"
                    type="number"
                    min={filterOptions.priceRange.min || 0}
                    max={filterOptions.priceRange.max || priceRangeMax}
                    value={filters.priceRange[1]}
                    onChange={(e) => {
                      const max = Math.min(filterOptions.priceRange.max || priceRangeMax, Number(e.target.value) || filterOptions.priceRange.max || priceRangeMax);
                      const min = Math.min(filters.priceRange[0], max);
                      updateFilter('priceRange', [min, max]);
                    }}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
          </FilterSection>

          {/* Brands */}
          <FilterSection
            title="Brands"
            isExpanded={expandedSections.brands}
            onToggle={() => toggleSection('brands')}
          >
            {loadingOptions ? (
              <div className="text-sm text-gray-500">Loading brands...</div>
            ) : filterOptions.brands.length === 0 ? (
              <div className="text-sm text-gray-500">No brands available</div>
            ) : (
              <div className="space-y-2">
                {filterOptions.brands.map(brand => (
                  <div key={brand} className="flex items-center space-x-2">
                    <Checkbox
                      id={`brand-${brand}`}
                      checked={filters.brands.includes(brand)}
                      onCheckedChange={() => toggleArrayFilter('brands', brand)}
                    />
                    <Label htmlFor={`brand-${brand}`} className="text-sm">
                      {brand}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </FilterSection>

          {/* Sizes */}
          <FilterSection
            title="Sizes"
            isExpanded={expandedSections.sizes}
            onToggle={() => toggleSection('sizes')}
          >
            {loadingOptions ? (
              <div className="text-sm text-gray-500">Loading sizes...</div>
            ) : filterOptions.sizes.length === 0 ? (
              <div className="text-sm text-gray-500">No sizes available</div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {filterOptions.sizes.map(size => (
                  <Button
                    key={size}
                    variant={filters.sizes.includes(size) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleArrayFilter('sizes', size)}
                    className="text-xs"
                  >
                    {size}
                  </Button>
                ))}
              </div>
            )}
          </FilterSection>

          {/* Colors */}
          <FilterSection
            title="Colors"
            isExpanded={expandedSections.colors}
            onToggle={() => toggleSection('colors')}
          >
            {loadingOptions ? (
              <div className="text-sm text-gray-500">Loading colors...</div>
            ) : filterOptions.colors.length === 0 ? (
              <div className="text-sm text-gray-500">No colors available</div>
            ) : (
              <div className="grid grid-cols-5 gap-2">
                {filterOptions.colors.map(color => (
                  <button
                    key={color.name}
                    onClick={() => toggleArrayFilter('colors', color.name)}
                    className={cn(
                      'w-8 h-8 rounded-full border-2 transition-all relative',
                      filters.colors.includes(color.name)
                        ? 'border-gray-900 scale-110 ring-2 ring-gray-900 ring-offset-1'
                        : 'border-gray-200 hover:border-gray-400'
                    )}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
            )}
          </FilterSection>

          {/* Ratings */}
          <FilterSection
            title="Customer Rating"
            isExpanded={expandedSections.ratings}
            onToggle={() => toggleSection('ratings')}
          >
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(rating => (
                <div key={rating} className="flex items-center space-x-2">
                  <Checkbox
                    id={`rating-${rating}`}
                    checked={filters.ratings.includes(rating)}
                    onCheckedChange={() => toggleArrayFilter('ratings', rating)}
                  />
                  <Label htmlFor={`rating-${rating}`} className="text-sm flex items-center">
                    <div className="flex mr-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            'w-3 h-3',
                            i < rating ? 'text-yellow-400' : 'text-gray-300'
                          )}
                        >
                          ★
                        </div>
                      ))}
                    </div>
                    & Up
                  </Label>
                </div>
              ))}
            </div>
          </FilterSection>

          {/* In Stock Only */}
          <div className="flex items-center space-x-2 pt-4 border-t">
            <Checkbox
              id="in-stock"
              checked={filters.inStock}
              onCheckedChange={(checked) => updateFilter('inStock', checked as boolean)}
            />
            <Label htmlFor="in-stock" className="text-sm">
              In Stock Only
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FilterSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function FilterSection({ title, isExpanded, onToggle, children }: FilterSectionProps) {
  return (
    <div className="mb-6">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full py-2 text-left"
      >
        <h3 className="font-medium text-gray-900">{title}</h3>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>
      {isExpanded && (
        <div className="mt-2">
          {children}
        </div>
      )}
    </div>
  );
}