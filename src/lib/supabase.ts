import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ghzaanuyxgojwvcrddas.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoemFhbnV5eGdvand2Y3JkZGFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0NjYxMTAsImV4cCI6MjEwNzA0MjExMH0.4wE4HVOkTamEuX3XFhG-RcZniAGUWkBTGU2zhPTLPKQ';

// Browser-persistent singleton client instance (Zero-load Cloudflare Edge compliant)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
