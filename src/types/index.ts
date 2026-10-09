export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  display_order: number;
  created_at?: string;
  sub_categories?: SubCategory[];
}

export interface SubCategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description?: string;
  display_order: number;
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  generic_name?: string;
  dosage?: string;
  category_id?: string;
  sub_category_id?: string;
  price: number;
  original_price?: number;
  stock: number;
  thumbnail_url?: string;
  gallery_urls?: string[];
  short_description?: string;
  description?: string;
  composition?: string;
  dosage_instructions?: string;
  side_effects?: string;
  requires_prescription: boolean;
  is_active: boolean;
  is_featured: boolean;
  created_at?: string;
  category?: { name: string; slug: string };
  sub_category?: { name: string; slug: string };
}

export interface HeroBanner {
  id: string;
  title: string;
  subtitle?: string;
  cta_text?: string;
  cta_link?: string;
  image_url: string;
  badge?: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_id?: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  thumbnail_url?: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  delivery_address: string;
  city: string;
  total_amount: number;
  shipping_fee?: number;
  discount_amount?: number;
  coupon_code?: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_method: string;
  payment_status?: 'unpaid' | 'paid' | 'verified';
  tracking_number?: string;
  prescription_url?: string;
  notes?: string;
  created_at: string;
  order_items?: OrderItem[];
}

export interface Prescription {
  id: string;
  patient_name: string;
  phone: string;
  notes?: string;
  image_url: string;
  status: 'pending' | 'reviewed' | 'order_created' | 'rejected';
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'fixed' | 'percentage';
  discount_value: number;
  min_spend: number;
  is_active: boolean;
  free_shipping: boolean;
  created_at?: string;
}

export interface StoreSettings {
  store_name: string;
  tagline: string;
  helpline_phone: string;
  whatsapp_number: string;
  support_email: string;
  warehouse_address: string;
  ntn_number: string;
  license_number: string;
  base_shipping_fee: number;
  free_shipping_threshold: number;
  shipping_policy_text: string;
  enable_cod: boolean;
  jazzcash_title: string;
  jazzcash_number: string;
  easypaisa_title: string;
  easypaisa_number: string;
  bank_name: string;
  bank_account_title: string;
  bank_iban: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
