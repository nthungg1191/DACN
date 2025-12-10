import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { AppProvider } from '@/contexts/AppProvider';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { ConditionalLayout } from '@/components/layout/ConditionalLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Fashion E-commerce',
  description: 'Thời trang hiện đại, phong cách trẻ trung',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <AppProvider>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </AppProvider>
      </body>
    </html>
  );
}

