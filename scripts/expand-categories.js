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

const pg = new Client({
  connectionString: process.env.DATABASE_URL || process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

async function expandCategories() {
  await pg.connect();
  console.log('Connected to database to update full pharmaceutical categories...');

  await pg.query('DELETE FROM sub_categories;');
  await pg.query('DELETE FROM categories;');

  const categoriesData = [
    {
      name: 'Tablets',
      slug: 'tablets',
      description: 'Oral solid formulations, daily vitamins, pain relievers and therapeutic tablets',
      icon: 'Pill',
      display_order: 1,
      subs: [
        { name: 'Vitamins & Multivitamins', slug: 'vitamins-tablets', desc: 'Daily nutritional tablets' },
        { name: 'Pain Relief & NSAIDs', slug: 'pain-relief-tablets', desc: 'Analgesic and fever relief tablets' },
        { name: 'Digestive & Gastro Care', slug: 'digestive-health-tablets', desc: 'Antacid and PPI tablets' },
        { name: 'Antibiotics & Anti-Infectives', slug: 'antibiotics-tablets', desc: 'Broad-spectrum antibacterial tablets' },
        { name: 'Cardiology & Blood Pressure', slug: 'cardiology-tablets', desc: 'Cardiovascular regulation tablets' },
        { name: 'Other Tablets', slug: 'other-tablets', desc: 'General healthcare tablets' }
      ]
    },
    {
      name: 'Syrups',
      slug: 'syrups',
      description: 'Liquid oral suspensions, cough elixirs, and pediatric formulations',
      icon: 'Milk',
      display_order: 2,
      subs: [
        { name: 'Cough & Chest Syrups', slug: 'cough-syrups', desc: 'Expectorant and dry cough syrups' },
        { name: 'Vitamins & Iron Tonics', slug: 'vitamins-syrups', desc: 'Growth and appetite tonics' },
        { name: 'Digestive & Antacid Syrups', slug: 'digestive-syrups', desc: 'Gut soothing liquids' },
        { name: 'Pediatric Suspensions', slug: 'pediatric-suspensions', desc: 'Children fever and antibiotic syrups' },
        { name: 'Other Syrups', slug: 'other-syrups', desc: 'General wellness liquid medicines' }
      ]
    },
    {
      name: 'Drops',
      slug: 'drops',
      description: 'Pediatric oral drops, infant colic solutions, and eye/ear formulations',
      icon: 'Droplet',
      display_order: 3,
      subs: [
        { name: 'Vitamin Drops', slug: 'vitamin-drops', desc: 'Infant vitamin D3 and multi-drops' },
        { name: 'Baby Colic & Gripe Drops', slug: 'baby-drops', desc: 'Infant gas and digestion drops' },
        { name: 'Eye & Ear Drops', slug: 'eye-ear-drops', desc: 'Sterile ophthalmic solutions' },
        { name: 'Nasal Decongestant Drops', slug: 'nasal-drops', desc: 'Saline and decongestant drops' },
        { name: 'Other Drops', slug: 'other-drops', desc: 'Therapeutic drop solutions' }
      ]
    },
    {
      name: 'Food Supplements',
      slug: 'food-supplements',
      description: 'Dietary supplements, mineral complexes, energy and vitality boosters',
      icon: 'Sparkles',
      display_order: 4,
      subs: [
        { name: 'Vitamins (C, D, B-Complex)', slug: 'vitamins-supplements', desc: 'Essential micronutrients' },
        { name: 'Minerals (Calcium, Zinc, Iron)', slug: 'minerals-supplements', desc: 'Bone and blood mineral support' },
        { name: 'Multivitamins & Antioxidants', slug: 'multivitamins-supplements', desc: 'All-in-one daily vitality' },
        { name: 'Omega-3 & Fish Oil', slug: 'omega-supplements', desc: 'Heart and brain health' },
        { name: 'Other Supplements', slug: 'other-supplements', desc: 'Herbal and dietary complexes' }
      ]
    },
    {
      name: 'Injectables & Infusions',
      slug: 'injectables-infusions',
      description: 'Hospital-grade sterile IV/IM injections, lyophilized vials, and saline infusions',
      icon: 'Syringe',
      display_order: 5,
      subs: [
        { name: 'Antibiotic Injections', slug: 'antibiotic-injections', desc: 'Ceftriaxone and broad-spectrum vials' },
        { name: 'Pain & Anti-Inflammatory Injections', slug: 'pain-injections', desc: 'Fast emergency analgesia' },
        { name: 'IV Infusions & Solvents', slug: 'iv-infusions', desc: 'Sterile saline and dextrose solutions' }
      ]
    },
    {
      name: 'Topical & Derma',
      slug: 'topical-derma',
      description: 'Medicated dermatological creams, antiseptic lotions, and pain relief gels',
      icon: 'Shield',
      display_order: 6,
      subs: [
        { name: 'Antiseptic & Healing Creams', slug: 'antiseptic-creams', desc: 'Wound care and burn ointments' },
        { name: 'Pain Relief Ointments & Gels', slug: 'pain-relief-gels', desc: 'Diclofenac and muscular rub gels' },
        { name: 'Antifungal & Antibacterial Topicals', slug: 'antifungal-creams', desc: 'Dermatological therapeutic creams' }
      ]
    }
  ];

  for (const cat of categoriesData) {
    const res = await pg.query(
      `INSERT INTO categories (name, slug, description, icon, display_order)
       VALUES ($1, $2, $3, $4, $5) RETURNING id;`,
      [cat.name, cat.slug, cat.description, cat.icon, cat.display_order]
    );
    const catId = res.rows[0].id;

    for (let i = 0; i < cat.subs.length; i++) {
      const sub = cat.subs[i];
      await pg.query(
        `INSERT INTO sub_categories (category_id, name, slug, description, display_order)
         VALUES ($1, $2, $3, $4, $5);`,
        [catId, sub.name, sub.slug, sub.desc, i + 1]
      );
    }
  }

  // Assign categories to existing products
  const tabs = await pg.query("SELECT id FROM categories WHERE slug = 'tablets'");
  const syrs = await pg.query("SELECT id FROM categories WHERE slug = 'syrups'");
  const drps = await pg.query("SELECT id FROM categories WHERE slug = 'drops'");
  const supp = await pg.query("SELECT id FROM categories WHERE slug = 'food-supplements'");
  const inj = await pg.query("SELECT id FROM categories WHERE slug = 'injectables-infusions'");

  if (tabs.rows[0]) await pg.query(`UPDATE products SET category_id = '${tabs.rows[0].id}' WHERE slug LIKE '%tablet%' OR slug LIKE '%capsule%';`);
  if (syrs.rows[0]) await pg.query(`UPDATE products SET category_id = '${syrs.rows[0].id}' WHERE slug LIKE '%syrup%';`);
  if (drps.rows[0]) await pg.query(`UPDATE products SET category_id = '${drps.rows[0].id}' WHERE slug LIKE '%drop%';`);
  if (supp.rows[0]) await pg.query(`UPDATE products SET category_id = '${supp.rows[0].id}' WHERE slug LIKE '%formula%' OR slug LIKE '%effervescent%';`);
  if (inj.rows[0]) await pg.query(`UPDATE products SET category_id = '${inj.rows[0].id}' WHERE slug LIKE '%injection%';`);

  console.log('Added 6 comprehensive pharmacy categories with 26 subcategories!');
  await pg.end();
}

expandCategories().catch(e => { console.error(e); process.exit(1); });
