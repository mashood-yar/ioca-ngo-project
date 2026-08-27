-- Seed script for Board Members & Core Team
-- Run this in your Supabase SQL Editor
-- M-05: Fixed UID prefix to match API's generateUid logic (category.substring(0,3).toUpperCase())
-- 'board' → 'BOA', 'partner' → 'PAR'

INSERT INTO public.personnel (category, uid, full_name, title, email, phone, bio, status) VALUES
('board', 'BOA-A1B2C3D4', 'Muhammad Siddiq', 'Chairman', 'mohmmadsiddiq5544@gmail.com', '03149879159', 'Homeopathic Doctor. Father: Shuaib ullah', 'active'),
('board', 'BOA-D4E5F6G7', 'Aftab Khan', 'Vice Chairman', 'aftabkhant676767@gmail.com', '03361520638', 'Student. Father: Anwar khan', 'active'),
('board', 'BOA-G7H8I9J0', 'Muhammad Shamweel', 'General Secretary', 'jarrarhamasi2@gmail.com', '03175182585', 'Student. Father: Muhammad siddiq', 'active'),
('board', 'BOA-J0K1L2M3', 'Luqman Ali', 'Finance Secretary', 'aliluqman936@gmail.com', '03152219652', 'Business. Father: Mukammil shah', 'active'),
('board', 'BOA-M3N4O5P6', 'Haris Altaf', 'Health Secretary', 'harisaltaf12555@gmail.com', '03151947934', 'MBBS Student. Father: Iltaf Hussain', 'active'),
('board', 'BOA-P6Q7R8S9', 'Shahid Ali Zada', 'Education Secretary', 'Shahidalizada197@gmail.com', '03249354772', 'Social activist. Father: Muhammad zada', 'active'),
('board', 'BOA-S9T0U1V2', 'Ahmad Raza', 'Information Secretary', 'rnkashif313@gmail.com', '03279826542', 'Student. Father: Tahir Raza', 'active'),
('partner', 'PAR-V2W3X4Y5', 'Mashood Yar Khan', 'Creative Head', 'mashoodyar115@gmail.com', '03200236963', 'ACCA Student. Father: Sheheryar Khan', 'active');
