'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  getCategories, 
  getFeaturedProducts, 
  getProducts,
  getBannerProducts,
  getCachedCategories, 
  getCachedFeaturedProducts 
} from '@/lib/db';
import { Product, Category } from '@/types';
import { 
  Pill, 
  ShieldCheck, 
  FileText, 
  ArrowRight, 
  ShoppingBag, 
  Check, 
  Sparkles, 
  Clock, 
  Award, 
  ChevronRight, 
  ChevronLeft, 
  AlertCircle, 
  MessageCircle, 
  Star, 
  Zap, 
  Droplet, 
  Milk, 
  Syringe, 
  Shield, 
  Brain, 
  Smile, 
  Scissors, 
  Activity, 
  LayoutGrid, 
  HeartHandshake, 
  Stethoscope, 
  PhoneCall,
  Droplets
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { ProductCardSkeleton, Skeleton } from '@/components/common/Skeleton';

// Map icon names to Lucide icons
const iconMap: Record<string, React.ReactNode> = {
  Pill: <Pill className="w-6 h-6" />,
  Milk: <Milk className="w-6 h-6" />,
  Droplet: <Droplet className="w-6 h-6" />,
  Sparkles: <Sparkles className="w-6 h-6" />,
  Syringe: <Syringe className="w-6 h-6" />,
  Shield: <Shield className="w-6 h-6" />,
  Smile: <Smile className="w-6 h-6" />,
  Scissors: <Scissors className="w-6 h-6" />,
  Activity: <Activity className="w-6 h-6" />,
  Brain: <Brain className="w-6 h-6" />,
};

// Dynamic Category Headings Tab Structure
interface CategoryTab {
  id: string;
  label: string;
  badge?: string;
  icon: React.ElementType;
  emoji?: string;
  isSpecial?: boolean;
}

export default function HomePage() {
  const router = useRouter();
  const { addToCart } = useCart();
  
  // Real-time live data state
  const [categories, setCategories] = useState<Category[]>(() => getCachedCategories());
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>(() => getCachedFeaturedProducts());
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [bannerProducts, setBannerProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(() => {
    return getCachedFeaturedProducts().length === 0;
  });
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  // Active Category Headings Selection
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('all');

  // Top Product Screen (Auto-Advancing Slides) State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  // Pharmaceutical Categories Carousel State & Ref
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [isCatPaused, setIsCatPaused] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [c, p, allP, bP] = await Promise.all([
          getCategories(),
          getFeaturedProducts(8),
          getProducts({ onlyActive: true }),
          getBannerProducts(),
        ]);
        if (!isMounted) return;
        if (c && c.length > 0) setCategories(c);
        if (p && p.length > 0) setFeaturedProducts(p);
        if (allP && allP.length > 0) setAllProducts(allP);
        if (bP && bP.length > 0) setBannerProducts(bP);
      } catch (e) {
        console.error('Error fetching homepage data:', e);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener('myko_products_updated', handleUpdate);
    window.addEventListener('myko_categories_updated', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('myko_products_updated', handleUpdate);
      window.removeEventListener('myko_categories_updated', handleUpdate);
    };
  }, []);

  // Products to show in top running screen (Prioritizes products marked for banner by Admin)
  const sliderProducts = useMemo(() => {
    if (bannerProducts.length > 0) return bannerProducts;
    if (featuredProducts.length > 0) return featuredProducts;
    if (allProducts.length > 0) return allProducts.slice(0, 8);
    return [];
  }, [bannerProducts, featuredProducts, allProducts]);

  // Dynamic Category Headings configured from database & Admin Panel
  const categoryTabs = useMemo<CategoryTab[]>(() => {
    const list: CategoryTab[] = [];

    // Filter categories where show_in_headings !== false, sorted by display_order
    const visibleCats = [...categories]
      .filter((c) => c.show_in_headings !== false)
      .sort((a, b) => (a.display_order ?? 1) - (b.display_order ?? 1));

    visibleCats.forEach((cat) => {
      const slug = (cat.slug || '').toLowerCase();
      const name = (cat.name || '').toLowerCase();
      const isMindCare = slug === 'mind-care-clinic' || name.includes('mind care');

      let IconComponent = Pill;
      let emojiChar: string | undefined = undefined;

      if (isMindCare) {
        IconComponent = Brain;
      } else if (cat.icon && cat.icon.length <= 4 && !cat.icon.startsWith('http')) {
        emojiChar = cat.icon;
      } else if (slug.includes('tablet')) {
        IconComponent = Pill;
      } else if (slug.includes('syrup')) {
        IconComponent = Milk;
      } else if (slug.includes('drop')) {
        IconComponent = Droplets;
      } else if (slug.includes('supplement') || slug.includes('nutra')) {
        IconComponent = Sparkles;
      } else if (slug.includes('inject')) {
        IconComponent = Syringe;
      } else if (slug.includes('derma') || slug.includes('topical') || slug.includes('cosmetic')) {
        IconComponent = Droplets;
      } else if (slug.includes('dental')) {
        IconComponent = Smile;
      } else if (slug.includes('surgical')) {
        IconComponent = Scissors;
      } else if (slug.includes('equipment')) {
        IconComponent = Activity;
      }

      list.push({
        id: cat.slug || cat.id,
        label: cat.name,
        badge: isMindCare ? 'Psychology' : undefined,
        icon: IconComponent,
        emoji: emojiChar,
        isSpecial: isMindCare,
      });
    });

    // Add 'All Formulations' tab
    list.push({
      id: 'all',
      label: 'All Formulations',
      badge: 'Explore',
      icon: LayoutGrid,
    });

    return list;
  }, [categories]);

  // Auto-advance top product slider every 3.5 seconds
  useEffect(() => {
    if (sliderProducts.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderProducts.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [sliderProducts.length, isPaused]);

  // Reset slide index if product count changes
  useEffect(() => {
    if (currentSlide >= sliderProducts.length) {
      setCurrentSlide(0);
    }
  }, [sliderProducts.length, currentSlide]);

  // Touch Swipe Handlers for mobile users on top product slider
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchEndX(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX !== null && touchEndX !== null) {
      const distance = touchStartX - touchEndX;
      const minSwipeDistance = 40;
      if (distance > minSwipeDistance) {
        setCurrentSlide((prev) => (prev + 1) % sliderProducts.length);
      } else if (distance < -minSwipeDistance) {
        setCurrentSlide((prev) => (prev - 1 + sliderProducts.length) % sliderProducts.length);
      }
    }
    setTouchStartX(null);
    setTouchEndX(null);
    setTimeout(() => setIsPaused(false), 2500);
  };

  const handlePrevSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide((prev) => (prev - 1 + sliderProducts.length) % sliderProducts.length);
  };

  const handleNextSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % sliderProducts.length);
  };

  // Dynamic Product Filter according to clicked Category Tab
  const filteredProducts = useMemo(() => {
    const listToFilter = allProducts.length > 0 ? allProducts : featuredProducts;
    if (selectedCategoryTab === 'all') return listToFilter;

    // Direct match against category in database
    const matchedCat = categories.find(
      (c) => c.slug === selectedCategoryTab || c.id === selectedCategoryTab
    );

    const catSlug = (matchedCat?.slug || selectedCategoryTab || '').toLowerCase();
    const catName = (matchedCat?.name || '').toLowerCase();

    return listToFilter.filter((product) => {
      // 1. Direct Category ID match
      if (matchedCat && product.category_id === matchedCat.id) return true;

      const prodName = (product.name || '').toLowerCase();
      const prodDesc = (product.description || '').toLowerCase();
      const generic = (product.generic_name || '').toLowerCase();

      // 2. Keyword fallback matching
      if (catSlug.includes('pharma') || catSlug.includes('tablet') || catName.includes('tablet')) {
        if (prodName.includes('tablet') || generic.includes('tablet') || prodDesc.includes('tablet')) return true;
      }
      if (catSlug.includes('pharma') || catSlug.includes('syrup') || catName.includes('syrup')) {
        if (prodName.includes('syrup') || generic.includes('syrup') || prodDesc.includes('syrup')) return true;
      }
      if (catSlug.includes('pharma') || catSlug.includes('drop') || catName.includes('drop')) {
        if (prodName.includes('drop') || generic.includes('drop') || prodDesc.includes('drop')) return true;
      }
      if (catSlug.includes('pharma') || catSlug.includes('inject') || catName.includes('inject')) {
        if (prodName.includes('inject') || generic.includes('inject') || prodName.includes('ampoule')) return true;
      }
      if (catSlug.includes('nutra') || catSlug.includes('supplement') || catName.includes('supplement')) {
        if (prodName.includes('sachet') || prodName.includes('capsule') || prodName.includes('vitamin') || prodName.includes('nutra') || prodName.includes('iron') || prodName.includes('calcium') || prodDesc.includes('supplement') || prodDesc.includes('organic')) return true;
      }
      if (catSlug.includes('dental') || catName.includes('dental')) {
        if (prodName.includes('dental') || prodName.includes('tooth') || prodName.includes('mouth') || prodName.includes('paste') || prodDesc.includes('dental')) return true;
      }
      if (catSlug.includes('cosmetics') || catSlug.includes('derma') || catSlug.includes('topical') || catName.includes('derma')) {
        if (prodName.includes('cream') || prodName.includes('lotion') || prodName.includes('gel') || prodName.includes('wash') || prodName.includes('derma') || prodDesc.includes('skin')) return true;
      }
      if (catSlug.includes('surgical') || catName.includes('surgical')) {
        if (prodName.includes('surgical') || prodName.includes('bandage') || prodName.includes('gauge') || prodName.includes('cannula') || prodName.includes('syringe') || prodDesc.includes('surgical')) return true;
      }
      if (catSlug.includes('equipments') || catSlug.includes('equipment') || catName.includes('equipment')) {
        if (prodName.includes('equipment') || prodName.includes('monitor') || prodName.includes('meter') || prodName.includes('nebulizer') || prodName.includes('apparatus') || prodName.includes('device') || prodDesc.includes('equipment')) return true;
      }

      // Check if product's category object has matching name/slug
      const productCat = categories.find(c => c.id === product.category_id);
      if (productCat) {
        const pSlug = (productCat.slug || '').toLowerCase();
        if (pSlug === catSlug || pSlug.includes(catSlug) || catSlug.includes(pSlug)) return true;
      }

      return false;
    });
  }, [selectedCategoryTab, allProducts, featuredProducts, categories]);

  // Bottom carousel: Only include categories with show_in_slider !== false
  const sliderCategories = useMemo(() => {
    return categories
      .filter((c) => c.show_in_slider !== false)
      .sort((a, b) => (a.display_order ?? 1) - (b.display_order ?? 1));
  }, [categories]);

  // Infinite circular categories rotation for bottom marquee
  const infiniteCategories = useMemo(() => {
    if (sliderCategories.length === 0) return [];
    return [...sliderCategories, ...sliderCategories, ...sliderCategories];
  }, [sliderCategories]);

  useEffect(() => {
    if (sliderCategories.length > 0 && categoryScrollRef.current) {
      const el = categoryScrollRef.current;
      const oneSetWidth = el.scrollWidth / 3;
      if (oneSetWidth > 0 && el.scrollLeft === 0) {
        el.scrollLeft = oneSetWidth;
      }
    }
  }, [sliderCategories.length]);

  useEffect(() => {
    if (sliderCategories.length === 0 || isCatPaused) return;

    let animId: number;
    let lastTime = performance.now();
    const pixelsPerSecond = 32;

    const animate = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const el = categoryScrollRef.current;
      if (el) {
        el.scrollLeft += pixelsPerSecond * delta;
        const oneSetWidth = el.scrollWidth / 3;
        if (oneSetWidth > 0 && el.scrollLeft >= oneSetWidth * 2) {
          el.scrollLeft -= oneSetWidth;
        }
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [sliderCategories.length, isCatPaused]);

  const handleCategoryScroll = () => {
    const el = categoryScrollRef.current;
    if (!el || sliderCategories.length === 0) return;
    const oneSetWidth = el.scrollWidth / 3;
    if (oneSetWidth <= 0) return;

    if (el.scrollLeft >= oneSetWidth * 2) {
      el.scrollLeft -= oneSetWidth;
    } else if (el.scrollLeft <= 5) {
      el.scrollLeft += oneSetWidth;
    }
  };

  const handleScrollCategories = (direction: 'left' | 'right') => {
    const el = categoryScrollRef.current;
    if (!el) return;
    setIsCatPaused(true);
    const firstCard = el.firstElementChild as HTMLElement;
    const step = firstCard ? (firstCard.offsetWidth + 8) * (window.innerWidth < 640 ? 1 : 2) : 120;

    if (direction === 'left') {
      el.scrollBy({ left: -step, behavior: 'smooth' });
    } else {
      el.scrollBy({ left: step, behavior: 'smooth' });
    }

    setTimeout(() => setIsCatPaused(false), 2500);
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1, true); // Opens slide-out drawer
    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1500);
  };

  const handleBuyNow = (product: Product) => {
    addToCart(product, 1, false);
    router.push('/checkout/');
  };

  return (
    <div className="space-y-4 sm:space-y-8 pb-6 sm:pb-12 w-full max-w-full overflow-x-hidden">
      
      {/* 1. TOP RUNNING PRODUCT SCREEN / SLIDER (Replaces static banner with running product carousel) */}
      <section className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 pt-1 sm:pt-4">
        {loading ? (
          <div className="w-full aspect-[16/8] sm:aspect-[21/8] rounded-2xl sm:rounded-3xl bg-slate-100 flash-skeleton shadow-md" />
        ) : sliderProducts.length > 0 ? (
          <div
            className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-blue-900/40 select-none text-white group"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Ambient Medical Glow Background Effects */}
            <div className="absolute -right-16 -top-16 w-80 h-80 bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />

            {/* Sliding Product Showcase Track */}
            <div
              className="flex transition-transform duration-700 ease-in-out w-full"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {sliderProducts.map((product, idx) => (
                <div
                  key={product.id || idx}
                  className="w-full shrink-0 p-3.5 sm:p-7 lg:p-10 flex flex-col-reverse md:flex-row items-center justify-between gap-3.5 sm:gap-8 lg:gap-10 relative z-10"
                >
                  {/* Left Column: Product Details & Direct CTAs */}
                  <div className="w-full md:w-3/5 space-y-2 sm:space-y-4 text-center md:text-left">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 sm:gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] sm:text-xs font-bold tracking-wide uppercase">
                        <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" />
                        Featured Formulation
                      </span>
                      {product.requires_prescription && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[9px] sm:text-xs font-bold">
                          <AlertCircle className="w-3 h-3 text-amber-400" />
                          Prescription Required (Rx)
                        </span>
                      )}
                    </div>

                    <div>
                      <h2 className="text-lg sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-snug line-clamp-2">
                        {product.name}
                      </h2>
                      <p className="text-blue-200/90 text-xs sm:text-sm font-semibold mt-0.5 sm:mt-1 line-clamp-1">
                        {product.dosage || product.generic_name || 'Clinical Pharmaceutical Medicine'}
                      </p>
                    </div>

                    <p className="text-slate-300 text-[11px] sm:text-xs lg:text-sm line-clamp-2 leading-relaxed max-w-xl mx-auto md:mx-0">
                      {product.short_description || product.description || 'Genuine healthcare formulation sourced directly from authorized manufacturers under strict cold-chain compliance.'}
                    </p>

                    {/* Price and Stock Status */}
                    <div className="flex items-baseline justify-center md:justify-start gap-2.5 pt-0.5">
                      <span className="text-xl sm:text-2xl lg:text-3xl font-black text-white">
                        Rs. {Number(product.price).toFixed(2)}
                      </span>
                      {product.original_price && Number(product.original_price) > Number(product.price) && (
                        <span className="text-xs sm:text-sm text-slate-400 line-through">
                          Rs. {Number(product.original_price).toFixed(2)}
                        </span>
                      )}
                      <span className="text-[10px] sm:text-[11px] text-emerald-400 font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                        In Stock • Verified
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3 pt-1">
                      <button
                        onClick={() => handleBuyNow(product)}
                        className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-transform active:scale-95 cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        Buy Now
                      </button>
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors active:scale-95 cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        {addedIds[product.id] ? 'Added!' : 'Add to Cart'}
                      </button>
                      <Link
                        href={`/products/${product.slug}/`}
                        className="px-2.5 py-1.5 text-blue-300 hover:text-white text-xs sm:text-sm font-semibold flex items-center gap-1 transition-colors"
                      >
                        Details <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Right Column: Clean Product Image Showcase */}
                  <div className="w-full md:w-2/5 flex items-center justify-center">
                    <Link
                      href={`/products/${product.slug}/`}
                      className="w-36 h-36 sm:w-56 sm:h-56 lg:w-68 lg:h-68 rounded-2xl sm:rounded-3xl bg-white p-3 sm:p-4 shadow-2xl flex items-center justify-center relative overflow-hidden group/img transition-transform hover:scale-105"
                    >
                      <img
                        src={product.thumbnail_url || '/logo.png'}
                        alt={product.name}
                        loading={idx === 0 ? 'eager' : 'lazy'}
                        fetchPriority={idx === 0 ? 'high' : 'auto'}
                        className="w-full h-full object-contain drop-shadow-md"
                      />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Slider Navigation Arrows */}
            {sliderProducts.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevSlide}
                  aria-label="Previous Product"
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-blue-600 text-white backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 sm:opacity-80 transition-all z-20 cursor-pointer shadow-md"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextSlide}
                  aria-label="Next Product"
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-blue-600 text-white backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 sm:opacity-80 transition-all z-20 cursor-pointer shadow-md"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </>
            )}

            {/* Indicator Dots */}
            {sliderProducts.length > 1 && (
              <div className="absolute bottom-2 sm:bottom-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 z-20">
                {sliderProducts.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentSlide(idx)}
                    aria-label={`Jump to product ${idx + 1}`}
                    className={`transition-all duration-300 rounded-full cursor-pointer ${
                      currentSlide === idx
                        ? 'w-5 sm:w-7 h-1.5 sm:h-2 bg-blue-500 shadow-md ring-2 ring-white/90'
                        : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/50 hover:bg-white'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : null}
      </section>

      {/* 2. HORIZONTAL CATEGORY HEADINGS STRIP (Line mein seedhi headings with smooth scroll) */}
      <section className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-1.5 sm:p-2.5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 px-0.5 select-none scroll-smooth">
            {categoryTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedCategoryTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategoryTab(tab.id)}
                  className={`shrink-0 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    isActive
                      ? tab.isSpecial
                        ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-600/25 scale-[1.02]'
                        : 'bg-blue-600 text-white shadow-md shadow-blue-600/20 scale-[1.02]'
                      : tab.isSpecial
                        ? 'bg-teal-50/80 text-teal-800 hover:bg-teal-100 border border-teal-200/80'
                        : 'bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-slate-200/80'
                  }`}
                >
                  {tab.emoji ? (
                    <span className="text-sm shrink-0 leading-none">{tab.emoji}</span>
                  ) : (
                    <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${
                      isActive ? 'text-white' : tab.isSpecial ? 'text-teal-600' : 'text-blue-600'
                    }`} />
                  )}
                  <span className="whitespace-nowrap">{tab.label}</span>
                  {tab.badge && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold hidden sm:inline-block ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. DYNAMIC CATEGORY VIEW (Shows Mind Care Clinic or Filtered Products Grid) */}
      {selectedCategoryTab === 'mind-care-clinic' ? (
        /* SPECIAL VIEW: MIND CARE CLINIC (Psychologist & Mental Health Services) */
        <section className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-8 text-white shadow-xl border border-teal-700/50 space-y-4 sm:space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5 sm:gap-4 border-b border-teal-700/50 pb-4 sm:pb-5">
              <div className="space-y-1 sm:space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-teal-500/20 border border-teal-400/40 text-teal-300 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                  <Brain className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-teal-300" />
                  Clinical Psychology & Mental Wellness
                </div>
                <h3 className="text-lg sm:text-2xl lg:text-3xl font-black text-white">
                  Mind Care Clinic — Clinical Psychological Counseling
                </h3>
                <p className="text-teal-100 text-[11px] sm:text-sm max-w-2xl leading-relaxed">
                  Consult certified Clinical Psychologists for evidence-based therapy, emotional wellness, anxiety, depression counseling, and behavioral development in a completely confidential environment.
                </p>
              </div>

              {/* Action Buttons for Booking */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
                <a
                  href="https://wa.me/923184008718?text=Hello%20Mind%20Care%20Clinic,%20I%20would%20like%20to%20book%20a%20psychological%20counseling%20session."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 sm:px-5 sm:py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg flex items-center gap-1.5 transition-transform active:scale-95"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-slate-950" />
                  Book on WhatsApp
                </a>
                <a
                  href="tel:03145200832"
                  className="px-3.5 py-2 sm:px-5 sm:py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-teal-300" />
                  Call: 0314-5200832
                </a>
              </div>
            </div>

            {/* 4 Pillars of Mind Care Clinic */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              <div className="bg-white/10 border border-white/10 rounded-2xl p-3.5 sm:p-4 space-y-1.5 sm:space-y-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold">
                  <Brain className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h4 className="font-extrabold text-xs sm:text-sm text-white">Anxiety & Depression</h4>
                <p className="text-[10px] sm:text-xs text-teal-100/90 leading-relaxed">
                  Therapeutic intervention for panic, chronic stress, mood swings, and general anxiety disorders.
                </p>
              </div>

              <div className="bg-white/10 border border-white/10 rounded-2xl p-3.5 sm:p-4 space-y-1.5 sm:space-y-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold">
                  <HeartHandshake className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h4 className="font-extrabold text-xs sm:text-sm text-white">Cognitive Behavioral Therapy</h4>
                <p className="text-[10px] sm:text-xs text-teal-100/90 leading-relaxed">
                  Scientifically proven CBT methodologies to rebuild positive cognitive and thought patterns.
                </p>
              </div>

              <div className="bg-white/10 border border-white/10 rounded-2xl p-3.5 sm:p-4 space-y-1.5 sm:space-y-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold">
                  <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h4 className="font-extrabold text-xs sm:text-sm text-white">Child & Youth Psychology</h4>
                <p className="text-[10px] sm:text-xs text-teal-100/90 leading-relaxed">
                  Academic counseling, ADHD support, behavioral therapy, and emotional grooming for students.
                </p>
              </div>

              <div className="bg-white/10 border border-white/10 rounded-2xl p-3.5 sm:p-4 space-y-1.5 sm:space-y-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h4 className="font-extrabold text-xs sm:text-sm text-white">100% Confidential</h4>
                <p className="text-[10px] sm:text-xs text-teal-100/90 leading-relaxed">
                  Private one-on-one sessions maintaining complete ethical discretion and clinical privacy.
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* PRODUCT GRID VIEW: FILTERED CATEGORY MEDICINES */
        <section className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 space-y-3 sm:space-y-5">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-[10px] sm:text-xs font-black tracking-widest text-blue-600 uppercase">
                {selectedCategoryTab === 'all' ? 'Complete Pharmacy Catalog' : 'Therapeutic Formulations'}
              </span>
              <h2 className="text-lg sm:text-2xl lg:text-3xl font-black text-slate-900 mt-0.5">
                {categoryTabs.find(t => t.id === selectedCategoryTab)?.label || 'Pharmaceutical Medicines'}
              </h2>
            </div>
            <Link
              href="/products/"
              className="text-blue-600 hover:text-blue-700 font-bold text-xs sm:text-sm flex items-center gap-0.5"
            >
              <span>Explore All ({filteredProducts.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5">
              {filteredProducts.map((product) => {
                const isAdded = addedIds[product.id];
                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-slate-100 hover:border-blue-200 shadow-xs hover:shadow-xl transition-all flex flex-col group relative"
                  >
                    {/* Rx Badge */}
                    {product.requires_prescription && (
                      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 px-1.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[8px] sm:text-[10px] font-bold flex items-center gap-0.5 sm:gap-1">
                        <AlertCircle className="w-2.5 h-2.5 text-amber-600" />
                        Rx
                      </div>
                    )}

                    {/* Thumbnail Image */}
                    <Link
                      href={`/products/${product.slug}/`}
                      className="w-full h-28 sm:h-40 rounded-xl bg-slate-50/80 flex items-center justify-center p-2 sm:p-2.5 overflow-hidden relative"
                    >
                      <img
                        src={product.thumbnail_url || '/logo.png'}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </Link>

                    {/* Content */}
                    <div className="pt-2 sm:pt-3 flex-1 flex flex-col">
                      <span className="text-[10px] sm:text-[11px] font-bold text-blue-600 block truncate">
                        {product.dosage || 'Healthcare Product'}
                      </span>

                      <Link
                        href={`/products/${product.slug}/`}
                        className="font-bold text-slate-900 text-xs sm:text-base group-hover:text-blue-600 transition-colors mt-0.5 line-clamp-1"
                      >
                        {product.name}
                      </Link>

                      {/* Rating */}
                      <div className="flex items-center gap-0.5 mt-0.5 sm:mt-1 text-amber-400">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star key={idx} className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
                        ))}
                        <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold ml-1">(5.0)</span>
                      </div>

                      {/* Price & Buy Now / Add to Cart */}
                      <div className="mt-auto pt-2 sm:pt-2.5 border-t border-slate-100 space-y-1.5">
                        <div className="flex items-baseline justify-between">
                          <div>
                            <div className="text-xs sm:text-base font-black text-slate-950">
                              Rs. {Number(product.price).toFixed(2)}
                            </div>
                            {product.original_price && Number(product.original_price) > Number(product.price) && (
                              <div className="text-[9px] sm:text-[10px] text-slate-400 line-through">
                                Rs. {Number(product.original_price).toFixed(2)}
                              </div>
                            )}
                          </div>

                          {/* Quick Add Button */}
                          <button
                            onClick={() => handleAddToCart(product)}
                            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl font-bold text-xs flex items-center gap-1 transition-all shadow-xs cursor-pointer ${
                              isAdded
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-900 hover:bg-blue-600 text-white'
                            }`}
                            title="Add to Cart"
                          >
                            {isAdded ? (
                              <>
                                <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                <span className="hidden sm:inline text-xs">Added</span>
                              </>
                            ) : (
                              <>
                                <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                <span className="hidden sm:inline text-xs">Add</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Buy Now Direct Button */}
                        <button
                          onClick={() => handleBuyNow(product)}
                          className="w-full py-1 sm:py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
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
          ) : (
            /* Empty Category Notice with WhatsApp Direct Inquire */
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 text-center space-y-2.5 sm:space-y-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Pill className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h4 className="text-sm sm:text-lg font-black text-slate-900">
                Formulations Available Upon Requisition
              </h4>
              <p className="text-[11px] sm:text-sm text-slate-500 max-w-md mx-auto">
                All certified products in this category are stocked at our licensed central warehouse. Inquire directly with our pharmacist for quick pricing and delivery.
              </p>
              <a
                href="https://wa.me/923184008718?text=Hello%20MykoTech%20Pharma,%20I%20am%20inquiring%20about%20products%20in%20this%20category."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md transition-transform active:scale-95"
              >
                <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Inquire via WhatsApp (0318-4008718)
              </a>
            </div>
          )}
        </section>
      )}

      {/* 4. INSTANT PRESCRIPTION UPLOAD BANNER */}
      <section className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-600 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-3.5 sm:gap-6">
          <div className="space-y-1 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
              <Pill className="w-3 h-3" />
              Doctor Slip Delivery Service
            </div>
            <h3 className="text-base sm:text-2xl font-black">Have a Doctor's Prescription?</h3>
            <p className="text-blue-100 text-xs sm:text-sm max-w-xl">
              Upload your doctor's slip in seconds. Our certified pharmacists will verify your medication and arrange urgent home delivery.
            </p>
          </div>
          <Link
            href="/prescription/"
            className="shrink-0 px-4 py-2.5 sm:px-6 sm:py-3.5 bg-white hover:bg-blue-50 text-blue-900 font-extrabold text-xs sm:text-sm rounded-xl shadow-md flex items-center gap-1.5 transition-transform active:scale-95"
          >
            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
            Upload Prescription Now
          </Link>
        </div>
      </section>

      {/* 5. CONTINUOUS THERAPEUTIC CATEGORIES GLIDE CAROUSEL */}
      <section className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 space-y-2.5 sm:space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-black tracking-widest text-blue-600 uppercase">
              Shop by Category
            </span>
            <h2 className="text-base sm:text-2xl md:text-3xl font-black text-slate-900 mt-0.5">
              Therapeutic Catalogues
            </h2>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => handleScrollCategories('left')}
              aria-label="Previous categories"
              className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 flex items-center justify-center transition-colors cursor-pointer border border-slate-200/80 active:scale-90"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleScrollCategories('right')}
              aria-label="Next categories"
              className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 flex items-center justify-center transition-colors cursor-pointer border border-slate-200/80 active:scale-90"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <Link
              href="/products/"
              className="ml-1 sm:ml-2 text-blue-600 hover:text-blue-700 font-bold text-xs sm:text-sm flex items-center gap-0.5 shrink-0"
            >
              <span>View All</span>
              <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex items-stretch gap-2 sm:gap-3 overflow-hidden py-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="shrink-0 w-[calc((100%-16px)/3)] min-w-[calc((100%-16px)/3)] sm:w-[calc((100%-24px)/4)] sm:min-w-[calc((100%-24px)/4)] md:w-[calc((100%-32px)/5)] md:min-w-[calc((100%-32px)/5)] lg:w-[calc((100%-40px)/6)] lg:min-w-[calc((100%-40px)/6)] bg-white p-2 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 flex flex-col items-center gap-2"
              >
                <Skeleton className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl" />
                <Skeleton className="w-3/4 h-3" />
                <Skeleton className="w-1/2 h-2" />
              </div>
            ))}
          </div>
        ) : (
          <div
            ref={categoryScrollRef}
            onScroll={handleCategoryScroll}
            onMouseEnter={() => setIsCatPaused(true)}
            onMouseLeave={() => setIsCatPaused(false)}
            className="flex items-stretch gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-1 select-none cursor-grab active:cursor-grabbing"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {infiniteCategories.map((cat, idx) => (
              <Link
                key={`${cat.id}-${idx}`}
                href={`/products/?category=${cat.slug}`}
                className="shrink-0 w-[calc((100%-16px)/3)] min-w-[calc((100%-16px)/3)] sm:w-[calc((100%-24px)/4)] sm:min-w-[calc((100%-24px)/4)] md:w-[calc((100%-32px)/5)] md:min-w-[calc((100%-32px)/5)] lg:w-[calc((100%-40px)/6)] lg:min-w-[calc((100%-40px)/6)] group bg-white p-2 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-200/90 hover:border-blue-400 hover:shadow-md transition-all flex flex-col items-center text-center justify-between gap-1.5 sm:gap-2.5 relative overflow-hidden"
              >
                <div className="w-9 h-9 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-2xs overflow-hidden p-1.5">
                  {(() => {
                    const icon = cat.icon;
                    if (!icon) return <Pill className="w-4 h-4 sm:w-6 sm:h-6" />;
                    if (icon.startsWith('http') || icon.startsWith('data:') || icon.startsWith('/')) {
                      return <img src={icon} alt={cat.name} className="w-full h-full object-contain" />;
                    }
                    if (iconMap[icon]) return iconMap[icon];
                    return <Pill className="w-4 h-4 sm:w-6 sm:h-6" />;
                  })()}
                </div>
                <div className="w-full">
                  <span className="font-extrabold text-slate-800 text-[11px] sm:text-xs block group-hover:text-blue-600 transition-colors line-clamp-1">
                    {cat.name}
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-slate-400 block line-clamp-1 mt-0.5">
                    Formulations
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 6. WHY CHOOSE MYKOTECH PHARMA (Trust Pillars) */}
      <section className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-10 shadow-xl grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
          <div className="space-y-2 sm:space-y-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h4 className="text-base sm:text-lg font-black text-white">Genuine Manufacturer Sourcing</h4>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Every drop, syrup, tablet and food supplement is obtained directly from authorized pharmaceutical companies with verified batch codes.
            </p>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h4 className="text-base sm:text-lg font-black text-white">Fast Nationwide Delivery</h4>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Safe, temperature-controlled courier delivery across Islamabad, Rawalpindi, and all major cities of Pakistan.
            </p>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h4 className="text-base sm:text-lg font-black text-white">Direct WhatsApp Consultation</h4>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Need assistance with generic substitutes or dosages? Chat directly with our pharmacy team via WhatsApp at 0318-4008718.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
