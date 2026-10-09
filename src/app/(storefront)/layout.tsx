'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';
import { Home, Pill, FileText, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { totalItems, openCart } = useCart();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 w-full max-w-full">
      <Navbar />
      <main className="flex-1 pb-16 lg:pb-0 w-full max-w-full overflow-x-hidden">{children}</main>
      <Footer />

      {/* Slide-out Cart Drawer */}
      <CartDrawer />

      {/* Direct WhatsApp Ordering Floating Button */}
      <WhatsAppButton phoneNumber="923184008718" />

      {/* Mobile Bottom Quick Action Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-30 px-3 py-2 shadow-lg flex items-center justify-around">
        <Link
          href="/"
          className={`flex flex-col items-center gap-1 text-[11px] font-bold ${
            pathname === '/' ? 'text-blue-700' : 'text-slate-500'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </Link>

        <Link
          href="/products/"
          className={`flex flex-col items-center gap-1 text-[11px] font-bold ${
            pathname?.startsWith('/products') ? 'text-blue-700' : 'text-slate-500'
          }`}
        >
          <Pill className="w-5 h-5" />
          <span>Medicines</span>
        </Link>

        <Link
          href="/prescription/"
          className={`flex flex-col items-center gap-1 text-[11px] font-bold ${
            pathname === '/prescription/' ? 'text-blue-700' : 'text-slate-500'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span>Upload Rx</span>
        </Link>

        <button
          type="button"
          onClick={openCart}
          className={`relative flex flex-col items-center gap-1 text-[11px] font-bold ${
            totalItems > 0 ? 'text-blue-700' : 'text-slate-500'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span>Cart</span>
          {totalItems > 0 && (
            <span className="absolute -top-1.5 right-1.5 bg-blue-500 text-white font-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </button>
      </nav>
    </div>
  );
}
