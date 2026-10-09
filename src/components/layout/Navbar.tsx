'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ShoppingBag, 
  Menu, 
  X, 
  FileText, 
  PhoneCall, 
  Search, 
  ShieldCheck, 
  ChevronRight, 
  ChevronDown,
  LayoutDashboard,
  MessageCircle,
  Pill
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { getCategories, getCachedCategories } from '@/lib/db';
import { Category } from '@/types';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { totalItems, openCart, settings } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>(() => getCachedCategories());
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [hoveredCatId, setHoveredCatId] = useState<string | null>(() => {
    const initial = getCachedCategories();
    return initial.length > 0 ? initial[0].id : null;
  });
  const [expandedMobileCatId, setExpandedMobileCatId] = useState<string | null>(null);

  // Safe debounce timer for desktop category dropdown
  const dropdownTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleOpenDropdown = () => {
    if (dropdownTimerRef.current) {
      clearTimeout(dropdownTimerRef.current);
      dropdownTimerRef.current = null;
    }
    setCategoryDropdownOpen(true);
  };

  const handleCloseDropdown = (delay = 220) => {
    if (dropdownTimerRef.current) {
      clearTimeout(dropdownTimerRef.current);
    }
    dropdownTimerRef.current = setTimeout(() => {
      setCategoryDropdownOpen(false);
    }, delay);
  };

  useEffect(() => {
    return () => {
      if (dropdownTimerRef.current) clearTimeout(dropdownTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const loadCats = () => {
      getCategories()
        .then((cats) => {
          if (cats && cats.length > 0) {
            setCategories(cats);
            setHoveredCatId((prev) => prev || cats[0].id);
          }
        })
        .catch(console.error);
    };

    loadCats();

    const handleCatsUpdate = () => loadCats();
    window.addEventListener('myko_categories_updated', handleCatsUpdate);
    return () => window.removeEventListener('myko_categories_updated', handleCatsUpdate);
  }, []);

  // Close desktop dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#category-dropdown-container')) {
        setCategoryDropdownOpen(false);
      }
    };
    if (categoryDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [categoryDropdownOpen]);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const renderNavCatIcon = (icon?: string, isHovered?: boolean) => {
    if (!icon) return <Pill className={`w-3.5 h-3.5 shrink-0 ${isHovered ? 'text-white' : 'text-blue-600'}`} />;
    if (icon.startsWith('http') || icon.startsWith('data:') || icon.startsWith('/')) {
      return <img src={icon} alt="" className="w-3.5 h-3.5 object-contain shrink-0 rounded-xs" />;
    }
    if (/\p{Emoji}/u.test(icon) || (icon.length <= 4 && !/^[A-Za-z]+$/.test(icon))) {
      return <span className="text-xs leading-none select-none shrink-0">{icon}</span>;
    }
    return <Pill className={`w-3.5 h-3.5 shrink-0 ${isHovered ? 'text-white' : 'text-blue-600'}`} />;
  };

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'All Medicines', href: '/products/' },
    { label: 'Upload Prescription', href: '/prescription/' },
    { label: 'About Us', href: '/about/' },
    { label: 'Contact', href: '/contact/' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/98 border-b border-slate-200/80 shadow-xs w-full">
      
      {/* 1. Top Clinical Announcement & Helpline Bar */}
      <div className="bg-slate-900 text-white text-[11px] sm:text-xs py-1 sm:py-1.5 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="font-semibold text-slate-200 truncate text-[10px] sm:text-xs">
              MykoTech Pharma &bull; Live long Live Happy! &bull; Licensed Home Delivery
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-5 text-slate-300 shrink-0">
            <a
              href="https://wa.me/923184008718"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp: 0318-4008718</span>
            </a>
            <a
              href="tel:03145200832"
              className="flex items-center gap-1.5 hover:text-blue-400 transition-colors"
            >
              <PhoneCall className="w-3 h-3 text-blue-400" />
              <span>Call: 0314-5200832</span>
            </a>
            <Link 
              href="/admin/" 
              prefetch={false}
              className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-bold transition-colors pl-2 border-l border-slate-700"
            >
              <LayoutDashboard className="w-3 h-3" /> Admin Portal
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-20 gap-2 sm:gap-4">
          
          {/* Official MP Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0 group">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-white shadow-md shadow-blue-500/15 group-hover:scale-105 transition-transform flex items-center justify-center p-0.5 border border-blue-100 shrink-0">
              <img
                src="/logo.webp"
                alt="MykoTech Pharma Logo"
                width={48}
                height={48}
                loading="eager"
                fetchPriority="high"
                decoding="sync"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <span className="text-base sm:text-2xl font-black tracking-tight text-slate-900 leading-none block truncate">
                MYKOTECH<span className="text-blue-700">PHARMA</span>
              </span>
              <span className="text-[8px] sm:text-[10px] uppercase font-bold tracking-wider sm:tracking-widest text-slate-600 block mt-0.5 truncate">
                Pvt Ltd &bull; Live long Live Happy!
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-bold text-slate-600">
            <Link
              href="/"
              className={`px-3 py-2 rounded-xl transition-colors ${
                pathname === '/' ? 'text-blue-700 bg-blue-50' : 'hover:text-blue-700 hover:bg-slate-50'
              }`}
            >
              Home
            </Link>

            {/* Categories Dropdown with Multi-Subcategories (Stays strictly on FRONT/TOP of banner) */}
            <div 
              id="category-dropdown-container"
              className="relative"
              onMouseEnter={handleOpenDropdown}
              onMouseLeave={() => handleCloseDropdown(300)}
            >
              <button
                type="button"
                onClick={() => setCategoryDropdownOpen((prev) => !prev)}
                className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer select-none ${
                  categoryDropdownOpen || pathname?.startsWith('/products')
                    ? 'text-blue-700 bg-blue-50'
                    : 'hover:text-blue-700 hover:bg-slate-50'
                }`}
              >
                <span>Categories</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${categoryDropdownOpen ? 'rotate-180 text-blue-700' : ''}`} />
              </button>

              {/* Mega Dropdown Menu with zero gap and hover bridge */}
              {categoryDropdownOpen && (
                <div 
                  className="hidden lg:block absolute top-full left-0 pt-2 w-[680px] z-50 animate-in fade-in zoom-in-95 duration-150"
                  onMouseEnter={handleOpenDropdown}
                  onMouseLeave={() => handleCloseDropdown(300)}
                >
                  <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200/90 p-4 grid grid-cols-5 gap-3 ring-1 ring-black/5 before:content-[''] before:absolute before:-top-4 before:left-0 before:right-0 before:h-5">
                    {/* Left Column: Categories List */}
                    <div className="col-span-2 border-r border-slate-100 pr-2 space-y-1">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-1">
                      Therapeutic Categories
                    </div>
                    {categories.map((cat) => {
                      const isHovered = (hoveredCatId || categories[0]?.id) === cat.id;
                      return (
                        <div
                          key={cat.id}
                          onMouseEnter={() => setHoveredCatId(cat.id)}
                          className="w-full"
                        >
                          <Link
                            href={`/products/?category=${cat.slug}`}
                            onClick={() => setCategoryDropdownOpen(false)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                              isHovered
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="flex items-center gap-2 truncate">
                              {renderNavCatIcon(cat.icon, isHovered)}
                              <span className="truncate">{cat.name}</span>
                            </span>
                            <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isHovered ? 'text-white' : 'text-slate-300'}`} />
                          </Link>
                        </div>
                      );
                    })}
                    <div className="pt-2 border-t border-slate-100 mt-2">
                      <Link
                        href="/products/"
                        onClick={() => setCategoryDropdownOpen(false)}
                        className="block text-center text-xs font-extrabold text-blue-700 hover:underline py-1"
                      >
                        Browse All Medicines &rarr;
                      </Link>
                    </div>
                  </div>

                  {/* Right Column: Subcategories for the hovered category */}
                  <div className="col-span-3 pl-2 flex flex-col justify-between">
                    {(() => {
                      const activeCat = categories.find((c) => c.id === (hoveredCatId || categories[0]?.id));
                      if (!activeCat) return null;
                      return (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <div>
                              <span className="text-xs font-black text-slate-900 block">{activeCat.name} Subcategories</span>
                              <span className="text-[10px] text-slate-400">Click to filter specific formulas</span>
                            </div>
                            <Link
                              href={`/products/?category=${activeCat.slug}`}
                              onClick={() => setCategoryDropdownOpen(false)}
                              className="text-[11px] font-bold text-blue-600 hover:underline"
                            >
                              All {activeCat.name} &rarr;
                            </Link>
                          </div>

                          <div className="grid grid-cols-1 gap-1 max-h-[300px] overflow-y-auto pr-1">
                            {activeCat.sub_categories && activeCat.sub_categories.length > 0 ? (
                              activeCat.sub_categories.map((sub) => (
                                <Link
                                  key={sub.id}
                                  href={`/products/?category=${activeCat.slug}&subcategory=${sub.slug}`}
                                  onClick={() => setCategoryDropdownOpen(false)}
                                  className="flex items-center justify-between py-1.5 px-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50/80 transition-colors group"
                                >
                                  <span className="flex items-center gap-2 truncate">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 group-hover:scale-125 transition-transform" />
                                    <span className="truncate">{sub.name}</span>
                                  </span>
                                  <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-blue-600 shrink-0" />
                                </Link>
                              ))
                            ) : (
                              <div className="text-xs text-slate-400 py-6 text-center">
                                No subcategories listed yet.
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
            </div>

            <Link
              href="/products/"
              className={`px-3 py-2 rounded-xl transition-colors ${
                pathname === '/products/' ? 'text-blue-700 bg-blue-50' : 'hover:text-blue-700 hover:bg-slate-50'
              }`}
            >
              All Medicines
            </Link>

            <Link
              href="/prescription/"
              className={`px-3 py-2 rounded-xl transition-colors ${
                pathname === '/prescription/' ? 'text-blue-700 bg-blue-50' : 'hover:text-blue-700 hover:bg-slate-50'
              }`}
            >
              Upload Rx
            </Link>

            <Link
              href="/about/"
              className={`px-3 py-2 rounded-xl transition-colors ${
                pathname === '/about/' ? 'text-blue-700 bg-blue-50' : 'hover:text-blue-700 hover:bg-slate-50'
              }`}
            >
              About
            </Link>

            <Link
              href="/contact/"
              className={`px-3 py-2 rounded-xl transition-colors ${
                pathname === '/contact/' ? 'text-blue-700 bg-blue-50' : 'hover:text-blue-700 hover:bg-slate-50'
              }`}
            >
              Contact
            </Link>
          </nav>

          {/* Action Buttons: Prescription & Cart Drawer Trigger */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <Link
              href="/prescription/"
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors shadow-xs"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Upload Rx</span>
            </Link>

            <button
              type="button"
              onClick={openCart}
              className="relative p-2 sm:px-4 sm:py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 sm:gap-2.5 text-xs sm:text-sm font-bold shadow-md shadow-slate-900/10 transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">Cart</span>
              {totalItems > 0 && (
                <span className="bg-blue-500 text-white font-black text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full shadow-xs">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* 3. True Fixed Full-Screen Mobile Drawer (100% Reliable & Touch-Friendly) */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col">
          {/* Backdrop overlay (tap to close) */}
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" 
            onClick={() => setMobileMenuOpen(false)} 
          />

          {/* Drawer Sheet Container */}
          <div className="relative z-50 w-full bg-white max-h-[88vh] flex flex-col shadow-2xl border-b border-slate-200 animate-in slide-in-from-top duration-200 rounded-b-3xl overflow-hidden">
            
            {/* Drawer Top Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-white p-0.5 border border-blue-100 flex items-center justify-center">
                  <img src="/logo.png" alt="MykoTech Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <span className="font-black text-slate-900 text-sm block leading-none">
                    MYKOTECH<span className="text-blue-700">PHARMA</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold mt-0.5 block">
                    Menu & Healthcare Catalog
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* Prescription CTA */}
              <Link
                href="/prescription/"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl font-bold text-blue-900 text-sm shadow-xs active:scale-98 transition-transform"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>Upload Doctor Prescription</span>
                </div>
                <ChevronRight className="w-4 h-4 text-blue-600" />
              </Link>

              {/* Main Navigation Links */}
              <nav className="flex flex-col space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      pathname === link.href
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{link.label}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                ))}
              </nav>

              {/* Mobile Categories & Subcategories Accordion */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    Categories & Subcategories
                  </span>
                  <Link
                    href="/products/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    All Products &rarr;
                  </Link>
                </div>

                <div className="space-y-1.5">
                  {categories.map((cat) => {
                    const isExpanded = expandedMobileCatId === cat.id;
                    const hasSubs = cat.sub_categories && cat.sub_categories.length > 0;
                    return (
                      <div key={cat.id} className="rounded-xl border border-slate-200/80 overflow-hidden bg-slate-50/60">
                        <div className="flex items-center justify-between p-2.5">
                          <Link
                            href={`/products/?category=${cat.slug}`}
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-2 text-xs font-bold text-slate-800 hover:text-blue-600 truncate flex-1"
                          >
                            {renderNavCatIcon(cat.icon, false)}
                            <span className="truncate">{cat.name}</span>
                          </Link>
                          {hasSubs && (
                            <button
                              type="button"
                              onClick={() => setExpandedMobileCatId(isExpanded ? null : cat.id)}
                              className="p-1 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                              aria-label="Toggle subcategories"
                            >
                              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-blue-600' : ''}`} />
                            </button>
                          )}
                        </div>

                        {/* Subcategories Accordion Content */}
                        {isExpanded && hasSubs && (
                          <div className="px-3 pb-2.5 pt-1 space-y-1 border-t border-slate-200/60 bg-white">
                            {cat.sub_categories!.map((sub) => (
                              <Link
                                key={sub.id}
                                href={`/products/?category=${cat.slug}&subcategory=${sub.slug}`}
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center justify-between py-1.5 px-2 rounded-lg text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              >
                                <span className="truncate">&bull; {sub.name}</span>
                                <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Helpline & WhatsApp Contacts */}
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-500">
                <a href="tel:03145200832" className="flex items-center gap-2 hover:text-blue-600">
                  <PhoneCall className="w-4 h-4 text-blue-600" />
                  <span>Helpline: 0314-5200832</span>
                </a>
                <a href="https://wa.me/923184008718" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-emerald-600">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>WhatsApp: 0318-4008718</span>
                </a>
              </div>

            </div>
          </div>
        </div>
      )}
    </header>
  );
};
