'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/hooks/useApp';
import { ProductGrid } from '@/components/products/ProductGrid';
import { Pagination } from '@/components/ui/Pagination';
import { SearchBar } from '@/components/ui/SearchBar';
import { FilterSidebar, FilterOptions } from '@/components/ui/FilterSidebar';
import { Button } from '@/components/ui/Button';
import { Filter, Grid, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProductFilters, ProductSort } from '@/contexts/ProductContext';

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
  { value: 'rating', label: 'Highest Rated' },
];

function ProductsContent() {
  const { 
    products, 
    loading, 
    fetchProducts,
    totalProducts,
    currentPage,
    totalPages,
    setSortBy,
  } = useApp();

  const router = useRouter();
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortByLocal] = useState('newest');
  const [searchQuery, setSearchQueryLocal] = useState('');
  const [priceRangeMax, setPriceRangeMax] = useState(1000000);
  
  const defaultFilters: FilterOptions = {
    priceRange: [0, 0], // Will be set from API
    brands: [],
    sizes: [],
    colors: [],
    ratings: [],
    inStock: false,
  };

  const [filters, setFilters] = useState<FilterOptions>(defaultFilters);
  const [categoryFromUrl, setCategoryFromUrl] = useState<string[]>([]);

  // Fetch price range on mount
  useEffect(() => {
    const fetchPriceRange = async () => {
      try {
        const response = await fetch('/api/products/filter-options');
        const result = await response.json();
        if (result.success && result.data?.priceRange) {
          const { min, max } = result.data.priceRange;
          setPriceRangeMax(max);
          // Set default price range to full range
          setFilters(prev => ({
            ...prev,
            priceRange: [min, max],
          }));
        }
      } catch (error) {
        console.error('Failed to fetch price range:', error);
      }
    };
    fetchPriceRange();
  }, []);

  const mapSort = (value: string): ProductSort => {
    switch (value) {
      case 'price-low':
        return { field: 'price', direction: 'asc' };
      case 'price-high':
        return { field: 'price', direction: 'desc' };
      case 'name-asc':
        return { field: 'name', direction: 'asc' };
      case 'name-desc':
        return { field: 'name', direction: 'desc' };
      case 'oldest':
        return { field: 'createdAt', direction: 'asc' };
      case 'rating':
        return { field: 'rating', direction: 'desc' };
      case 'newest':
      default:
        return { field: 'createdAt', direction: 'desc' };
    }
  };

  const mapFiltersToProductFilters = (f: FilterOptions): ProductFilters => {
    // Price range: only send if user has changed from default (not 0,0 and not full range)
    const isDefaultPriceRange = f.priceRange[0] === 0 && f.priceRange[1] === 0;
    const isFullPriceRange = f.priceRange[0] === 0 && f.priceRange[1] >= priceRangeMax;
    
    return {
      brands: f.brands,
      sizes: f.sizes,
      colors: f.colors,
      ratings: f.ratings,
      minPrice: !isDefaultPriceRange && !isFullPriceRange && f.priceRange[0] > 0 ? f.priceRange[0] : undefined,
      maxPrice: !isDefaultPriceRange && !isFullPriceRange && f.priceRange[1] < priceRangeMax ? f.priceRange[1] : undefined,
      inStock: f.inStock,
    };
  };

  const loadProducts = (params?: { page?: number; search?: string; filters?: FilterOptions; sortValue?: string }) => {
    const sortValue = params?.sortValue ?? sortBy;
    const f = params?.filters ?? filters;
    const categoryFilters = categoryFromUrl.length ? { categories: categoryFromUrl } : {};
    fetchProducts({
      page: params?.page || 1,
      query: params?.search ?? searchQuery,
      sort: mapSort(sortValue),
      filters: { ...mapFiltersToProductFilters(f), ...categoryFilters },
    });
  };

  // Initialize products on mount
  useEffect(() => {
    loadProducts({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync search query from URL (?search=)
  useEffect(() => {
    const searchParam = searchParams.get('search') || '';
    const categoryParam = searchParams.get('categories') || '';
    const parsedCategories = categoryParam ? categoryParam.split(',').filter(Boolean) : [];
    setCategoryFromUrl(parsedCategories);
    if (searchParam !== searchQuery) {
      setSearchQueryLocal(searchParam);
      loadProducts({ page: 1, search: searchParam });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Reload when category from URL changes
  useEffect(() => {
    loadProducts({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFromUrl.join(',')]);

  // Handle search
  const handleSearch = (query: string) => {
    const trimmed = query.trim();
    setSearchQueryLocal(trimmed);
    loadProducts({ page: 1, search: trimmed });

    // Update URL query param
    const params = new URLSearchParams(searchParams.toString());
    if (trimmed) {
      params.set('search', trimmed);
    } else {
      params.delete('search');
    }
    const newUrl = params.toString() ? `?${params.toString()}` : '?';
    router.replace(newUrl, { scroll: false });
  };

  // Handle sort change
  const handleSortChange = (newSortBy: string) => {
    setSortByLocal(newSortBy);
    setSortBy(mapSort(newSortBy));
    loadProducts({ page: 1, sortValue: newSortBy });
  };

  // Handle filter change
  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    loadProducts({ page: 1, filters: newFilters });
  };

  // Clear all filters
  const handleClearFilters = () => {
    const clearedFilters: FilterOptions = {
      ...defaultFilters,
      priceRange: [0, priceRangeMax], // Reset to full range
    };
    setFilters(clearedFilters);
    loadProducts({ page: 1, filters: clearedFilters });
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    loadProducts({ page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Get active filters count
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.brands.length > 0) count++;
    if (filters.sizes.length > 0) count++;
    if (filters.colors.length > 0) count++;
    if (filters.ratings.length > 0) count++;
    if (filters.inStock) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] > 0) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Products</h1>
          <p className="text-gray-600">
            Khám phá bộ sưu tập thời trang mới nhất
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <SearchBar
            value={searchQuery}
            onChange={setSearchQueryLocal}
            onSearch={handleSearch}
            placeholder="Search for products..."
            showFilterButton={true}
            onFilterClick={() => setShowFilters(true)}
          />

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Results Info */}
            <div className="text-sm text-gray-600">
              {loading ? (
                'Loading...'
              ) : (
                <>
                  {totalProducts} product{totalProducts !== 1 ? 's' : ''} found
                  {searchQuery && ` for "${searchQuery}"`}
                </>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              {/* Filter Button */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(true)}
                className="relative"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* View Mode Toggle */}
              <div className="flex border border-gray-300 rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="mb-8">
          <ProductGrid
            products={products}
            loading={loading}
            columns={viewMode === 'grid' ? 4 : 2}
            className={cn(
              viewMode === 'list' && 'space-y-4'
            )}
          />
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={totalProducts}
            itemsPerPage={12}
            className="justify-center"
          />
        )}

        {/* Filter Sidebar */}
        <FilterSidebar
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          priceRangeMax={priceRangeMax}
        />
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
