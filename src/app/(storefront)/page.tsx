'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  getHeroBanners, 
  getCategories, 
  getFeaturedProducts, 
  getCachedHeroBanners, 
  getCachedCategories, 
  getCachedFeaturedProducts 
} from '@/lib/db';
import { Product, Category, HeroBanner } from '@/types';
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
  Shield
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
};

export default function HomePage() {
  const router = useRouter();
  const { addToCart } = useCart();
  
  // Fresh live cloud data state (with high-speed flash-skeleton during initial load)
  const [banners, setBanners] = useState<HeroBanner[]>(() => getCachedHeroBanners());
  const [categories, setCategories] = useState<Category[]>(() => getCachedCategories());
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>(() => getCachedFeaturedProducts());
  const [loading, setLoading] = useState<boolean>(() => {
    // If in-memory cache is empty, start in loading=true to show flash-skeleton
    return getCachedHeroBanners().length === 0;
  });
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  // Hero Banner Slider State
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
        const [b, c, p] = await Promise.all([
          getHeroBanners(),
          getCategories(),
          getFeaturedProducts(8),
        ]);
        if (!isMounted) return;
        if (b) setBanners(b);
        if (c && c.length > 0) setCategories(c);
        if (p) setFeaturedProducts(p);
      } catch (e) {
        console.error(e);
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
    window.addEventListener('myko_banners_updated', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('myko_products_updated', handleUpdate);
      window.removeEventListener('myko_categories_updated', handleUpdate);
      window.removeEventListener('myko_banners_updated', handleUpdate);
    };
  }, []);

  // Filter active banners or provide clean fallback
  const displayBanners = banners.filter((b) => b.is_active !== false);
  const activeBanners = displayBanners.length > 0 ? displayBanners : [
    {
      id: 'default-hero',
      image_url: '/hero-banner.webp',
      cta_link: '/products/',
      title: 'MykoTech Pharma - Live long Live Happy!',
    } as HeroBanner
  ];

  // Auto-advance every 3 seconds to next banner if not paused/touched
  useEffect(() => {
    if (activeBanners.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeBanners.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [activeBanners.length, isPaused]);

  // Reset slide index if banners count changes
  useEffect(() => {
    if (currentSlide >= activeBanners.length) {
      setCurrentSlide(0);
    }
  }, [activeBanners.length, currentSlide]);

  // Touch Swipe Handlers for mobile users
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
        // Swiped left -> move to next banner
        setCurrentSlide((prev) => (prev + 1) % activeBanners.length);
      } else if (distance < -minSwipeDistance) {
        // Swiped right -> move to previous banner
        setCurrentSlide((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
      }
    }
    setTouchStartX(null);
    setTouchEndX(null);
    setTimeout(() => setIsPaused(false), 2500);
  };

  const handlePrevSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const handleNextSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % activeBanners.length);
  };

  // Infinite circular categories rotation: Tripled list creates an uninterrupted conveyor belt
  const infiniteCategories = useMemo(() => {
    if (categories.length === 0) return [];
    return [...categories, ...categories, ...categories];
  }, [categories]);

  // Set initial scroll to the middle set so scrolling in either direction has buffer
  useEffect(() => {
    if (categories.length > 0 && categoryScrollRef.current) {
      const el = categoryScrollRef.current;
      const oneSetWidth = el.scrollWidth / 3;
      if (oneSetWidth > 0 && el.scrollLeft === 0) {
        el.scrollLeft = oneSetWidth;
      }
    }
  }, [categories.length]);

  // Continuous non-stop glide (no static pause, no jumping backwards, endless rotation)
  useEffect(() => {
    if (categories.length === 0 || isCatPaused) return;

    let animId: number;
    let lastTime = performance.now();
    // Gentle, steady readable glide speed (~32px per second)
    const pixelsPerSecond = 32;

    const animate = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const el = categoryScrollRef.current;
      if (el) {
        el.scrollLeft += pixelsPerSecond * delta;

        // Invisible infinite wrap when 2nd set finishes
        const oneSetWidth = el.scrollWidth / 3;
        if (oneSetWidth > 0 && el.scrollLeft >= oneSetWidth * 2) {
          el.scrollLeft -= oneSetWidth;
        }
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [categories.length, isCatPaused]);

  // Handle scroll boundaries during user touch swipe or drag
  const handleCategoryScroll = () => {
    const el = categoryScrollRef.current;
    if (!el || categories.length === 0) return;
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

  const handleTouchStartCat = () => {
    setIsCatPaused(true);
  };

  const handleTouchEndCat = () => {
    setTimeout(() => setIsCatPaused(false), 1500);
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1, true); // Opens slide-out drawer
    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1500);
  };

  const handleBuyNow = (product: Product) => {
    addToCart(product, 1, false); // Does not open drawer
    router.push('/checkout/');
  };

  return (
    <div className="space-y-6 sm:space-y-10 pb-8 sm:pb-12 w-full max-w-full overflow-x-hidden">
      
      {/* 1. HERO BANNER SECTION (Touch-Swipeable 3s Auto-Advancing Responsive Carousel) */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-2 sm:pt-4">
        {loading ? (
          <div className="w-full aspect-[16/7] sm:aspect-[21/8] rounded-2xl sm:rounded-3xl bg-slate-100 flash-skeleton shadow-md" />
        ) : (
          <div
            className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 bg-slate-950 border border-slate-200/80 group select-none"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Sliding Track */}
            <div
              className="flex transition-transform duration-700 ease-in-out w-full"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {activeBanners.map((banner, idx) => (
                <Link
                  key={banner.id || idx}
                  href={banner.cta_link || '/products/'}
                  className="w-full shrink-0 block relative cursor-pointer"
                  tabIndex={currentSlide === idx ? 0 : -1}
                >
                  <img
                    src={banner.image_url || '/hero-banner.webp'}
                    alt={banner.title || 'MykoTech Pharma - Live long Live Happy!'}
                    className="w-full h-auto object-cover block"
                    loading={idx === 0 ? 'eager' : 'lazy'}
                    fetchPriority={idx === 0 ? 'high' : 'auto'}
                    decoding={idx === 0 ? 'sync' : 'async'}
                    width={1920}
                    height={730}
                  />
                </Link>
              ))}
            </div>

            {/* Previous & Next Arrow Controls (Visible if multiple banners) */}
            {activeBanners.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevSlide}
                  aria-label="Previous Banner"
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/75 text-white backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 sm:opacity-70 hover:opacity-100 transition-all duration-200 z-20 cursor-pointer shadow-md"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <button
                  type="button"
                  onClick={handleNextSlide}
                  aria-label="Next Banner"
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/75 text-white backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 sm:opacity-70 hover:opacity-100 transition-all duration-200 z-20 cursor-pointer shadow-md"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </>
            )}

            {/* Indicator Dots / Bar */}
            {activeBanners.length > 1 && (
              <div className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 z-20">
                {activeBanners.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentSlide(idx);
                    }}
                    aria-label={`Jump to banner ${idx + 1}`}
                    className={`transition-all duration-300 rounded-full cursor-pointer ${
                      currentSlide === idx
                        ? 'w-6 sm:w-8 h-2 sm:h-2.5 bg-blue-600 shadow-md ring-2 ring-white/90'
                        : 'w-2 sm:w-2.5 h-2 sm:h-2.5 bg-white/70 hover:bg-white'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* 2. INSTANT PRESCRIPTION UPLOAD BANNER */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-600 rounded-2xl sm:rounded-3xl p-4 sm:p-7 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider">
              <Pill className="w-3 h-3" />
              Doctor Slip Delivery Service
            </div>
            <h3 className="text-lg sm:text-2xl font-black">Have a Doctor's Prescription?</h3>
            <p className="text-blue-100 text-xs sm:text-sm max-w-xl">
              Upload your doctor's slip in seconds. Our certified pharmacists will verify your medication and arrange urgent home delivery.
            </p>
          </div>
          <Link
            href="/prescription/"
            className="shrink-0 px-5 py-3 sm:px-6 sm:py-3.5 bg-white hover:bg-blue-50 text-blue-900 font-extrabold text-xs sm:text-sm rounded-xl shadow-md flex items-center gap-2 transition-transform active:scale-95"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            Upload Prescription Now
          </Link>
        </div>
      </section>

      {/* 3. THERAPEUTIC CATEGORIES (Responsive Continuous Auto-Slide Carousel: 3 on Mobile, 6 on Desktop) */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-3 sm:space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] sm:text-xs font-black tracking-widest text-blue-600 uppercase">
              Shop by Category
            </span>
            <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-slate-900 mt-0.5">
              Pharmaceutical Categories
            </h2>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Previous & Next Scroll Arrow Buttons */}
            <button
              type="button"
              onClick={() => handleScrollCategories('left')}
              aria-label="Previous categories"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 flex items-center justify-center transition-colors cursor-pointer border border-slate-200/80 active:scale-90"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleScrollCategories('right')}
              aria-label="Next categories"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 flex items-center justify-center transition-colors cursor-pointer border border-slate-200/80 active:scale-90"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <Link
              href="/products/"
              className="ml-1 sm:ml-2 text-blue-600 hover:text-blue-700 font-bold text-xs sm:text-sm flex items-center gap-0.5 shrink-0"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex items-stretch gap-2 sm:gap-3 overflow-hidden py-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="shrink-0 w-[calc((100%-16px)/3)] min-w-[calc((100%-16px)/3)] sm:w-[calc((100%-24px)/4)] sm:min-w-[calc((100%-24px)/4)] md:w-[calc((100%-32px)/5)] md:min-w-[calc((100%-32px)/5)] lg:w-[calc((100%-40px)/6)] lg:min-w-[calc((100%-40px)/6)] bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 flex flex-col items-center gap-2"
              >
                <Skeleton className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl" />
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
            onTouchStart={handleTouchStartCat}
            onTouchEnd={handleTouchEndCat}
            className="flex items-stretch gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-1 select-none cursor-grab active:cursor-grabbing"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {infiniteCategories.map((cat, idx) => (
              <Link
                key={`${cat.id}-${idx}`}
                href={`/products/?category=${cat.slug}`}
                className="shrink-0 w-[calc((100%-16px)/3)] min-w-[calc((100%-16px)/3)] sm:w-[calc((100%-24px)/4)] sm:min-w-[calc((100%-24px)/4)] md:w-[calc((100%-32px)/5)] md:min-w-[calc((100%-32px)/5)] lg:w-[calc((100%-40px)/6)] lg:min-w-[calc((100%-40px)/6)] group bg-white p-2 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-200/90 hover:border-blue-400 hover:shadow-md transition-all flex flex-col items-center text-center justify-between gap-1.5 sm:gap-2.5 relative overflow-hidden"
              >
                <div className="w-10 h-10 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-2xs overflow-hidden p-1.5">
                  {(() => {
                    const icon = cat.icon;
                    if (!icon) return <Pill className="w-5 h-5 sm:w-6 sm:h-6" />;
                    if (icon.startsWith('http') || icon.startsWith('data:') || icon.startsWith('/')) {
                      return <img src={icon} alt={cat.name} className="w-full h-full object-contain" />;
                    }
                    if (/\p{Emoji}/u.test(icon) || (icon.length <= 4 && !/^[A-Za-z]+$/.test(icon))) {
                      return <span className="text-xl sm:text-2xl leading-none select-none">{icon}</span>;
                    }
                    return iconMap[icon] || <Pill className="w-5 h-5 sm:w-6 sm:h-6" />;
                  })()}
                </div>
                <div className="w-full">
                  <h4 className="font-extrabold text-slate-900 text-[11px] sm:text-xs md:text-sm group-hover:text-blue-600 transition-colors truncate">
                    {cat.name}
                  </h4>
                  {cat.sub_categories && cat.sub_categories.length > 0 ? (
                    <span className="text-[9px] sm:text-[10px] text-slate-400 font-semibold mt-0.5 block truncate">
                      {cat.sub_categories.length} Subcategories
                    </span>
                  ) : (
                    <span className="text-[9px] sm:text-[10px] text-slate-400 font-semibold mt-0.5 block truncate">
                      Formulations
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 4. FEATURED PRODUCTS (Selco-style Grid: 4 Desktop / 2 Mobile) */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-[11px] sm:text-xs font-black tracking-widest text-blue-600 uppercase">
              Certified Formulations
            </span>
            <h2 className="text-xl sm:text-3xl font-black text-slate-900 mt-0.5 sm:mt-1">
              Featured Medicines
            </h2>
          </div>
          <Link
            href="/products/"
            className="text-blue-600 hover:text-blue-700 font-bold text-xs sm:text-sm flex items-center gap-1"
          >
            <span>Explore All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {featuredProducts.map((product) => {
              const isAdded = addedIds[product.id];
              return (
                <div
                  key={product.id}
                  className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-100 hover:border-blue-200 shadow-xs hover:shadow-xl transition-all flex flex-col group relative"
                >
                  {/* Rx Badge */}
                  {product.requires_prescription && (
                    <div className="absolute top-4 left-4 z-10 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[9px] sm:text-[10px] font-bold flex items-center gap-1">
                      <AlertCircle className="w-2.5 h-2.5 text-amber-600" />
                      Rx
                    </div>
                  )}

                  {/* Thumbnail Image */}
                  <Link
                    href={`/products/${product.slug}/`}
                    className="w-full h-32 sm:h-44 rounded-xl bg-slate-50/80 flex items-center justify-center p-2.5 overflow-hidden relative"
                  >
                    <img
                      src={product.thumbnail_url || '/logo.png'}
                      alt={product.name}
                      loading="lazy"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>

                  {/* Content */}
                  <div className="pt-2.5 sm:pt-3.5 flex-1 flex flex-col">
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
                    <div className="flex items-center gap-0.5 mt-1 text-amber-400">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star key={idx} className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
                      ))}
                      <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold ml-1">(5.0)</span>
                    </div>

                    {/* Price & Buy Now / Add to Cart */}
                    <div className="mt-auto pt-2.5 sm:pt-3 border-t border-slate-100 space-y-1.5 sm:space-y-2">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <div className="text-sm sm:text-lg font-black text-slate-950">
                            Rs. {Number(product.price).toFixed(2)}
                          </div>
                          {product.original_price && Number(product.original_price) > Number(product.price) && (
                            <div className="text-[10px] sm:text-[11px] text-slate-400 line-through">
                              Rs. {Number(product.original_price).toFixed(2)}
                            </div>
                          )}
                        </div>

                        {/* Quick Add Button */}
                        <button
                          onClick={() => handleAddToCart(product)}
                          className={`p-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs ${
                            isAdded
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-900 hover:bg-blue-600 text-white'
                          }`}
                          title="Add to Cart"
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Added</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Add</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Buy Now Direct Button */}
                      <button
                        onClick={() => handleBuyNow(product)}
                        className="w-full py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                      >
                        <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span>Buy Now</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. WHY CHOOSE MYKOTECH PHARMA */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-10 shadow-xl grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8">
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
