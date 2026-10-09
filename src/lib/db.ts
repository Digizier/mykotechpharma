'use client';

import { supabase } from './supabase';
import { Product, Category, SubCategory, HeroBanner, Order, StoreSettings, Coupon, Prescription } from '@/types';
import { deleteImageFromStorage } from './imageCompression';

// Default Fallback Store Settings
export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  store_name: 'MykoTech Pharma',
  tagline: 'Live long Live Happy! Licensed Pharmaceutical Healthcare & Certified Medicines',
  helpline_phone: '0314-5200832',
  whatsapp_number: '0318-4008718',
  support_email: 'Mykotechpharma@gmail.com',
  warehouse_address: 'Sector G-10/4, Medical Commercial Plaza, Islamabad, Pakistan',
  ntn_number: 'NTN-7392019-4',
  license_number: 'DRAP/PHR-2024-8842',
  base_shipping_fee: 250,
  free_shipping_threshold: 2500,
  shipping_policy_text: 'Free temperature-controlled courier delivery across Pakistan on orders above Rs. 2,500.',
  enable_cod: true,
  jazzcash_title: 'Irfan Shahid Khan (MykoTech Pharma)',
  jazzcash_number: '0318-4008718',
  easypaisa_title: 'Irfan Shahid Khan (MykoTech Pharma)',
  easypaisa_number: '0314-5200832',
  bank_name: 'Meezan Bank Limited',
  bank_account_title: 'Mykotech Pharmaceuticals Pvt Ltd',
  bank_iban: 'PK45MEZN0001234567890123',
};

// Default Fallback Categories for instantaneous (0ms) First Contentful Paint
export const DEFAULT_FALLBACK_CATEGORIES: Category[] = [
  {
    id: '90717ee6-722e-4c5a-bb04-c8513fc50974',
    name: 'Tablets',
    slug: 'tablets',
    description: 'Oral solid formulations, daily vitamins, pain relievers and therapeutic tablets',
    icon: 'Pill',
    display_order: 1,
  },
  {
    id: 'b5dca6cd-1835-4fe6-996b-da4f6b5e4e7f',
    name: 'Syrups',
    slug: 'syrups',
    description: 'Liquid oral suspensions, cough tonics, pediatric formulas and syrups',
    icon: 'Droplet',
    display_order: 2,
  },
  {
    id: '9a9e16dd-f1d1-482e-8b8f-72ee5dd1ae28',
    name: 'Drops',
    slug: 'drops',
    description: 'Pediatric drops, vitamin D3 infant solutions and ophthalmic preparations',
    icon: 'Droplet',
    display_order: 3,
  },
  {
    id: 'c8228cac-6209-4260-9089-6221c9f800b4',
    name: 'Food Supplements',
    slug: 'food-supplements',
    description: 'Nutritional wellness, multivitamin sachets, calcium and immunity enhancers',
    icon: 'Sparkles',
    display_order: 4,
  },
  {
    id: 'f7145972-913a-4203-b731-182ebc34a46d',
    name: 'Topical & Derma',
    slug: 'topical-derma',
    description: 'Dermatological creams, antiseptics, medicated washes and external treatments',
    icon: 'Shield',
    display_order: 5,
  },
];

export const DEFAULT_FALLBACK_BANNERS: HeroBanner[] = [
  {
    id: 'default-hero',
    title: 'MykoTech Pharma - Live long Live Happy!',
    subtitle: 'Quality Medicines & Clinical Healthcare Delivered Across Pakistan',
    cta_text: 'Explore Catalog',
    cta_link: '/products/',
    image_url: '/hero-banner.webp',
    display_order: 1,
    is_active: true,
  },
];

// Storage keys (only for client-specific non-volatile session data like store settings)
export const KEYS = {
  SETTINGS: 'myko_store_settings',
  CATEGORIES: 'myko_cache_categories',
  PRODUCTS: 'myko_cache_products',
  FEATURED: 'myko_cache_featured',
  BANNERS: 'myko_cache_banners',
  ORDERS: 'myko_cache_orders',
  COUPONS: 'myko_cache_coupons',
};

// Immediate client cleanup of stale legacy cached records
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem(KEYS.BANNERS);
    localStorage.removeItem(KEYS.CATEGORIES);
    localStorage.removeItem(KEYS.PRODUCTS);
    localStorage.removeItem(KEYS.FEATURED);
  } catch {}
}

// In-Memory High-Speed Cache & In-Flight Request Deduplication
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const MEMORY_CACHE: {
  categories?: CacheEntry<Category[]>;
  banners?: CacheEntry<HeroBanner[]>;
  featured?: CacheEntry<Product[]>;
  products?: CacheEntry<Product[]>;
} = {};

const PENDING_PROMISES: {
  categories?: Promise<Category[]>;
  banners?: Promise<HeroBanner[]>;
  featured?: Promise<Product[]>;
  products?: Promise<Product[]>;
} = {};

const TTL_MS = 2 * 60 * 1000; // 2 minutes lean in-memory session cache

export function clearClientMemoryCache() {
  delete MEMORY_CACHE.categories;
  delete MEMORY_CACHE.banners;
  delete MEMORY_CACHE.featured;
  delete MEMORY_CACHE.products;
}

/**
 * Synchronous Fast Getters (Memory-only, zero stale localStorage data)
 */
export function getCachedCategories(): Category[] {
  if (MEMORY_CACHE.categories?.data && MEMORY_CACHE.categories.data.length > 0) {
    return MEMORY_CACHE.categories.data;
  }
  return DEFAULT_FALLBACK_CATEGORIES;
}

export function getCachedHeroBanners(): HeroBanner[] {
  if (MEMORY_CACHE.banners?.data && MEMORY_CACHE.banners.data.length > 0) {
    return MEMORY_CACHE.banners.data;
  }
  return [];
}

export function getCachedFeaturedProducts(): Product[] {
  if (MEMORY_CACHE.featured?.data && MEMORY_CACHE.featured.data.length > 0) {
    return MEMORY_CACHE.featured.data;
  }
  return [];
}

/**
 * Dispatches cross-component and cross-tab update events
 */
function emitUpdate(eventName: string) {
  clearClientMemoryCache();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(eventName));
  }
}

// -------------------------------------------------------------
// 1. STORE SETTINGS
// -------------------------------------------------------------
export function getStoreSettings(): StoreSettings {
  if (typeof window === 'undefined') return DEFAULT_STORE_SETTINGS;
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    return raw ? { ...DEFAULT_STORE_SETTINGS, ...JSON.parse(raw) } : DEFAULT_STORE_SETTINGS;
  } catch (e) {
    return DEFAULT_STORE_SETTINGS;
  }
}

export function saveStoreSettings(settings: StoreSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  emitUpdate('myko_settings_updated');
}

// -------------------------------------------------------------
// 2. CATEGORIES & SUB-CATEGORIES
// -------------------------------------------------------------
export async function getCategories(forceRefresh = false): Promise<Category[]> {
  const now = Date.now();
  if (!forceRefresh && MEMORY_CACHE.categories && (now - MEMORY_CACHE.categories.timestamp < TTL_MS)) {
    return MEMORY_CACHE.categories.data;
  }

  // Deduplicate inflight promise across concurrent callers (e.g. Navbar & HomePage)
  if (PENDING_PROMISES.categories) {
    return PENDING_PROMISES.categories;
  }

  const promise = (async () => {
    try {
      // Fetch categories & subcategories in parallel
      const [catsRes, subCatsRes] = await Promise.all([
        supabase
          .from('categories')
          .select('id, name, slug, description, icon, display_order')
          .order('display_order', { ascending: true }),
        supabase
          .from('sub_categories')
          .select('id, category_id, name, slug, description, display_order')
          .order('display_order', { ascending: true })
      ]);

      if (!catsRes.error && catsRes.data && catsRes.data.length > 0) {
        const combined: Category[] = catsRes.data.map((cat) => ({
          ...cat,
          sub_categories: (subCatsRes.data || []).filter((sc) => sc.category_id === cat.id),
        }));

        MEMORY_CACHE.categories = { data: combined, timestamp: Date.now() };
        return combined;
      }
    } catch (err) {
      console.warn('Network issue fetching categories');
    } finally {
      delete PENDING_PROMISES.categories;
    }

    return getCachedCategories();
  })();

  PENDING_PROMISES.categories = promise;
  return promise;
}

export async function addCategory(categoryData: {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  display_order?: number;
}): Promise<Category | null> {
  const { data, error } = await supabase
    .from('categories')
    .insert([categoryData])
    .select()
    .single();

  if (error) {
    console.error('Failed to insert category:', error);
    throw new Error(error.message);
  }

  emitUpdate('myko_categories_updated');
  return data;
}

export async function updateCategory(
  categoryId: string,
  updateData: {
    name?: string;
    slug?: string;
    description?: string;
    icon?: string;
    display_order?: number;
  }
): Promise<Category | null> {
  const { data, error } = await supabase
    .from('categories')
    .update(updateData)
    .eq('id', categoryId)
    .select()
    .single();

  if (error) {
    console.error('Failed to update category:', error);
    throw new Error(error.message);
  }

  emitUpdate('myko_categories_updated');
  return data;
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId);

  if (error) {
    console.error('Failed to delete category:', error);
    throw new Error(error.message);
  }

  emitUpdate('myko_categories_updated');
}

export async function addSubCategory(subData: {
  category_id: string;
  name: string;
  slug: string;
  description?: string;
}): Promise<SubCategory | null> {
  const { data, error } = await supabase
    .from('sub_categories')
    .insert([subData])
    .select()
    .single();

  if (error) {
    console.error('Failed to insert sub-category:', error);
    throw new Error(error.message);
  }

  emitUpdate('myko_categories_updated');
  return data;
}

export async function deleteSubCategory(subId: string): Promise<void> {
  const { error } = await supabase
    .from('sub_categories')
    .delete()
    .eq('id', subId);

  if (error) {
    console.error('Failed to delete sub-category:', error);
    throw new Error(error.message);
  }

  emitUpdate('myko_categories_updated');
}

// -------------------------------------------------------------
// 3. PRODUCTS (Lean Projections & High-Speed In-Memory Cache)
// -------------------------------------------------------------
export async function getFeaturedProducts(limit = 8, forceRefresh = false): Promise<Product[]> {
  const now = Date.now();
  if (!forceRefresh && MEMORY_CACHE.featured && (now - MEMORY_CACHE.featured.timestamp < TTL_MS)) {
    return MEMORY_CACHE.featured.data.slice(0, limit);
  }

  if (PENDING_PROMISES.featured) {
    return PENDING_PROMISES.featured;
  }

  const promise = (async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(
          'id, name, slug, generic_name, dosage, price, original_price, stock, thumbnail_url, gallery_urls, requires_prescription, is_featured, created_at'
        )
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        MEMORY_CACHE.featured = { data: data as Product[], timestamp: Date.now() };
        return data as Product[];
      }
    } catch (err) {
      console.warn('Network issue fetching featured products');
    } finally {
      delete PENDING_PROMISES.featured;
    }

    return getCachedFeaturedProducts().slice(0, limit);
  })();

  PENDING_PROMISES.featured = promise;
  return promise;
}

export async function getProducts(options?: {
  categorySlug?: string;
  subCategorySlug?: string;
  onlyActive?: boolean;
}): Promise<Product[]> {
  const isDefaultQuery = !options?.categorySlug && !options?.subCategorySlug && options?.onlyActive !== false;
  const now = Date.now();
  if (isDefaultQuery && MEMORY_CACHE.products && (now - MEMORY_CACHE.products.timestamp < TTL_MS)) {
    return MEMORY_CACHE.products.data;
  }

  try {
    let query = supabase
      .from('products')
      .select(
        'id, name, slug, generic_name, dosage, category_id, sub_category_id, price, original_price, stock, thumbnail_url, gallery_urls, short_description, description, composition, dosage_instructions, side_effects, requires_prescription, is_active, is_featured, created_at'
      )
      .order('created_at', { ascending: false });

    if (options?.onlyActive !== false) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (!error && data) {
      if (isDefaultQuery) {
        MEMORY_CACHE.products = { data, timestamp: Date.now() };
      }
      return data;
    }
  } catch (err) {
    console.warn('Network issue fetching products');
  }

  if (MEMORY_CACHE.products?.data) {
    return MEMORY_CACHE.products.data;
  }
  return [];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!error && data) return data;
  return null;
}

export async function saveProduct(productData: Partial<Product>): Promise<Product | null> {
  // Strip relations that don't belong to the products table columns
  const { category, sub_category, ...cleanData } = productData as any;

  // If editing existing product
  if (cleanData.id) {
    const { data, error } = await supabase
      .from('products')
      .update(cleanData)
      .eq('id', cleanData.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    emitUpdate('myko_products_updated');
    return data;
  }

  // If inserting new product
  const { data, error } = await supabase
    .from('products')
    .insert([cleanData])
    .select()
    .single();

  if (error) throw new Error(error.message);
  emitUpdate('myko_products_updated');
  return data;
}

export async function deleteProduct(productId: string): Promise<void> {
  // Clean up associated images from cloud storage
  try {
    const { data: prod } = await supabase
      .from('products')
      .select('thumbnail_url, gallery_urls')
      .eq('id', productId)
      .single();

    if (prod) {
      if (prod.thumbnail_url) {
        await deleteImageFromStorage(prod.thumbnail_url);
      }
      if (Array.isArray(prod.gallery_urls)) {
        for (const url of prod.gallery_urls) {
          if (url && url !== prod.thumbnail_url) {
            await deleteImageFromStorage(url);
          }
        }
      }
    }
  } catch (err) {
    console.warn('Non-critical storage image deletion error:', err);
  }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);

  if (error) throw new Error(error.message);
  emitUpdate('myko_products_updated');
}

// -------------------------------------------------------------
// 4. HERO BANNERS
// -------------------------------------------------------------
export async function getHeroBanners(forceRefresh = false): Promise<HeroBanner[]> {
  const now = Date.now();
  if (!forceRefresh && MEMORY_CACHE.banners && (now - MEMORY_CACHE.banners.timestamp < TTL_MS)) {
    return MEMORY_CACHE.banners.data;
  }

  if (PENDING_PROMISES.banners) {
    return PENDING_PROMISES.banners;
  }

  const promise = (async () => {
    try {
      const { data, error } = await supabase
        .from('hero_banners')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        MEMORY_CACHE.banners = { data, timestamp: Date.now() };
        return data;
      }
    } catch (e) {
    } finally {
      delete PENDING_PROMISES.banners;
    }

    return getCachedHeroBanners();
  })();

  PENDING_PROMISES.banners = promise;
  return promise;
}

export async function saveHeroBanner(bannerData: Partial<HeroBanner>): Promise<void> {
  const { id, created_at, ...cleanPayload } = bannerData as any;
  const payload = {
    title: cleanPayload.title || 'Promotional Banner',
    subtitle: cleanPayload.subtitle || '',
    cta_text: cleanPayload.cta_text || 'Order Now',
    cta_link: cleanPayload.cta_link || '/products/',
    image_url: cleanPayload.image_url,
    badge: cleanPayload.badge || '',
    display_order: Number(cleanPayload.display_order) || 1,
    is_active: cleanPayload.is_active ?? true,
  };

  if (id) {
    const { error } = await supabase
      .from('hero_banners')
      .update(payload)
      .eq('id', id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from('hero_banners')
      .insert([payload]);
    if (error) throw new Error(error.message);
  }
  emitUpdate('myko_banners_updated');
}

export async function deleteHeroBanner(id: string): Promise<void> {
  const { error } = await supabase.from('hero_banners').delete().eq('id', id);
  if (error) throw new Error(error.message);
  emitUpdate('myko_banners_updated');
}

// -------------------------------------------------------------
// 5. ORDERS
// -------------------------------------------------------------
export async function getOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });

  if (!error && data) return data;
  return [];
}

export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);

  if (error) throw new Error(error.message);
  emitUpdate('myko_orders_updated');
}

export async function deleteOrder(orderId: string): Promise<void> {
  // First delete associated order_items to maintain referential integrity
  await supabase.from('order_items').delete().eq('order_id', orderId);
  const { error } = await supabase.from('orders').delete().eq('id', orderId);

  if (error) {
    console.error('Failed to delete order:', error);
    throw new Error(error.message);
  }
  emitUpdate('myko_orders_updated');
}

// -------------------------------------------------------------
// 6. PRESCRIPTIONS
// -------------------------------------------------------------
export async function getPrescriptions(): Promise<Prescription[]> {
  const { data, error } = await supabase
    .from('prescriptions')
    .select('*')
    .order('created_at', { ascending: false });

  if (!error && data) return data;
  return [];
}

export async function deletePrescription(rxId: string): Promise<void> {
  const { error } = await supabase
    .from('prescriptions')
    .delete()
    .eq('id', rxId);

  if (error) {
    console.error('Failed to delete prescription:', error);
    throw new Error(error.message);
  }
}

