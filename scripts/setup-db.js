const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const k = trimmed.substring(0, idx).trim();
        const v = trimmed.substring(idx + 1).trim();
        if (!process.env[k]) process.env[k] = v;
      }
    }
  });
}

const client = new Client({
  connectionString: process.env.DATABASE_URL || process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

async function setupDatabase() {
  console.log('Connecting to PostgreSQL database...');
  await client.connect();

  console.log('Creating database schema...');

  const schemaSql = `
    -- Enable UUID extension
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- 1. CATEGORIES TABLE
    CREATE TABLE IF NOT EXISTS public.categories (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      icon TEXT DEFAULT 'Pill',
      display_order INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    -- 2. SUB-CATEGORIES TABLE
    CREATE TABLE IF NOT EXISTS public.sub_categories (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      description TEXT,
      display_order INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(category_id, slug)
    );

    -- 3. PRODUCTS TABLE
    CREATE TABLE IF NOT EXISTS public.products (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      generic_name TEXT,
      dosage TEXT,
      category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
      sub_category_id UUID REFERENCES public.sub_categories(id) ON DELETE SET NULL,
      price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
      original_price NUMERIC(10, 2),
      stock INT NOT NULL DEFAULT 50,
      thumbnail_url TEXT,
      gallery_urls JSONB DEFAULT '[]'::jsonb,
      short_description TEXT,
      description TEXT,
      composition TEXT,
      dosage_instructions TEXT,
      side_effects TEXT,
      requires_prescription BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,
      is_featured BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    -- Indexes for zero-load high-speed queries
    CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_sub_category ON public.products(sub_category_id);
    CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
    CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);

    -- 4. HERO BANNERS TABLE
    CREATE TABLE IF NOT EXISTS public.hero_banners (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      title TEXT NOT NULL,
      subtitle TEXT,
      cta_text TEXT DEFAULT 'Order Now',
      cta_link TEXT DEFAULT '/products',
      image_url TEXT NOT NULL,
      badge TEXT DEFAULT 'Verified Quality',
      display_order INT DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    -- 5. ORDERS TABLE
    CREATE TABLE IF NOT EXISTS public.orders (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      order_number TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT,
      delivery_address TEXT NOT NULL,
      city TEXT NOT NULL,
      total_amount NUMERIC(10, 2) NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      payment_method TEXT NOT NULL DEFAULT 'cod',
      prescription_url TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);

    -- 6. ORDER ITEMS TABLE
    CREATE TABLE IF NOT EXISTS public.order_items (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
      product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
      product_name TEXT NOT NULL,
      unit_price NUMERIC(10, 2) NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      total_price NUMERIC(10, 2) NOT NULL,
      thumbnail_url TEXT
    );

    -- 7. PRESCRIPTIONS TABLE
    CREATE TABLE IF NOT EXISTS public.prescriptions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      patient_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      notes TEXT,
      image_url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT now()
    );

    -- Enable Row Level Security (RLS)
    ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.sub_categories ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.hero_banners ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if any to recreate cleanly
    DROP POLICY IF EXISTS "Public select categories" ON public.categories;
    DROP POLICY IF EXISTS "Admin manage categories" ON public.categories;
    CREATE POLICY "Public select categories" ON public.categories FOR SELECT USING (true);
    CREATE POLICY "Admin manage categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public select sub_categories" ON public.sub_categories;
    DROP POLICY IF EXISTS "Admin manage sub_categories" ON public.sub_categories;
    CREATE POLICY "Public select sub_categories" ON public.sub_categories FOR SELECT USING (true);
    CREATE POLICY "Admin manage sub_categories" ON public.sub_categories FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public select products" ON public.products;
    DROP POLICY IF EXISTS "Admin manage products" ON public.products;
    CREATE POLICY "Public select products" ON public.products FOR SELECT USING (true);
    CREATE POLICY "Admin manage products" ON public.products FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public select hero_banners" ON public.hero_banners;
    DROP POLICY IF EXISTS "Admin manage hero_banners" ON public.hero_banners;
    CREATE POLICY "Public select hero_banners" ON public.hero_banners FOR SELECT USING (true);
    CREATE POLICY "Admin manage hero_banners" ON public.hero_banners FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
    DROP POLICY IF EXISTS "Admin manage orders" ON public.orders;
    CREATE POLICY "Public insert orders" ON public.orders FOR INSERT WITH CHECK (true);
    CREATE POLICY "Admin manage orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public insert order_items" ON public.order_items;
    DROP POLICY IF EXISTS "Admin manage order_items" ON public.order_items;
    CREATE POLICY "Public insert order_items" ON public.order_items FOR INSERT WITH CHECK (true);
    CREATE POLICY "Admin manage order_items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public insert prescriptions" ON public.prescriptions;
    DROP POLICY IF EXISTS "Admin manage prescriptions" ON public.prescriptions;
    CREATE POLICY "Public insert prescriptions" ON public.prescriptions FOR INSERT WITH CHECK (true);
    CREATE POLICY "Admin manage prescriptions" ON public.prescriptions FOR ALL USING (true) WITH CHECK (true);

    -- Setup Storage bucket 'mykotech-media'
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'mykotech-media',
      'mykotech-media',
      true,
      5242880, -- 5MB limit
      ARRAY['image/webp', 'image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
    )
    ON CONFLICT (id) DO UPDATE SET public = true;

    -- Storage policies
    DROP POLICY IF EXISTS "Public access to mykotech-media" ON storage.objects;
    DROP POLICY IF EXISTS "Public upload to mykotech-media" ON storage.objects;
    DROP POLICY IF EXISTS "Public update mykotech-media" ON storage.objects;
    DROP POLICY IF EXISTS "Public delete mykotech-media" ON storage.objects;

    CREATE POLICY "Public access to mykotech-media" ON storage.objects
      FOR SELECT USING (bucket_id = 'mykotech-media');

    CREATE POLICY "Public upload to mykotech-media" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'mykotech-media');

    CREATE POLICY "Public update mykotech-media" ON storage.objects
      FOR UPDATE USING (bucket_id = 'mykotech-media');

    CREATE POLICY "Public delete mykotech-media" ON storage.objects
      FOR DELETE USING (bucket_id = 'mykotech-media');
  `;

  await client.query(schemaSql);
  console.log('Database schema & storage created successfully!');

  // Seed default categories & sub-categories
  const checkCat = await client.query('SELECT count(*) FROM public.categories;');
  if (parseInt(checkCat.rows[0].count) === 0) {
    console.log('Seeding initial categories & sub-categories...');
    
    // Category 1: Antibiotics & Anti-Infectives
    const cat1 = await client.query(`
      INSERT INTO public.categories (name, slug, description, icon, display_order)
      VALUES ('Antibiotics & Anti-Infectives', 'antibiotics-anti-infectives', 'Broad-spectrum antibiotics, antifungals and antivirals', 'ShieldCheck', 1)
      RETURNING id;
    `);
    await client.query(`
      INSERT INTO public.sub_categories (category_id, name, slug, description, display_order)
      VALUES 
      ('${cat1.rows[0].id}', 'Oral Tablets & Capsules', 'oral-tablets-capsules', 'Daily oral antibiotics', 1),
      ('${cat1.rows[0].id}', 'Injectables & IV', 'injectables-iv', 'Hospital-grade injectable antibiotics', 2),
      ('${cat1.rows[0].id}', 'Dry Suspensions & Syrups', 'dry-suspensions-syrups', 'Pediatric antibiotics', 3);
    `);

    // Category 2: Pain Relief & Anti-Inflammatory
    const cat2 = await client.query(`
      INSERT INTO public.categories (name, slug, description, icon, display_order)
      VALUES ('Pain Relief & NSAIDs', 'pain-relief-nsaids', 'Analgesics, antipyretics and anti-inflammatory medicines', 'Activity', 2)
      RETURNING id;
    `);
    await client.query(`
      INSERT INTO public.sub_categories (category_id, name, slug, description, display_order)
      VALUES 
      ('${cat2.rows[0].id}', 'Paracetamol & Combinations', 'paracetamol-combinations', 'Fever & mild pain relief', 1),
      ('${cat2.rows[0].id}', 'NSAIDs & Muscle Relaxants', 'nsaids-muscle-relaxants', 'Joint & muscular pain therapies', 2);
    `);

    // Category 3: Cardiology & Hypertension
    const cat3 = await client.query(`
      INSERT INTO public.categories (name, slug, description, icon, display_order)
      VALUES ('Cardiology & Blood Pressure', 'cardiology-blood-pressure', 'Heart care, antihypertensives, and lipid-lowering drugs', 'HeartPulse', 3)
      RETURNING id;
    `);
    await client.query(`
      INSERT INTO public.sub_categories (category_id, name, slug, description, display_order)
      VALUES 
      ('${cat3.rows[0].id}', 'Antihypertensives (BP)', 'antihypertensives', 'Blood pressure regulation', 1),
      ('${cat3.rows[0].id}', 'Statins & Cholesterol', 'statins-cholesterol', 'Lipid lowering agents', 2);
    `);

    // Category 4: Gastrointestinal & Stomach
    const cat4 = await client.query(`
      INSERT INTO public.categories (name, slug, description, icon, display_order)
      VALUES ('Gastrointestinal & Digestive', 'gastrointestinal-digestive', 'Antacids, proton pump inhibitors, and anti-ulcerants', 'Pill', 4)
      RETURNING id;
    `);
    await client.query(`
      INSERT INTO public.sub_categories (category_id, name, slug, description, display_order)
      VALUES 
      ('${cat4.rows[0].id}', 'PPIs & Acid Reducers', 'ppis-acid-reducers', 'Omeprazole, Esomeprazole & Pantoprazole', 1),
      ('${cat4.rows[0].id}', 'Digestive Enzymes & Antispasmodics', 'digestive-enzymes-antispasmodics', 'Gut motility and relief', 2);
    `);

    // Category 5: Vitamins & Nutritional Supplements
    const cat5 = await client.query(`
      INSERT INTO public.categories (name, slug, description, icon, display_order)
      VALUES ('Vitamins & Nutraceuticals', 'vitamins-nutraceuticals', 'Multivitamins, minerals, and immunity boosters', 'Sparkles', 5)
      RETURNING id;
    `);
    await client.query(`
      INSERT INTO public.sub_categories (category_id, name, slug, description, display_order)
      VALUES 
      ('${cat5.rows[0].id}', 'Immunity & Vitamin C/D/Zinc', 'immunity-vitamins', 'Daily defense and wellness', 1),
      ('${cat5.rows[0].id}', 'Calcium & Bone Health', 'calcium-bone-health', 'Joint and bone mineral support', 2);
    `);

    console.log('Seeded 5 categories with sub-categories!');
  }

  // Seed default hero banner if empty
  const checkHero = await client.query('SELECT count(*) FROM public.hero_banners;');
  if (parseInt(checkHero.rows[0].count) === 0) {
    console.log('Seeding initial hero banner...');
    await client.query(`
      INSERT INTO public.hero_banners (title, subtitle, cta_text, cta_link, image_url, badge, display_order, is_active)
      VALUES (
        'Advanced Pharmaceutical Healthcare & Authentic Medicines',
        'Certified high-potency formulations, prescription medicines, and clinical wellness products directly delivered with supreme standards.',
        'Explore Medicines',
        '/products',
        'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1200&q=80',
        'WHO-GMP Certified Quality',
        1,
        true
      );
    `);
    console.log('Seeded hero banner!');
  }

  await client.end();
  console.log('Database setup completed 100%!');
}

setupDatabase().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
