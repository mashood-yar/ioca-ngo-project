-- Insert the 4 main programs into the database using the new categories

-- Education
INSERT INTO public.programs (
  id, title_en, title_ur, desc_en, desc_ur, content_en, content_ur, 
  category_id, stats_beneficiaries, stats_projects, stats_volunteers, status, image_url, hero_image_url
) 
SELECT 
  gen_random_uuid(), 'Education', 'تعلیم', 
  'Quality education, scholarships, and literacy programs for rural and urban Pakistan.', 
  'پاکستان کے دیہی اور شہری علاقوں میں معیاری تعلیم اور وظائف کی فراہمی۔', 
  'Our Education Program is the cornerstone of IOCA''s mission to uplift communities across Pakistan. We provide free primary and secondary education to children in underserved areas. Our curriculum combines academic excellence with life skills training.', 
  'ہمارا تعلیمی پروگرام IOCA کے مشن کا بنیادی حصہ ہے۔ ہم پسماندہ علاقوں میں بچوں کو مفت تعلیم فراہم کرتے ہیں۔', 
  id, 50000, 120, 450, 'active', '/assets/prog-edu-card.webp', '/assets/prog-edu-hero.webp'
FROM public.program_categories WHERE slug = 'education'
LIMIT 1;

-- Health
INSERT INTO public.programs (
  id, title_en, title_ur, desc_en, desc_ur, content_en, content_ur, 
  category_id, stats_beneficiaries, stats_projects, stats_volunteers, status, image_url, hero_image_url
) 
SELECT 
  gen_random_uuid(), 'Healthcare & Medical', 'صحت اور علاج', 
  'Providing free medical camps, hospital support, and maternal care to those in need.', 
  'ضرورت مندوں کو مفت طبی کیمپ اور ہسپتال کی سہولیات کی فراہمی۔', 
  'Access to quality healthcare is a fundamental human right. IOCA operates mobile health clinics and organizes free medical camps in remote villages where healthcare infrastructure is non-existent.', 
  'معیاری صحت کی دیکھ بھال ایک بنیادی انسانی حق ہے۔ IOCA دور دراز کے دیہاتوں میں مفت میڈیکل کیمپ لگاتا ہے۔', 
  id, 120000, 45, 200, 'active', '/assets/prog-health-card.webp', '/assets/prog-health-hero.webp'
FROM public.program_categories WHERE slug = 'health'
LIMIT 1;

-- Youth
INSERT INTO public.programs (
  id, title_en, title_ur, desc_en, desc_ur, content_en, content_ur, 
  category_id, stats_beneficiaries, stats_projects, stats_volunteers, status, image_url, hero_image_url
) 
SELECT 
  gen_random_uuid(), 'Youth Empowerment', 'نوجوانوں کی ترقی', 
  'Skill development, IT training, and sports programs to build the leaders of tomorrow.', 
  'نوجوانوں کو بااختیار بنانے کے لیے ہنر اور آئی ٹی کی تربیت۔', 
  'With over 60% of Pakistan''s population under the age of 30, our youth are our greatest asset. Our Youth Empowerment programs focus on vocational training, IT skills, and leadership development.', 
  'پاکستان کی 60 فیصد سے زیادہ آبادی 30 سال سے کم عمر کی ہے۔ ہمارا یوتھ پروگرام ووکیشنل ٹریننگ اور آئی ٹی کی مہارتوں پر مرکوز ہے۔', 
  id, 25000, 80, 600, 'active', '/assets/prog-youth-card.webp', '/assets/prog-youth-hero.webp'
FROM public.program_categories WHERE slug = 'youth'
LIMIT 1;

-- Community Bonding
INSERT INTO public.programs (
  id, title_en, title_ur, desc_en, desc_ur, content_en, content_ur, 
  category_id, stats_beneficiaries, stats_projects, stats_volunteers, status, image_url, hero_image_url
) 
SELECT 
  gen_random_uuid(), 'Community Bonding', 'عوامی تعلقات', 
  'Fostering unity, cultural events, and interfaith harmony within diverse neighborhoods.', 
  'مختلف برادریوں کے درمیان اتحاد اور ثقافتی ہم آہنگی کو فروغ دینا۔', 
  'Strong communities build a strong nation. Our Community Bonding initiatives are designed to bridge divides and foster mutual understanding among different cultural, ethnic, and religious groups in Pakistan.', 
  'مضبوط کمیونٹیز ایک مضبوط قوم بناتی ہیں۔ ہمارے کمیونٹی بانڈنگ پروگرام مختلف گروہوں کے درمیان باہمی افہام و تفہیم کو فروغ دینے کے لیے بنائے گئے ہیں۔', 
  id, 80000, 150, 1200, 'active', '/assets/prog-community-card.webp', '/assets/prog-community-hero.webp'
FROM public.program_categories WHERE slug = 'community_bonding'
LIMIT 1;
