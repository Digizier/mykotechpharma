const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');

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

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ghzaanuyxgojwvcrddas.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const pg = new Client({
  connectionString: process.env.DATABASE_URL || process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

async function updateBrandingInDb() {
  await pg.connect();

  // 1. Upload Hero banner to Supabase Storage
  const bannerBuffer = fs.readFileSync(path.join(__dirname, '..', 'public', 'hero-banner.webp'));
  await sb.storage.from('mykotech-media').upload('banners/mykotech-hero-official.webp', bannerBuffer, {
    contentType: 'image/webp',
    upsert: true
  });
  const { data: bUrl } = sb.storage.from('mykotech-media').getPublicUrl('banners/mykotech-hero-official.webp');
  const bannerPublicUrl = bUrl.publicUrl;

  // 2. Upload Logo to Supabase Storage
  const logoBuffer = fs.readFileSync(path.join(__dirname, '..', 'public', 'logo.png'));
  await sb.storage.from('mykotech-media').upload('branding/logo.png', logoBuffer, {
    contentType: 'image/png',
    upsert: true
  });
  const { data: lUrl } = sb.storage.from('mykotech-media').getPublicUrl('branding/logo.png');
  const logoPublicUrl = lUrl.publicUrl;

  console.log('Banner Public URL:', bannerPublicUrl);
  console.log('Logo Public URL:', logoPublicUrl);

  // 3. Update hero_banners table
  await pg.query('DELETE FROM hero_banners;');
  await pg.query(`
    INSERT INTO hero_banners (title, subtitle, cta_text, cta_link, image_url, badge, display_order, is_active)
    VALUES (
      'MykoTech Pharma Pvt Ltd',
      'Live long Live Happy! Authentic prescription medicines, pediatric drops, syrups, and certified food supplements delivered to your doorstep.',
      'Order Online',
      '/products',
      '${bannerPublicUrl}',
      'Official Certified Store',
      1,
      true
    );
  `);
  console.log('Hero banner updated in database!');

  // 4. Update Categories & Sub-Categories to Client exact 4 categories!
  await pg.query('DELETE FROM sub_categories;');
  await pg.query('DELETE FROM categories;');

  const c1 = await pg.query(`
    INSERT INTO categories (name, slug, description, icon, display_order)
    VALUES ('Tablets', 'tablets', 'Pharmaceutical oral tablets, pain relievers, and prescription formulations', 'Pill', 1)
    RETURNING id;
  `);
  await pg.query(`
    INSERT INTO sub_categories (category_id, name, slug, description, display_order) VALUES
    ('${c1.rows[0].id}', 'Vitamins', 'vitamins-tablets', 'Daily vitamins and immune support tablets', 1),
    ('${c1.rows[0].id}', 'Pain Relief', 'pain-relief-tablets', 'Analgesic, antipyretic and anti-inflammatory tablets', 2),
    ('${c1.rows[0].id}', 'Digestive Health', 'digestive-health-tablets', 'Stomach and gastrointestinal tablets', 3),
    ('${c1.rows[0].id}', 'Other Tablets', 'other-tablets', 'General healthcare tablets', 4);
  `);

  const c2 = await pg.query(`
    INSERT INTO categories (name, slug, description, icon, display_order)
    VALUES ('Syrups', 'syrups', 'Liquid oral suspensions, cough formulations, and pediatric syrups', 'Milk', 2)
    RETURNING id;
  `);
  await pg.query(`
    INSERT INTO sub_categories (category_id, name, slug, description, display_order) VALUES
    ('${c2.rows[0].id}', 'Cough Syrups', 'cough-syrups', 'Bronchial and chest relief syrups', 1),
    ('${c2.rows[0].id}', 'Vitamins Syrups', 'vitamins-syrups', 'Liquid multivitamin tonics', 2),
    ('${c2.rows[0].id}', 'Digestive Syrups', 'digestive-syrups', 'Digestive enzymes and antispasmodics', 3),
    ('${c2.rows[0].id}', 'Other Syrups', 'other-syrups', 'General wellness syrups', 4);
  `);

  const c3 = await pg.query(`
    INSERT INTO categories (name, slug, description, icon, display_order)
    VALUES ('Drops', 'drops', 'Pediatric oral drops, infant care, and concentrated vitamin solutions', 'Droplet', 3)
    RETURNING id;
  `);
  await pg.query(`
    INSERT INTO sub_categories (category_id, name, slug, description, display_order) VALUES
    ('${c3.rows[0].id}', 'Vitamin Drops', 'vitamin-drops', 'Pediatric and infant vitamin drops', 1),
    ('${c3.rows[0].id}', 'Baby Drops', 'baby-drops', 'Colic, gripe, and infant relief drops', 2),
    ('${c3.rows[0].id}', 'Other Drops', 'other-drops', 'Specialized therapeutic drops', 3);
  `);

  const c4 = await pg.query(`
    INSERT INTO categories (name, slug, description, icon, display_order)
    VALUES ('Food Supplements', 'food-supplements', 'Dietary supplements, mineral complexes, and vitality boosters', 'Sparkles', 4)
    RETURNING id;
  `);
  await pg.query(`
    INSERT INTO sub_categories (category_id, name, slug, description, display_order) VALUES
    ('${c4.rows[0].id}', 'Vitamins', 'vitamins-supplements', 'Single and complex vitamin nutrition', 1),
    ('${c4.rows[0].id}', 'Minerals', 'minerals-supplements', 'Zinc, Calcium, and Iron supplements', 2),
    ('${c4.rows[0].id}', 'Multivitamins', 'multivitamins-supplements', 'Complete daily nutritional vitality', 3),
    ('${c4.rows[0].id}', 'Other Supplements', 'other-supplements', 'Specialized herbal and dietary supplements', 4);
  `);

  console.log('Client categories & sub-categories updated successfully!');

  // Link existing products
  await pg.query(`
    UPDATE products SET category_id = '${c1.rows[0].id}' WHERE slug LIKE '%tablet%' OR slug LIKE '%capsule%';
    UPDATE products SET category_id = '${c2.rows[0].id}' WHERE slug LIKE '%syrup%';
    UPDATE products SET category_id = '${c3.rows[0].id}' WHERE slug LIKE '%drop%';
    UPDATE products SET category_id = '${c4.rows[0].id}' WHERE slug LIKE '%formula%' OR slug LIKE '%effervescent%';
  `);

  await pg.end();
  console.log('Branding and Categories synchronized 100%!');
}

updateBrandingInDb().catch(e => { console.error(e); process.exit(1); });
