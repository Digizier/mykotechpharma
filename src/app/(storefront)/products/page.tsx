'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getProducts, getCategories } from '@/lib/db';
import { Product, Category } from '@/types';
import { 
  Search, 
  Filter, 
  X, 
  ShoppingBag, 
  Star, 
  Zap, 
  AlertCircle, 
  Check, 
  SlidersHorizontal,
  ChevronDown,
  Pill,
  Sparkles
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { ProductCardSkeleton } from '@/components/common/Skeleton';

export default function ProductsPage() {
  const router = useRouter();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [rxOnly, setRxOnly] = useState<boolean>(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const parseUrlParams = () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const catParam = params.get('category');
        const subParam = params.get('subcategory');
        if (catParam) setSelectedCategory(catParam);
        if (subParam) setSelectedSubCategory(subParam);
      }
    };
    parseUrlParams();
    window.addEventListener('popstate', parseUrlParams);

    async function load() {
      try {
        setLoading(true);
        const [prods, cats] = await Promise.all([
          getProducts({ onlyActive: true }),
          getCategories(),
        ]);
        setProducts(prods);
        setCategories(cats);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();

    const handleUpdate = () => load();
    window.addEventListener('myko_products_updated', handleUpdate);
    window.addEventListener('myko_categories_updated', handleUpdate);

    return () => {
      window.removeEventListener('popstate', parseUrlParams);
      window.removeEventListener('myko_products_updated', handleUpdate);
      window.removeEventListener('myko_categories_updated', handleUpdate);
    };
  }, []);

  // Real-time product counts per category and subcategory
  const getCategoryProductCount = (categoryId: string) => {
    return products.filter((p) => p.category_id === categoryId).length;
  };

  const getSubCategoryProductCount = (subCategoryId: string) => {
    return products.filter((p) => p.sub_category_id === subCategoryId).length;
  };

  // Get active subcategories based on selected category
  const activeCategoryObj = useMemo(() => {
    if (selectedCategory === 'all') return null;
    return categories.find((c) => c.slug === selectedCategory);
  }, [selectedCategory, categories]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesGeneric = item.generic_name?.toLowerCase().includes(q) || false;
        const matchesDosage = item.dosage?.toLowerCase().includes(q) || false;
        if (!matchesName && !matchesGeneric && !matchesDosage) return false;
      }

      // Category
      if (selectedCategory !== 'all') {
        const catObj = categories.find((c) => c.slug === selectedCategory);
        if (catObj && item.category_id !== catObj.id) return false;
      }

      // SubCategory
      if (selectedSubCategory !== 'all') {
        const subObj =
          activeCategoryObj?.sub_categories?.find((s) => s.slug === selectedSubCategory) ||
          categories.flatMap((c) => c.sub_categories || []).find((s) => s.slug === selectedSubCategory);
        if (subObj && item.sub_category_id !== subObj.id) return false;
      }

      // Rx Only
      if (rxOnly && !item.requires_prescription) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return Number(a.price) - Number(b.price);
      if (sortBy === 'price-high') return Number(b.price) - Number(a.price);
      if (sortBy === 'newest') return (new Date(b.created_at || '').getTime()) - (new Date(a.created_at || '').getTime());
      return b.is_featured ? 1 : -1;
    });
  }, [products, searchQuery, selectedCategory, selectedSubCategory, sortBy, rxOnly, categories, activeCategoryObj]);

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1, true);
    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1500);
  };

  const handleBuyNow = (product: Product) => {
    addToCart(product, 1, false);
    router.push('/checkout/');
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedSubCategory('all');
    setSearchQuery('');
    setRxOnly(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-8 w-full max-w-full overflow-x-hidden">
      
      {/* 1. Header & Search Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
        <div className="space-y-1 sm:space-y-2 text-center md:text-left">
          <span className="text-[11px] sm:text-xs font-black tracking-widest text-blue-400 uppercase">
            Official E-Store Catalog
          </span>
          <h1 className="text-xl sm:text-4xl font-black">All Medicines & Healthcare</h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-lg">
            Explore certified pharmaceutical tablets, syrups, pediatric drops, and food supplements.
          </p>
        </div>

        {/* Global Search Bar */}
        <div className="w-full md:w-80 relative">
          <input
            type="text"
            placeholder="Search medicine or generic formula..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-slate-900 placeholder:text-slate-400 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold border border-white/20 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <Search className="w-4 h-4 text-slate-300 absolute left-3.5 top-3 sm:top-3.5" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-3 sm:top-3.5 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Layout (Filters Sidebar + Products Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-8">
        
        {/* DESKTOP FILTERS SIDEBAR */}
        <aside className="hidden lg:block space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                Filters
              </h3>
              {(selectedCategory !== 'all' || selectedSubCategory !== 'all' || rxOnly) && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-blue-600 hover:underline font-bold"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Main Categories (Full visibility, no cramped scrollbars!) */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-400 block">
                Primary Categories
              </label>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedSubCategory('all');
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  All Products ({products.length})
                </button>
                {categories.map((c) => {
                  const pCount = getCategoryProductCount(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(c.slug);
                        setSelectedSubCategory('all');
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-between ${
                        selectedCategory === c.slug
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        {c.icon && (
                          <span className="shrink-0 text-xs">
                            {c.icon.startsWith('http') || c.icon.startsWith('data:') ? (
                              <img src={c.icon} alt="" className="w-3.5 h-3.5 object-contain rounded-xs inline" />
                            ) : (
                              c.icon
                            )}
                          </span>
                        )}
                        <span className="truncate">{c.name}</span>
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ml-1.5 ${
                        selectedCategory === c.slug ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {pCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sub-Categories (Shows when category is selected) */}
            {activeCategoryObj?.sub_categories && activeCategoryObj.sub_categories.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <label className="text-xs font-black uppercase tracking-wider text-blue-600 block">
                  {activeCategoryObj.name} Subcategories
                </label>
                <div className="space-y-1 pl-2 border-l-2 border-blue-100">
                  <button
                    type="button"
                    onClick={() => setSelectedSubCategory('all')}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between ${
                      selectedSubCategory === 'all'
                        ? 'text-blue-700 font-bold bg-blue-50'
                        : 'text-slate-600 hover:text-blue-700'
                    }`}
                  >
                    <span>All {activeCategoryObj.name}</span>
                    <span className="text-[10px] text-slate-400">({getCategoryProductCount(activeCategoryObj.id)})</span>
                  </button>
                  {activeCategoryObj.sub_categories.map((sub) => {
                    const subCount = getSubCategoryProductCount(sub.id);
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setSelectedSubCategory(sub.slug)}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                          selectedSubCategory === sub.slug
                            ? 'text-blue-700 font-bold bg-blue-50'
                            : 'text-slate-600 hover:text-blue-700'
                        }`}
                      >
                        <span className="truncate">{sub.name}</span>
                        <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                          ({subCount})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Prescription Toggle */}
            <div className="pt-4 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={rxOnly}
                  onChange={(e) => setRxOnly(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span>Prescription (Rx) Required Only</span>
              </label>
            </div>
          </div>
        </aside>

        {/* PRODUCTS LIST & CONTROLS */}
        <main className="lg:col-span-3 space-y-6">
          
          {/* Top Sort Bar & Mobile Filter Trigger */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-2.5 sm:gap-4">
            
            {/* Mobile Filter Button */}
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden px-3.5 py-1.5 bg-slate-100 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              <span>Filters</span>
            </button>

            <div className="text-xs font-bold text-slate-600">
              Showing <span className="text-slate-900 font-extrabold">{filteredProducts.length}</span> items
            </div>

            {/* Sorting Dropdown */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
              <span className="text-slate-500 font-medium hidden sm:inline">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 font-bold px-2.5 py-1.5 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="featured">Featured First</option>
                <option value="newest">Newest Arrivals</option>
                <option value="price-low">Price: Low &rarr; High</option>
                <option value="price-high">Price: High &rarr; Low</option>
              </select>
            </div>
          </div>

          {/* Product Grid (Selco-style 4 cols desktop / 2 cols mobile) */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl sm:rounded-3xl p-8 sm:p-16 text-center border border-slate-100 space-y-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Pill className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">No medicines found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No matching medications found for your search or active filter combination.
              </p>
              <button
                onClick={clearFilters}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
              {filteredProducts.map((product) => {
                const isAdded = addedIds[product.id];
                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-100 hover:border-blue-200 shadow-xs hover:shadow-lg transition-all flex flex-col group relative"
                  >
                    {/* Rx Tag */}
                    {product.requires_prescription && (
                      <div className="absolute top-4 left-4 z-10 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[9px] sm:text-[10px] font-bold flex items-center gap-1 shadow-xs">
                        <AlertCircle className="w-2.5 h-2.5 text-amber-600" />
                        Rx
                      </div>
                    )}

                    {/* Image */}
                    <Link
                      href={`/products/${product.slug}/`}
                      className="w-full h-32 sm:h-44 rounded-xl bg-slate-50 flex items-center justify-center p-2.5 overflow-hidden relative"
                    >
                      <img
                        src={product.thumbnail_url || '/logo.png'}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </Link>

                    {/* Info */}
                    <div className="pt-2.5 sm:pt-3.5 flex-1 flex flex-col">
                      <span className="text-[10px] sm:text-[11px] font-bold text-blue-600 truncate">
                        {product.dosage || 'Pharmaceutical Product'}
                      </span>

                      <Link
                        href={`/products/${product.slug}/`}
                        className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-blue-600 transition-colors mt-0.5 line-clamp-1"
                      >
                        {product.name}
                      </Link>

                      {/* Rating */}
                      <div className="flex items-center gap-0.5 mt-1 text-amber-400">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star key={idx} className="w-2.5 h-2.5 fill-current" />
                        ))}
                      </div>

                      {/* Pricing & Add/Buy Buttons */}
                      <div className="mt-auto pt-2.5 sm:pt-3 border-t border-slate-100 space-y-1.5 sm:space-y-2">
                        <div className="flex items-baseline justify-between">
                          <div>
                            <div className="text-sm sm:text-base font-black text-slate-950">
                              Rs. {Number(product.price).toFixed(2)}
                            </div>
                            {product.original_price && Number(product.original_price) > Number(product.price) && (
                              <div className="text-[10px] text-slate-400 line-through">
                                Rs. {Number(product.original_price).toFixed(2)}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleAddToCart(product)}
                            className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl font-bold text-xs flex items-center gap-1 transition-all shadow-xs ${
                              isAdded
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-900 hover:bg-blue-600 text-white'
                            }`}
                            title="Add to Cart"
                          >
                            {isAdded ? <Check className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        <button
                          onClick={() => handleBuyNow(product)}
                          className="w-full py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors"
                        >
                          <Zap className="w-3 h-3" />
                          <span>Buy Now</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* MOBILE FILTER MODAL (Ergonomic button-based with 'Done (X Products)' selector) */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Filter Medicines</h3>
              <button onClick={() => setMobileFilterOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Categories buttons */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Categories</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setSelectedCategory('all'); setSelectedSubCategory('all'); }}
                  className={`p-2.5 rounded-xl text-xs font-bold text-left flex items-center justify-between ${
                    selectedCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>All</span>
                  <span className="text-[10px] opacity-80">({products.length})</span>
                </button>
                {categories.map((c) => {
                  const pCount = getCategoryProductCount(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { setSelectedCategory(c.slug); setSelectedSubCategory('all'); }}
                      className={`p-2.5 rounded-xl text-xs font-bold text-left flex items-center justify-between ${
                        selectedCategory === c.slug ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="truncate">{c.name}</span>
                      <span className="text-[10px] opacity-80 shrink-0 ml-1">({pCount})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subcategories if active */}
            {activeCategoryObj?.sub_categories && activeCategoryObj.sub_categories.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-blue-600 uppercase">
                  {activeCategoryObj.name} Subcategories
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSubCategory('all')}
                    className={`p-2 rounded-lg text-xs font-semibold flex items-center justify-between ${
                      selectedSubCategory === 'all' ? 'bg-blue-50 text-blue-700 font-bold' : 'bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span>All Sub</span>
                    <span className="text-[10px] text-slate-400">({getCategoryProductCount(activeCategoryObj.id)})</span>
                  </button>
                  {activeCategoryObj.sub_categories.map((sub) => {
                    const subCount = getSubCategoryProductCount(sub.id);
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setSelectedSubCategory(sub.slug)}
                        className={`p-2 rounded-lg text-xs font-semibold flex items-center justify-between ${
                          selectedSubCategory === sub.slug ? 'bg-blue-50 text-blue-700 font-bold' : 'bg-slate-50 text-slate-600'
                        }`}
                      >
                        <span className="truncate">{sub.name}</span>
                        <span className="text-[10px] text-slate-400 shrink-0 ml-1">({subCount})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Prescription switch */}
            <div className="pt-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={rxOnly}
                  onChange={(e) => setRxOnly(e.target.checked)}
                  className="rounded text-blue-600 h-4 w-4"
                />
                <span>Prescription (Rx) Required Only</span>
              </label>
            </div>

            {/* Done button with live filtered count */}
            <div className="pt-4 border-t border-slate-100 flex gap-3">
              <button
                type="button"
                onClick={clearFilters}
                className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="flex-2 py-3 bg-blue-600 text-white font-extrabold text-xs rounded-xl shadow-md"
              >
                Done ({filteredProducts.length} Medicines)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
