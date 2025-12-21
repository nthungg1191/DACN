'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@repo/ui';
import { NAV_LINKS } from '@/lib/constants';
import { useState, useRef, useEffect } from 'react';
import { User, Package, Heart, MapPin, LogOut } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { totalItems: cartCount } = useCart();

  const handleNavigation = (href: string) => {
    router.push(href);
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/');
    setUserMenuOpen(false);
  };

  // Close user menu when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [userMenuOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex-shrink-0">
          <Link 
            href="/" 
            className="text-2xl font-bold text-gray-900 hover:text-primary transition-colors cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              router.push('/');
            }}
          >
            Fashion
          </Link>
        </div>

        {/* Desktop Navigation - Centered */}
        <nav className="hidden md:flex md:gap-6 md:items-center md:flex-1 md:justify-center">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={(e) => {
                e.preventDefault();
                router.push(link.href);
              }}
              className="text-sm font-medium text-gray-700 hover:text-primary transition-colors cursor-pointer relative py-2 px-1"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side icons */}
        <div className="flex items-center gap-3 flex-shrink-0">

          {/* User Menu */}
          {status === 'authenticated' ? (
            <div className="relative" ref={userMenuRef}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="cursor-pointer"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-label="Tài khoản"
              >
                <User className="h-5 w-5" />
              </Button>

              {/* Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">
                        {session?.user?.name || 'Người dùng'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {session?.user?.email}
                      </p>
                    </div>

                    {/* Menu Items */}
                    <button
                      onClick={() => handleNavigation('/profile')}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <User className="mr-3 h-4 w-4" />
                      Thông tin tài khoản
                    </button>

                    <button
                      onClick={() => handleNavigation('/orders')}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Package className="mr-3 h-4 w-4" />
                      Đơn hàng của tôi
                    </button>

                    <button
                      onClick={() => handleNavigation('/wishlist')}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Heart className="mr-3 h-4 w-4" />
                      Danh sách yêu thích
                    </button>

                    <button
                      onClick={() => handleNavigation('/addresses')}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <MapPin className="mr-3 h-4 w-4" />
                      Địa chỉ giao hàng
                    </button>

                    <div className="border-t border-gray-200 my-1"></div>

                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Button 
              variant="ghost" 
              size="icon" 
              className="cursor-pointer"
              onClick={() => router.push('/auth/signin')}
              aria-label="Đăng nhập"
            >
              <User className="h-5 w-5" />
            </Button>
          )}

          <Button 
            variant="ghost" 
            size="icon" 
            className="relative cursor-pointer"
            onClick={() => router.push('/cart')}
            aria-label="Giỏ hàng"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full bg-primary text-xs text-white">
                {cartCount}
              </span>
            )}
          </Button>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden cursor-pointer"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <nav className="container mx-auto px-4 py-4 space-y-2">
            {NAV_LINKS.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavigation(link.href)}
                className="block w-full text-left text-sm font-medium text-gray-700 hover:text-primary transition-colors cursor-pointer py-2 px-2 rounded-md hover:bg-gray-50"
              >
                {link.label}
              </button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

