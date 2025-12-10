'use client';

import { AdminSidebar } from '../sidebar/AdminSidebar';
import { AdminTopBar } from '../topbar/AdminTopBar';
import { useState } from 'react';

interface AdminTemplateProps {
  children: React.ReactNode;
}

export function AdminTemplate({ children }: AdminTemplateProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <AdminTopBar onMenuClick={() => setSidebarOpen(true)} />

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

