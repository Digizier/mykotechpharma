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

// Storage keys for Dual-Tier Persistence
const KEYS = {
  SETTINGS: 'myko_store_settings',
  CATEGORIES: 'myko_cache_categories',
  PRODUCTS: 'myko_cache_products',
  BANNERS: 'myko_cache_banners',
  ORDERS: 'myko_cache_orders',
  COUPONS: 'myko_cache_coupons',
};

/**
 * Dispatches cross-component and cross-tab update events
 */
function emitUpdate(eventName: string) {
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
export async function getCategories(): Promise<Category[]> {
  try {
    // 1. Fetch from Remote Cloud DB
    const { data: cats, error: cErr } = await supabase
      .from('categories')
      .select('id, name, slug, description, icon, display_order')
      .order('display_order', { ascending: true });

    const { data: subCats, error: sErr } = await supabase
      .from('sub_categories')
      .select('id, category_id, name, slug, description, display_order')
      .order('display_order', { ascending: true });

    if (!cErr && cats) {
      // Map subcategories inside categories
      const combined: Category[] = cats.map((cat) => ({
        ...cat,
        sub_categories: (subCats || []).filter((sc) => sc.category_id === cat.id),
      }));

      // Cache locally
      if (typeof window !== 'undefined') {
        localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(combined));
      }
      return combined;
    }
  } catch (err) {
    console.warn('Using local categories cache due to network/DB status');
  }

  // 2. Fallback to LocalStorage
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(KEYS.CATEGORIES);
    if (local) return JSON.parse(local);
  }
  return [];
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
// 3. PRODUCTS (Lean Projections & Zero Base64)
// -------------------------------------------------------------
export async function getProducts(options?: {
  categorySlug?: string;
  subCategorySlug?: string;
  onlyActive?: boolean;
}): Promise<Product[]> {
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
      if (typeof window !== 'undefined') {
        localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(data));
      }
      return data;
    }
  } catch (err) {
    console.warn('Falling back to local products cache');
  }

  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(KEYS.PRODUCTS);
    if (local) return JSON.parse(local);
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
export async function getHeroBanners(): Promise<HeroBanner[]> {
  try {
    const { data, error } = await supabase
      .from('hero_banners')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (!error && data) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(KEYS.BANNERS, JSON.stringify(data));
      }
      return data;
    }
  } catch (e) {}

  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(KEYS.BANNERS);
    if (local) return JSON.parse(local);
  }
  return [];
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

