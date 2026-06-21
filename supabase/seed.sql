-- =============================================================================
-- Seed data — real catalog from the legacy site + sample orders for the dashboard.
-- Idempotent-ish: safe to run on a fresh `supabase db reset`.
-- Image URLs resolve from /public/products (copied from the legacy assets).
-- =============================================================================

-- Bootstrap admin allow-list. Replace with the real owner email (also settable
-- via the ADMIN_EMAILS env + docs/SETUP.md). Listed emails become admin on signup.
insert into public.admin_emails (email) values
  ('atlbladeco@gmail.com'),
  ('abrartsarwar@gmail.com')
on conflict (email) do nothing;

-- ---- categories -------------------------------------------------------------
insert into public.categories (id, name, slug, description, sort_order, active) values
  ('c0000000-0000-4000-8000-000000000001', 'Damascus', 'damascus', 'Hand-forged Damascus steel blades.', 1, true),
  ('c0000000-0000-4000-8000-000000000002', 'Pocket Knives', 'pocket', 'Everyday-carry folding knives.', 2, true),
  ('c0000000-0000-4000-8000-000000000003', 'Outdoor', 'outdoor', 'Skinners and fixed blades for the field.', 3, true),
  ('c0000000-0000-4000-8000-000000000004', 'Tactical', 'tactical', 'Karambits and tactical-style blades.', 4, true);

-- ---- products ---------------------------------------------------------------
insert into public.products
  (id, name, slug, description, category_id, price, sale_price, inventory, featured, active, tags, badge, specs, features)
values
  ('a0000000-0000-4000-8000-000000000001',
   'Damascus USA Flag Pocket Knife', 'damascus-usa-flag-pocket-knife',
   'Compact liner-lock pocket knife with a striking USA flag handle and a hand-forged Damascus blade.',
   'c0000000-0000-4000-8000-000000000001', 89.00, null, 12, false, true,
   array['damascus','pocket'], 'Patriot',
   '[["Overall Length","5\""],["Closed Length","3\""],["Blade","Damascus steel"],["Lock","Liner lock"],["Liners","Brass"]]'::jsonb,
   array['Lightweight, pocket-friendly EDC','Unique patriotic design','Smooth and secure operation','Perfect for everyday carry, collectors, or gifting']),

  ('a0000000-0000-4000-8000-000000000002',
   'Damascus Pakkawood USA Pocket Knife', 'damascus-pakkawood-usa-pocket-knife',
   'A premium folding knife with Damascus steel bolsters and blade, paired with a striking USA flag-color pakkawood and white resin handle.',
   'c0000000-0000-4000-8000-000000000001', 119.00, 99.00, 8, true, true,
   array['damascus','pocket'], 'Premium',
   '[["Closed Length","4.5\""],["Blade","Damascus steel"],["Bolsters","Damascus"],["Handle","Pakkawood + white resin (USA flag colors)"],["Lock","Liner lock"]]'::jsonb,
   array['Elegant mixed-material handle design','Matching Damascus blade & bolsters','Solid, stylish everyday carry','Ideal for collectors, EDC, or a standout gift piece']),

  ('a0000000-0000-4000-8000-000000000003',
   'Damascus & Pakkawood Pocket Knife', 'damascus-pakkawood-camel-bone-pocket-knife',
   'A premium folding knife with Damascus steel bolsters and blade, paired with a striking pakkawood and camel-bone handle.',
   'c0000000-0000-4000-8000-000000000001', 109.00, null, 5, false, true,
   array['damascus','pocket'], null,
   '[["Closed Length","4.5\""],["Blade","Damascus steel"],["Bolsters","Damascus"],["Handle","Pakkawood + camel bone"],["Lock","Liner lock"]]'::jsonb,
   array['Elegant mixed-material handle design','Matching Damascus blade & bolsters','Solid, stylish everyday carry','Ideal for collectors, EDC, or a standout gift piece']),

  ('a0000000-0000-4000-8000-000000000004',
   'SS & Bone Pocket Knife — Compact Folder', 'ss-bone-pocket-knife',
   'Small, durable pocket knife featuring a stainless steel blade with a bone and stainless steel handle combination.',
   'c0000000-0000-4000-8000-000000000002', 59.00, null, 3, false, true,
   array['pocket'], null,
   '[["Closed Length","4\""],["Blade","Stainless steel"],["Handle","Bone & stainless steel"],["Lock","Liner lock"]]'::jsonb,
   array['Compact and easy to carry','Classic bone + steel look','Reliable everyday utility','Great for EDC, collectors, or a simple gift option']),

  ('a0000000-0000-4000-8000-000000000005',
   '7” Damascus Skinner Knife', 'damascus-skinner-knife',
   'A robust skinner with a hand-forged Damascus blade and a durable pakkawood handle.',
   'c0000000-0000-4000-8000-000000000003', 139.00, null, 7, true, true,
   array['damascus','outdoor'], 'Hunter',
   '[["Overall Length","7\""],["Blade","Damascus steel"],["Handle","Pakkawood"],["Style","Skinner"]]'::jsonb,
   array['Curved skinner blade for efficient processing','Strong, moisture-resistant pakkawood grip','Unique Damascus pattern on every piece','Ideal for hunting, outdoor use, or collectors']),

  ('a0000000-0000-4000-8000-000000000006',
   'Powdercoated Tracker Knife — 11”', 'powdercoated-tracker-knife',
   'A rugged tracker-style fixed blade built for hard outdoor use, featuring a durable powdercoated blade and a solid black resin handle.',
   'c0000000-0000-4000-8000-000000000003', 149.00, null, 2, false, true,
   array['outdoor','tactical'], 'Heavy-Duty',
   '[["Overall Length","11\""],["Blade","Powdercoated steel"],["Handle","Black resin"],["Style","Tracker"]]'::jsonb,
   array['Tough powdercoated finish for corrosion resistance','Ergonomic, weather-resistant resin grip','Versatile tracker design for chopping, slicing & utility','Ideal for camping, bushcraft, and heavy-duty outdoor tasks']),

  ('a0000000-0000-4000-8000-000000000007',
   'Karambit Knife — Powdercoated Blade', 'karambit-knife',
   'A bold tactical-style karambit featuring a durable powdercoated blade and a rugged black micarta handle, finished with a striking mosaic pin.',
   'c0000000-0000-4000-8000-000000000004', 129.00, null, 10, true, true,
   array['tactical'], 'Limited',
   '[["Overall Length","10\""],["Blade","Powdercoated steel"],["Handle","Black micarta"],["Feature","Mosaic pin"]]'::jsonb,
   array['Curved karambit blade for precision and control','Tough non-slip micarta grip','Eye-catching mosaic pin detail','Built for durability and performance','Ideal for collectors, outdoor use, or tactical-style carry']),

  -- Archived example to demonstrate the active/archived distinction.
  ('a0000000-0000-4000-8000-000000000008',
   'Prototype Cleaver (Archived)', 'prototype-cleaver-archived',
   'An experimental cleaver prototype kept for reference. Hidden from the storefront.',
   'c0000000-0000-4000-8000-000000000003', 175.00, null, 0, false, false,
   array['outdoor'], null,
   '[["Overall Length","9\""],["Blade","Carbon steel"]]'::jsonb,
   array['Prototype only','Not for sale']);

-- ---- product_images (primary + a couple gallery shots per product) ----------
insert into public.product_images (product_id, url, alt, sort_order, is_primary) values
  ('a0000000-0000-4000-8000-000000000001', '/products/Damascus_USA_Pocket_Knife/Damascus_USA_Pocket_Knife.png',  'Damascus USA Flag Pocket Knife', 0, true),
  ('a0000000-0000-4000-8000-000000000001', '/products/Damascus_USA_Pocket_Knife/Damascus_USA_Pocket_Knife1.png', 'Damascus USA Flag Pocket Knife detail', 1, false),
  ('a0000000-0000-4000-8000-000000000001', '/products/Damascus_USA_Pocket_Knife/Damascus_USA_Pocket_Knife2.png', 'Damascus USA Flag Pocket Knife detail', 2, false),

  ('a0000000-0000-4000-8000-000000000002', '/products/Damascus_Pakkawood_USA_Pocket_Knife/Damascus_Pakkawood_USA_Pocket_Knife.png',  'Damascus Pakkawood USA Pocket Knife', 0, true),
  ('a0000000-0000-4000-8000-000000000002', '/products/Damascus_Pakkawood_USA_Pocket_Knife/Damascus_Pakkawood_USA_Pocket_Knife1.png', 'Damascus Pakkawood USA Pocket Knife detail', 1, false),
  ('a0000000-0000-4000-8000-000000000002', '/products/Damascus_Pakkawood_USA_Pocket_Knife/Damascus_Pakkawood_USA_Pocket_Knife2.png', 'Damascus Pakkawood USA Pocket Knife detail', 2, false),

  ('a0000000-0000-4000-8000-000000000003', '/products/Damascus_Pakkawood_Camel_bone_Pocket_Knife/Damascus_Pakkawood_Camel_bone_Pocket_Knife.png',  'Damascus & Pakkawood Pocket Knife', 0, true),
  ('a0000000-0000-4000-8000-000000000003', '/products/Damascus_Pakkawood_Camel_bone_Pocket_Knife/Damascus_Pakkawood_Camel_bone_Pocket_Knife1.png', 'Damascus & Pakkawood Pocket Knife detail', 1, false),
  ('a0000000-0000-4000-8000-000000000003', '/products/Damascus_Pakkawood_Camel_bone_Pocket_Knife/Damascus_Pakkawood_Camel_bone_Pocket_Knife2.png', 'Damascus & Pakkawood Pocket Knife detail', 2, false),

  ('a0000000-0000-4000-8000-000000000004', '/products/SS_and_Bone_Pocket_Knife/SS_and_Bone_Pocket_Knife.png',  'SS & Bone Pocket Knife', 0, true),
  ('a0000000-0000-4000-8000-000000000004', '/products/SS_and_Bone_Pocket_Knife/SS_and_Bone_Pocket_Knife1.png', 'SS & Bone Pocket Knife detail', 1, false),
  ('a0000000-0000-4000-8000-000000000004', '/products/SS_and_Bone_Pocket_Knife/SS_and_Bone_Pocket_Knife2.png', 'SS & Bone Pocket Knife detail', 2, false),

  ('a0000000-0000-4000-8000-000000000005', '/products/Damascus_Skinner_knife/Damascus_Skinner_knife.png',  '7 inch Damascus Skinner Knife', 0, true),
  ('a0000000-0000-4000-8000-000000000005', '/products/Damascus_Skinner_knife/Damascus_Skinner_knife1.png', '7 inch Damascus Skinner Knife detail', 1, false),
  ('a0000000-0000-4000-8000-000000000005', '/products/Damascus_Skinner_knife/Damascus_Skinner_knife2.png', '7 inch Damascus Skinner Knife detail', 2, false),

  ('a0000000-0000-4000-8000-000000000006', '/products/Powdercoated_tracker_knife/Powdercoated_tracker_knife.png',  'Powdercoated Tracker Knife', 0, true),
  ('a0000000-0000-4000-8000-000000000006', '/products/Powdercoated_tracker_knife/Powdercoated_tracker_knife1.png', 'Powdercoated Tracker Knife detail', 1, false),
  ('a0000000-0000-4000-8000-000000000006', '/products/Powdercoated_tracker_knife/Powdercoated_tracker_knife2.png', 'Powdercoated Tracker Knife detail', 2, false),

  ('a0000000-0000-4000-8000-000000000007', '/products/Karambit_knife/Karambit_knife.png',  'Karambit Knife', 0, true),
  ('a0000000-0000-4000-8000-000000000007', '/products/Karambit_knife/Karambit_knife1.png', 'Karambit Knife detail', 1, false),
  ('a0000000-0000-4000-8000-000000000007', '/products/Karambit_knife/Karambit_knife2.png', 'Karambit Knife detail', 2, false);

-- ---- discount ---------------------------------------------------------------
insert into public.discounts (id, code, type, value, expires_at, usage_limit, usage_count, min_subtotal, active) values
  ('d0000000-0000-4000-8000-000000000001', 'WELCOME10', 'percentage', 10.00, now() + interval '90 days', 100, 12, 50.00, true);

-- ---- sample orders (spanning statuses) for the dashboard --------------------
insert into public.orders
  (id, order_number, customer_name, customer_email, customer_phone, shipping_address,
   subtotal, discount_total, shipping_total, tax_total, total, discount_id, payment_status, fulfillment_status, created_at)
values
  ('e0000000-0000-4000-8000-000000000001', 'ATL-1001', 'Marcus Webb', 'marcus@example.com', '404-555-0111',
   '{"line1":"120 Peachtree St","city":"Atlanta","state":"GA","postal_code":"30303","country":"US"}'::jsonb,
   129.00, 0, 8.00, 10.32, 147.32, null, 'paid', 'delivered', now() - interval '12 days'),

  ('e0000000-0000-4000-8000-000000000002', 'ATL-1002', 'Dana Cole', 'dana@example.com', '404-555-0122',
   '{"line1":"55 Forsyth St","city":"Atlanta","state":"GA","postal_code":"30303","country":"US"}'::jsonb,
   99.00, 9.90, 8.00, 7.93, 105.03, 'd0000000-0000-4000-8000-000000000001', 'paid', 'shipped', now() - interval '5 days'),

  ('e0000000-0000-4000-8000-000000000003', 'ATL-1003', 'Priya Nair', 'priya@example.com', null,
   '{"line1":"880 W Marietta St","city":"Atlanta","state":"GA","postal_code":"30318","country":"US"}'::jsonb,
   139.00, 0, 8.00, 11.12, 158.12, null, 'paid', 'processing', now() - interval '2 days'),

  ('e0000000-0000-4000-8000-000000000004', 'ATL-1004', 'Sam Ortiz', 'sam@example.com', '404-555-0144',
   '{"line1":"1 CNN Center","city":"Atlanta","state":"GA","postal_code":"30303","country":"US"}'::jsonb,
   59.00, 0, 8.00, 4.72, 71.72, null, 'pending', 'pending', now() - interval '6 hours');

insert into public.order_items
  (order_id, product_id, product_name, product_slug, unit_price, quantity, line_total)
values
  ('e0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000007', 'Karambit Knife — Powdercoated Blade', 'karambit-knife', 129.00, 1, 129.00),
  ('e0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', 'Damascus Pakkawood USA Pocket Knife', 'damascus-pakkawood-usa-pocket-knife', 99.00, 1, 99.00),
  ('e0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000005', '7” Damascus Skinner Knife', 'damascus-skinner-knife', 139.00, 1, 139.00),
  ('e0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000004', 'SS & Bone Pocket Knife — Compact Folder', 'ss-bone-pocket-knife', 59.00, 1, 59.00);

-- ---- homepage settings (singleton) -----------------------------------------
insert into public.homepage_settings
  (id, hero_eyebrow, hero_title, hero_subtitle, hero_image_url, hero_cta_text, hero_cta_link, hero_gallery, featured_product_ids, banners, sections)
values
  (true,
   'Atlanta, Georgia • Est. 2026',
   'Handmade **Knives** From Atlanta',
   'Handmade knives out of a new shop in Atlanta. Each one comes off the bench a little different. That''s kind of the point.',
   '/products/Karambit_knife/Karambit_knife.png',
   'Shop Collection', '/shop',
   '["/products/Karambit_knife/Karambit_knife.png","/products/Damascus_Pakkawood_USA_Pocket_Knife/Damascus_Pakkawood_USA_Pocket_Knife.png","/products/Damascus_Skinner_knife/Damascus_Skinner_knife.png"]'::jsonb,
   array['a0000000-0000-4000-8000-000000000007','a0000000-0000-4000-8000-000000000002','a0000000-0000-4000-8000-000000000005']::uuid[],
   '[{"text":"Free shipping on orders over $150","link":"/shop","active":true}]'::jsonb,
   '[
     {"type":"about","eyebrow":"Our Story","heading":"A new shop,\nin Atlanta","image_url":"/home/atlanta.jpg","body":"ATL Blade Co. was founded by Zian Bhutta, an Atlanta native who spent his whole life in the city before deciding it was time to actually make something for the place that raised him, instead of just being from it. The shop is new, and right now it''s just him at a small bench with a slowly growing group of people around the city who care about this kind of work.\n\nMost of the catalog is hand-forged Damascus steel, the patterned blades you''ll see on the pocket knives and the skinner, while the fixed blades and the karambit are powdercoated for hard outdoor use. Every piece comes off the bench a little different from the one before it."},
     {"type":"quote","body":"A good knife should feel right the first time you pick it up.","attribution":"— Zian"}
   ]'::jsonb)
on conflict (id) do update set
  hero_eyebrow = excluded.hero_eyebrow,
  hero_title = excluded.hero_title,
  hero_subtitle = excluded.hero_subtitle,
  hero_image_url = excluded.hero_image_url,
  hero_cta_text = excluded.hero_cta_text,
  hero_cta_link = excluded.hero_cta_link,
  hero_gallery = excluded.hero_gallery,
  featured_product_ids = excluded.featured_product_ids,
  banners = excluded.banners,
  sections = excluded.sections;

-- ---- site settings (singleton) ---------------------------------------------
insert into public.site_settings
  (id, company_name, contact_email, phone, address, shipping_policy, return_policy, social_links)
values
  (true,
   'ATL Blade Co.',
   'atlbladeco@gmail.com',
   '(404) 944-1159',
   '{"city":"Atlanta","state":"Georgia","country":"USA"}'::jsonb,
   'Orders ship within 3–5 business days from Atlanta, GA.',
   'Returns accepted within 14 days on unused items in original condition.',
   '{"instagram":"https://instagram.com/atlbladeco","tiktok":"https://tiktok.com/@atlbladeco"}'::jsonb)
on conflict (id) do update set
  company_name = excluded.company_name,
  contact_email = excluded.contact_email,
  phone = excluded.phone,
  address = excluded.address,
  shipping_policy = excluded.shipping_policy,
  return_policy = excluded.return_policy,
  social_links = excluded.social_links;
