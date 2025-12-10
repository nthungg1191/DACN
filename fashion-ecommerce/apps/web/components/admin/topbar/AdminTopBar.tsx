'use client';

import { useSession } from 'next-auth/react';
import { Menu } from 'lucide-react';

interface AdminTopBarProps {
  onMenuClick: () => void;
}

export function AdminTopBar({ onMenuClick }: AdminTopBarProps) {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md hover:bg-gray-100"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex-1" />
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            {session?.user?.name || 'Admin'}
          </span>
        </div>
      </div>
    </header>
  );
}

