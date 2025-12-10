'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/hooks/useApp';
import { Button } from '@/components/ui/Button';
import { ProductGrid } from '@/components/products/ProductGrid';
import { Pagination } from '@/components/products/Pagination';
import { SearchBar } from '@/components/ui/SearchBar';
import Image from 'next/image';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const { searchProducts, searchResults, isSearching, currentPage, setCurrentPage, totalPages } = useApp();
  
  const [query, setQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category');
    
    setQuery(q);
    setSearchQuery(q);
    setSelectedCategory(category);
    
    if (q) {
      searchProducts(q, {
        page: 1, // Always start from page 1 when URL params change
        limit: 12,
        filters: { category: category || undefined },
      });
      setCurrentPage(1); // Reset to page 1 when search params change
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSearch = (searchTerm: string) => {
    if (searchTerm.trim()) {
      setSearchQuery(searchTerm);
      searchProducts(searchTerm, {
        page: 1,
        limit: 12,
        filters: { category: selectedCategory || undefined },
      });
      setCurrentPage(1);
      
      // Update URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('q', searchTerm);
      if (selectedCategory) {
        newUrl.searchParams.set('category', selectedCategory);
      }
      window.history.pushState({}, '', newUrl.toString());
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (searchQuery) {
      searchProducts(searchQuery, {
        page: page,
        limit: 12,
        filters: { category: selectedCategory || undefined },
      });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryFilter = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    if (searchQuery) {
      searchProducts(searchQuery, {
        page: 1,
        limit: 12,
        filters: { category: categoryId || undefined },
      });
      setCurrentPage(1);
      
      // Update URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('q', searchQuery);
      if (categoryId) {
        newUrl.searchParams.set('category', categoryId);
      } else {
        newUrl.searchParams.delete('category');
      }
      window.history.pushState({}, '', newUrl.toString());
    }
  };

  // Highlight search query in text
  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {query ? `Search Results for "${query}"` : 'Search Products'}
        </h1>
        
        {/* Search Bar */}
        <div className="max-w-2xl">
          <SearchBar
            value={query}
            onChange={setQuery}
            onSearch={handleSearch}
            placeholder="Search for products..."
          />
        </div>
      </div>

      {isSearching ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Searching...</p>
          </div>
        </div>
      ) : searchResults && searchResults.length > 0 ? (
        <>
          {/* Results Info */}
          <div className="mb-6">
            <p className="text-gray-600">
              Found {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
              {query && ` for "${query}"`}
            </p>
          </div>

          {/* Filter Options */}
          <div className="mb-6 flex gap-4 flex-wrap">
            <button
              onClick={() => handleCategoryFilter(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                !selectedCategory
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Categories
            </button>
            {/* You can add more category filters here */}
          </div>

          {/* Products Grid */}
          <ProductGrid products={searchResults} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      ) : query ? (
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="mb-8">
            <svg
              className="mx-auto h-24 w-24 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No products found</h2>
          <p className="text-gray-600 mb-8">
            We couldn't find any products matching your search "{query}". 
            Try different keywords or browse our categories.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => handleSearch('')}>Clear Search</Button>
            <Link href="/products">
              <Button variant="outline">Browse All Products</Button>
            </Link>
          </div>

          {/* Search Suggestions */}
          <div className="mt-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Suggestions</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {['Shirt', 'Dress', 'Shoes', 'Bag', 'Accessories'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSearch(suggestion)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition text-gray-700"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="mb-8">
            <svg
              className="mx-auto h-24 w-24 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Start Searching</h2>
          <p className="text-gray-600 mb-8">
            Enter a search term to find products you're looking for.
          </p>

          {/* Popular Searches */}
          <div className="mt-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Searches</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {['Shirt', 'Dress', 'Shoes', 'Bag', 'Accessories', 'Sale'].map((term) => (
                <button
                  key={term}
                  onClick={() => handleSearch(term)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition text-gray-700"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
