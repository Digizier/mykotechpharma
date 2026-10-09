import React from 'react';
import { ProductDetailClient } from '@/components/products/ProductDetailClient';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ghzaanuyxgojwvcrddas.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoemFhbnV5eGdvand2Y3JkZGFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0NjYxMTAsImV4cCI6MjEwNzA0MjExMH0.4wE4HVOkTamEuX3XFhG-RcZniAGUWkBTGU2zhPTLPKQ';

const fallbackSlugs = [
  'mykoclav-625mg-tablets',
  'ceftrimyk-1g-injection',
  'panadyne-forte-tablets',
  'mykofenac-sr-100mg',
  'cardimyko-plus-tablets',
  'lipimyko-20mg-statins',
  'esomyko-40mg-capsule',
  'spasmo-myko-drops-30ml',
  'vitamyko-c-1000mg-effervescent',
  'osteomyko-d3-bone-formula',
];

export async function generateStaticParams() {
  try {
    const sb = createClient(supabaseUrl, supabaseAnonKey);
    const { data } = await sb.from('products').select('slug').eq('is_active', true);
    if (data && data.length > 0) {
      return data.map((item) => ({ slug: item.slug }));
    }
  } catch (err) {
    console.warn('generateStaticParams fallback used');
  }
  return fallbackSlugs.map((slug) => ({ slug }));
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ProductDetailClient slug={slug} />;
}
