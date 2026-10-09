const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');

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

const sampleMedicines = [
  {
    name: 'Mykoclav 625mg Tablets',
    slug: 'mykoclav-625mg-tablets',
    generic_name: 'Amoxicillin + Clavulanic Acid',
    dosage: '625mg (500mg/125mg)',
    cat_slug: 'antibiotics-anti-infectives',
    sub_slug: 'oral-tablets-capsules',
    price: 480.00,
    original_price: 550.00,
    stock: 120,
    requires_prescription: true,
    is_featured: true,
    short_description: 'Broad spectrum antibiotic for respiratory, ENT, skin, and urinary tract infections.',
    description: 'Mykoclav 625mg contains Amoxicillin and Clavulanic acid. It works by killing bacteria that cause infections. Amoxicillin prevents bacteria from forming their cell walls while clavulanic acid inhibits beta-lactamase enzyme.',
    composition: 'Each film-coated tablet contains Amoxicillin Trihydrate USP equivalent to Amoxicillin 500mg, Potassium Clavulanate USP equivalent to Clavulanic Acid 125mg.',
    dosage_instructions: 'One tablet twice daily after meals or as directed by a registered medical practitioner.',
    side_effects: 'Mild diarrhea, nausea, skin rash, abdominal discomfort.'
  },
  {
    name: 'Ceftrimyk 1g IV/IM Injection',
    slug: 'ceftrimyk-1g-injection',
    generic_name: 'Ceftriaxone Sodium',
    dosage: '1g Vial with Solvent',
    cat_slug: 'antibiotics-anti-infectives',
    sub_slug: 'injectables-iv',
    price: 320.00,
    original_price: 380.00,
    stock: 85,
    requires_prescription: true,
    is_featured: true,
    short_description: 'Third-generation cephalosporin for severe hospital and community acquired bacterial infections.',
    description: 'Ceftrimyk 1g is a potent sterile antibiotic for deep intramuscular injection or slow intravenous infusion under professional clinical supervision.',
    composition: 'Sterile Ceftriaxone Sodium USP equivalent to Ceftriaxone 1000mg.',
    dosage_instructions: 'Strictly as prescribed by physician. For clinical intravenous/intramuscular use only.',
    side_effects: 'Pain at injection site, eosinophilia, thrombocytosis.'
  },
  {
    name: 'Panadyne Forte 500mg/65mg',
    slug: 'panadyne-forte-tablets',
    generic_name: 'Paracetamol + Caffeine',
    dosage: '500mg / 65mg Pack of 20s',
    cat_slug: 'pain-relief-nsaids',
    sub_slug: 'paracetamol-combinations',
    price: 150.00,
    original_price: 180.00,
    stock: 250,
    requires_prescription: false,
    is_featured: true,
    short_description: 'Fast-action relief from headache, migraine, toothache, and high fever.',
    description: 'Panadyne Forte combines analgesia of Paracetamol with caffeine adjuvant to enhance pain relief onset and efficacy.',
    composition: 'Paracetamol BP 500mg, Anhydrous Caffeine BP 65mg per tablet.',
    dosage_instructions: '1-2 tablets every 4 to 6 hours as needed. Maximum 8 tablets in 24 hours.',
    side_effects: 'Insomnia, mild restlessness if taken late in evening.'
  },
  {
    name: 'Mykofenac SR 100mg Capsules',
    slug: 'mykofenac-sr-100mg',
    generic_name: 'Diclofenac Sodium Sustained Release',
    dosage: '100mg (10x10 Strips)',
    cat_slug: 'pain-relief-nsaids',
    sub_slug: 'nsaids-muscle-relaxants',
    price: 260.00,
    original_price: 300.00,
    stock: 90,
    requires_prescription: true,
    is_featured: false,
    short_description: 'Sustained-release NSAID for osteoarthritis, rheumatoid arthritis, and acute muscular spasms.',
    description: 'Sustained release formulation provides round-the-clock anti-inflammatory and pain control with reduced gastric irritation.',
    composition: 'Diclofenac Sodium BP 100mg in sustained release micro-pellets.',
    dosage_instructions: 'One capsule daily with food, swallow whole with water.',
    side_effects: 'Dyspepsia, gastric discomfort, headache.'
  },
  {
    name: 'Cardimyko Plus 5/20mg',
    slug: 'cardimyko-plus-tablets',
    generic_name: 'Amlodipine Besylate + Olmesartan Medoxomil',
    dosage: '5mg / 20mg (14 Tablets)',
    cat_slug: 'cardiology-blood-pressure',
    sub_slug: 'antihypertensives',
    price: 490.00,
    original_price: 560.00,
    stock: 110,
    requires_prescription: true,
    is_featured: true,
    short_description: 'Dual synergistic mechanism for optimal 24-hour hypertension management.',
    description: 'Combines calcium channel blocker and angiotensin II receptor antagonist for smooth blood pressure regulation.',
    composition: 'Amlodipine Besylate equivalent to Amlodipine 5mg, Olmesartan Medoxomil 20mg.',
    dosage_instructions: 'One tablet once daily at the same time each morning.',
    side_effects: 'Peripheral edema, dizziness, headache.'
  },
  {
    name: 'Lipimyko 20mg Statins',
    slug: 'lipimyko-20mg-statins',
    generic_name: 'Rosuvastatin Calcium',
    dosage: '20mg (10 Tablets)',
    cat_slug: 'cardiology-blood-pressure',
    sub_slug: 'statins-cholesterol',
    price: 380.00,
    original_price: 440.00,
    stock: 75,
    requires_prescription: true,
    is_featured: false,
    short_description: 'High-efficacy lipid regulator to lower LDL cholesterol and protect vascular endothelial integrity.',
    description: 'HMG-CoA reductase inhibitor designed for hypercholesterolemia and cardiovascular risk mitigation.',
    composition: 'Rosuvastatin Calcium equivalent to Rosuvastatin 20mg.',
    dosage_instructions: 'One tablet daily at bedtime.',
    side_effects: 'Myalgia, headache, abdominal pain.'
  },
  {
    name: 'Esomyko 40mg Capsule',
    slug: 'esomyko-40mg-capsule',
    generic_name: 'Esomeprazole Magnesium',
    dosage: '40mg Delayed-Release (14s)',
    cat_slug: 'gastrointestinal-digestive',
    sub_slug: 'ppis-acid-reducers',
    price: 310.00,
    original_price: 360.00,
    stock: 190,
    requires_prescription: false,
    is_featured: true,
    short_description: 'Next-generation PPI for GERD, acid reflux, heartburn, and peptic ulcer disease.',
    description: 'Provides long-lasting gastric acid suppression for healing of erosive esophagitis and symptom relief.',
    composition: 'Esomeprazole Magnesium Trihydrate USP equivalent to Esomeprazole 40mg.',
    dosage_instructions: 'One capsule daily 30-60 minutes before breakfast.',
    side_effects: 'Headache, flatulence, abdominal pain.'
  },
  {
    name: 'Spasmo-Myko Drops 30ml',
    slug: 'spasmo-myko-drops-30ml',
    generic_name: 'Simethicone + Dicyclomine HCl',
    dosage: '30ml Oral Drops with Dropper',
    cat_slug: 'gastrointestinal-digestive',
    sub_slug: 'digestive-enzymes-antispasmodics',
    price: 135.00,
    original_price: 160.00,
    stock: 140,
    requires_prescription: false,
    is_featured: false,
    short_description: 'Infant and adult relief for colic, abdominal cramps, gas, and intestinal spasms.',
    description: 'Dual antispasmodic and antifoaming agent relieving infant colic and painful bowel distension.',
    composition: 'Dicyclomine HCl 10mg, Activated Simethicone 40mg per 5ml.',
    dosage_instructions: 'Administer using calibrated dropper 15 minutes before feeding.',
    side_effects: 'Dry mouth, mild drowsiness.'
  },
  {
    name: 'VitaMyko-C 1000mg Effervescent',
    slug: 'vitamyko-c-1000mg-effervescent',
    generic_name: 'Vitamin C + Zinc + Vitamin D3',
    dosage: '20 Effervescent Tablets (Orange)',
    cat_slug: 'vitamins-nutraceuticals',
    sub_slug: 'immunity-vitamins',
    price: 450.00,
    original_price: 520.00,
    stock: 220,
    requires_prescription: false,
    is_featured: true,
    short_description: 'Triple active defense formulation for immune reinforcement and vitality.',
    description: 'Fast-dissolving effervescent orange tablets providing high bioavailability Ascorbic acid and Zinc.',
    composition: 'Ascorbic Acid (Vitamin C) 1000mg, Zinc Sulfate Monohydrate 10mg, Cholecalciferol (Vitamin D3) 400IU.',
    dosage_instructions: 'Dissolve one tablet in a glass of water (200ml) daily and drink immediately.',
    side_effects: 'None under recommended dosage.'
  },
  {
    name: 'OsteoMyko D3 Bone Formula',
    slug: 'osteomyko-d3-bone-formula',
    generic_name: 'Calcium Carbonate + Vitamin D3 + Magnesium',
    dosage: '30 Film-Coated Tablets',
    cat_slug: 'vitamins-nutraceuticals',
    sub_slug: 'calcium-bone-health',
    price: 360.00,
    original_price: 420.00,
    stock: 130,
    requires_prescription: false,
    is_featured: false,
    short_description: 'Optimal bone density and joint mineral matrix support for all ages.',
    description: 'Synergistic mineral formula delivering elemental Calcium paired with Vitamin D3 for maximum gut absorption.',
    composition: 'Elemental Calcium 500mg, Vitamin D3 400IU, Magnesium Oxide 50mg.',
    dosage_instructions: 'One tablet twice daily with meals.',
    side_effects: 'Occasional mild constipation.'
  }
];

async function seedProducts() {
  console.log('Connecting to database...');
  await pg.connect();

  const imgDir = path.join(__dirname, '..', 'Products Images');
  const availableImages = fs.readdirSync(imgDir).filter(f => f.endsWith('.jpeg') || f.endsWith('.jpg') || f.endsWith('.png'));
  console.log(`Found ${availableImages.length} product images in folder.`);

  // Get categories and subcategories
  const catsRes = await pg.query('SELECT id, slug FROM categories;');
  const subCatsRes = await pg.query('SELECT id, slug, category_id FROM sub_categories;');

  const catMap = {};
  catsRes.rows.forEach(r => catMap[r.slug] = r.id);

  const subCatMap = {};
  subCatsRes.rows.forEach(r => subCatMap[r.slug] = r.id);

  for (let i = 0; i < sampleMedicines.length; i++) {
    const med = sampleMedicines[i];
    const imgFile = availableImages[i % availableImages.length];
    const srcPath = path.join(imgDir, imgFile);

    console.log(`Processing [${i+1}/${sampleMedicines.length}] ${med.name}...`);
    
    // Auto convert and compress to WebP (target: tiny KBs)
    const compressedWebp = await sharp(srcPath)
      .resize(700, 700, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const sizeKb = (compressedWebp.length / 1024).toFixed(1);
    const storagePath = `products/${med.slug}.webp`;

    console.log(`  -> Compressed to ${sizeKb}KB. Uploading to Supabase Storage bucket...`);

    const { error: uploadErr } = await sb.storage.from('mykotech-media').upload(storagePath, compressedWebp, {
      contentType: 'image/webp',
      upsert: true
    });

    if (uploadErr) {
      console.error(`  Upload error:`, uploadErr.message);
    }

    const { data: urlData } = sb.storage.from('mykotech-media').getPublicUrl(storagePath);
    const publicUrl = urlData.publicUrl;

    const catId = catMap[med.cat_slug] || null;
    const subCatId = subCatMap[med.sub_slug] || null;

    // Insert or update product in DB
    await pg.query(`
      INSERT INTO products (
        name, slug, generic_name, dosage, category_id, sub_category_id,
        price, original_price, stock, thumbnail_url, gallery_urls,
        short_description, description, composition, dosage_instructions,
        side_effects, requires_prescription, is_active, is_featured
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
      )
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        thumbnail_url = EXCLUDED.thumbnail_url,
        price = EXCLUDED.price,
        stock = EXCLUDED.stock;
    `, [
      med.name,
      med.slug,
      med.generic_name,
      med.dosage,
      catId,
      subCatId,
      med.price,
      med.original_price,
      med.stock,
      publicUrl,
      JSON.stringify([publicUrl]),
      med.short_description,
      med.description,
      med.composition,
      med.dosage_instructions,
      med.side_effects,
      med.requires_prescription,
      true,
      med.is_featured
    ]);

    console.log(`  -> Saved in DB with public URL: ${publicUrl}`);
  }

  await pg.end();
  console.log('Seeded products successfully with WebP images and zero base64!');
}

seedProducts().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
