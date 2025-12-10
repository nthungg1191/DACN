import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useProducts } from '@/contexts/ProductContext';

export function useApp() {
  const cart = useCart();
  const wishlist = useWishlist();
  const products = useProducts();

  return {
    // Cart
    cart,
    addToCart: cart.addToCart,
    removeFromCart: cart.removeFromCart,
    updateCartItem: cart.updateQuantity,
    clearCart: cart.clearCart,
    
    // Wishlist
    wishlist,
    addToWishlist: wishlist.addToWishlist,
    removeFromWishlist: wishlist.removeFromWishlist,
    clearWishlist: wishlist.clearWishlist,
    
    // Products
    products: products.products,
    featuredProducts: products.featuredProducts,
    newProducts: products.newProducts,
    saleProducts: products.saleProducts,
    currentProduct: products.currentProduct,
    searchResults: products.searchResults,
    loading: products.isLoading,
    isLoading: products.isLoading,
    isSearching: products.isSearching,
    error: products.error,
    totalProducts: products.pagination.total,
    currentPage: products.pagination.page,
    totalPages: products.pagination.totalPages,
    sortBy: products.sort,
    filters: products.filters,
    fetchProducts: products.fetchProducts,
    fetchProduct: products.fetchProduct,
    fetchFeaturedProducts: products.fetchFeaturedProducts,
    fetchNewProducts: products.fetchNewProducts,
    fetchSaleProducts: products.fetchSaleProducts,
    searchProducts: products.searchProducts,
    setCurrentPage: (page: number) => products.fetchProducts({ page }),
    setSortBy: products.setSort,
    setFilters: products.setFilters,
    clearFilters: products.clearFilters,
    clearSearch: products.clearSearch,
    getProductById: products.getProductById,
    getRelatedProducts: products.getRelatedProducts,
    
    // Product Detail Page helpers
    isInCart: (productId: string) => cart.items.some(item => item.productId === productId),
    isInWishlist: (productId: string) => wishlist.items.some(item => item.id === productId),
    getCartItemQuantity: (productId: string) => {
      const item = cart.items.find(item => item.productId === productId);
      return item ? item.quantity : 0;
    },
  };
}
