'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getProductBySlug, getProducts } from '@/lib/db';
import { Product } from '@/types';
import { 
  ShoppingBag, 
  Zap, 
  MessageCircle, 
  Star, 
  Check, 
  AlertCircle, 
  ShieldCheck, 
  Clock, 
  ChevronRight,
  Plus,
  Minus
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Skeleton } from '@/components/common/Skeleton';

export function ProductDetailClient({ slug }: { slug: string }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string>('');
  const [added, setAdded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getProductBySlug(slug);
        if (data) {
          setProduct(data);
          setActiveImage(data.thumbnail_url || '/logo.png');

          const all = await getProducts({ onlyActive: true });
          const rel = all.filter((p) => p.id !== data.id && p.category_id === data.category_id).slice(0, 4);
          setRelatedProducts(rel);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();

    const handleUpdate = () => {
      load();
    };
    window.addEventListener('myko_products_updated', handleUpdate);
    return () => window.removeEventListener('myko_products_updated', handleUpdate);
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <Skeleton className="w-1/3 h-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <Skeleton className="w-full h-96 rounded-3xl" />
          <div className="space-y-4">
            <Skeleton className="w-2/3 h-10" />
            <Skeleton className="w-1/3 h-6" />
            <Skeleton className="w-full h-24" />
            <Skeleton className="w-1/2 h-12" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-black text-slate-900">Medicine Not Found</h2>
        <p className="text-slate-500 text-sm">The requested product could not be located in our catalog.</p>
        <Link href="/products/" className="inline-block px-5 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl">
          Return to Catalog
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(product, quantity, true);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity, false);
    router.push('/checkout/');
  };

  const gallery = Array.from(
    new Set([product.thumbnail_url, ...(product.gallery_urls || [])])
  ).filter(Boolean) as string[];

  const whatsappInquiryUrl = `https://wa.me/923184008718?text=${encodeURIComponent(
    `Hello MykoTech Pharma, I want to order/inquire about: ${product.name} (Dosage: ${product.dosage || 'N/A'}, Price: Rs. ${product.price}).`
  )}`;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-10 w-full max-w-full overflow-x-hidden">
      
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-slate-500 overflow-x-auto pb-1">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/products/" className="hover:text-blue-600">Medicines</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-14 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-slate-100 shadow-sm">
        
        {/* Left: Images Gallery */}
        <div className="space-y-3 sm:space-y-4">
          <div className="w-full h-64 sm:h-96 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100 p-4 sm:p-6 flex items-center justify-center relative overflow-hidden">
            {product.requires_prescription && (
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[10px] sm:text-xs font-bold flex items-center gap-1.5 shadow-xs">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Prescription Required
              </div>
            )}
            <img
              src={activeImage}
              alt={product.name}
              className="w-full h-full object-contain transition-transform duration-300 hover:scale-105"
            />
          </div>

          {/* Thumbnails */}
          {gallery.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {gallery.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-20 h-20 rounded-xl bg-slate-50 border p-2 shrink-0 transition-all ${
                    activeImage === img
                      ? 'border-blue-600 ring-2 ring-blue-600/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img src={img} alt="Thumbnail" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info & Purchase Controls */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                {product.dosage || 'Pharmaceutical Formulation'}
              </span>
              <div className="flex items-center gap-1 text-amber-400 text-xs">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
                <span className="text-slate-500 font-bold ml-1">(5.0 &bull; 48 reviews)</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-slate-950 leading-tight">
              {product.name}
            </h1>

            {product.generic_name && (
              <div className="text-xs font-bold text-slate-500">
                Active Generic Formula: <span className="text-slate-800">{product.generic_name}</span>
              </div>
            )}

            {/* Price Box */}
            <div className="flex items-baseline gap-3 pt-2">
              <div className="text-3xl font-black text-slate-950">
                Rs. {Number(product.price).toFixed(2)}
              </div>
              {product.original_price && Number(product.original_price) > Number(product.price) && (
                <div className="text-sm text-slate-400 line-through">
                  Rs. {Number(product.original_price).toFixed(2)}
                </div>
              )}
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                In Stock &bull; Fast Dispatch
              </span>
            </div>

            <p className="text-slate-600 text-sm leading-relaxed">
              {product.short_description || product.description || 'Verified pharmaceutical product prepared under strict standard quality controls.'}
            </p>
          </div>

          {/* Action Row */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 text-sm font-bold text-slate-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="flex-1 py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 text-blue-400" />
                    <span>Add to Cart</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleBuyNow}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all active:scale-98"
              >
                <Zap className="w-4 h-4" />
                <span>Instant Buy Now</span>
              </button>

              <a
                href={whatsappInquiryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all active:scale-98"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Order on WhatsApp</span>
              </a>
            </div>

            <div className="pt-2 grid grid-cols-2 gap-3 text-[11px] text-slate-500 font-semibold">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>100% Genuine Pharmacy</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Home Delivery in Pakistan</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comprehensive Medical Specifications */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-slate-100 shadow-sm space-y-4 sm:space-y-6">
        <h3 className="text-lg sm:text-xl font-black text-slate-900 border-b border-slate-100 pb-3 sm:pb-4">
          Medicine Information & Clinical Specifications
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 text-sm">
          {product.composition && (
            <div className="space-y-1 sm:space-y-1.5">
              <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider text-blue-600">
                Composition / Ingredients
              </h4>
              <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100 text-xs sm:text-sm whitespace-pre-line">
                {product.composition}
              </p>
            </div>
          )}

          {product.dosage_instructions && (
            <div className="space-y-1 sm:space-y-1.5">
              <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider text-blue-600">
                Dosage & Administration
              </h4>
              <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100 text-xs sm:text-sm whitespace-pre-line">
                {product.dosage_instructions}
              </p>
            </div>
          )}

          {product.description && (
            <div className="space-y-1 sm:space-y-1.5 md:col-span-2">
              <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider text-blue-600">
                Therapeutic Indications & Description
              </h4>
              <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100 text-xs sm:text-sm whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {product.side_effects && (
            <div className="space-y-1 sm:space-y-1.5 md:col-span-2">
              <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider text-amber-600">
                Precautions & Potential Side Effects
              </h4>
              <p className="text-slate-600 leading-relaxed bg-amber-50/50 p-3 sm:p-4 rounded-xl border border-amber-200/50 text-xs sm:text-sm whitespace-pre-line">
                {product.side_effects}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="space-y-4 sm:space-y-6">
          <h3 className="text-lg sm:text-xl font-black text-slate-900">
            Similar Formulations in this Category
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {relatedProducts.map((rel) => (
              <Link
                key={rel.id}
                href={`/products/${rel.slug}/`}
                className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-100 hover:border-blue-200 shadow-xs hover:shadow-md transition-all flex flex-col group"
              >
                <div className="w-full h-28 sm:h-36 rounded-lg sm:rounded-xl bg-slate-50 p-2 flex items-center justify-center">
                  <img src={rel.thumbnail_url || '/logo.png'} alt={rel.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
                </div>
                <div className="pt-2 sm:pt-3">
                  <span className="text-[10px] sm:text-[11px] font-bold text-blue-600 block">{rel.dosage}</span>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1 mt-0.5">{rel.name}</h4>
                  <div className="font-black text-slate-900 text-xs sm:text-sm mt-1 sm:mt-2">Rs. {Number(rel.price).toFixed(2)}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
