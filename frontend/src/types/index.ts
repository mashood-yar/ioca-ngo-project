// ============================================================
// IOCA - Centralized Type Definitions
// ============================================================

export interface ProgramCategory {
  id: string;
  name_en: string;
  name_ur: string;
  slug: string;
  icon_svg: string | null;
  sort_order: number;
}

export interface Program {
  id: string;
  slug?: string;
  title_en: string;
  title_ur: string;
  desc_en: string;
  desc_ur: string;
  content_en: string;
  content_ur: string;
  category_id: string;
  category?: ProgramCategory;
  image_url: string | null;
  hero_image_url?: string | null;
  icon_url?: string | null;
  stats_beneficiaries: number;
  stats_projects: number;
  stats_volunteers: number;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Project {
  id: string;
  title?: string;
  titleEn: string;
  titleUr: string;
  title_en?: string;
  title_ur?: string;
  descEn: string;
  descUr: string;
  description?: string;
  locationEn: string;
  locationUr: string;
  status: 'ongoing' | 'completed' | 'paused' | 'upcoming' | string;
  statusEn: string;
  statusUr: string;
  date: string;
  start_date?: string;
  startDate?: string;
  end_date?: string;
  endDate?: string;
  image: string;
  image_url?: string;
  category?: string;
  slug?: string;
  progress: number;
}

export interface TeamMember {
  id: string;
  nameEn: string;
  nameUr: string;
  positionEn: string;
  positionUr: string;
  bioEn: string;
  bioUr: string;
  image: string;
}

export interface Campaign {
  id: string;
  titleEn: string;
  titleUr: string;
  descEn: string;
  descUr: string;
  categoryEn: string;
  categoryUr: string;
  image: string;
  raised: number;
  goal: number;
  isUrgent: boolean;
}

export interface Testimonial {
  id: string;
  quoteEn: string;
  quoteUr: string;
  nameEn: string;
  nameUr: string;
  locationEn: string;
  locationUr: string;
  initial: string;
  bgColor: 'white' | 'teal';
}

export interface GalleryItem {
  id: string;
  image: string;
  titleEn: string;
  titleUr: string;
  descEn: string;
  descUr: string;
  category: 'education' | 'health' | 'youth' | 'community';
}

export interface ImpactStory {
  id: string;
  titleEn: string;
  titleUr: string;
  excerptEn: string;
  excerptUr: string;
  contentEn: string;
  contentUr: string;
  quoteEn: string;
  quoteUr: string;
  categoryEn: string;
  categoryUr: string;
  image: string;
  date: string;
}

export interface ImpactStat {
  id: string;
  value: string;
  valueUr: string;
  labelEn: string;
  labelUr: string;
  icon: string;
}

export interface NavLink {
  to: string;
  labelEn: string;
  labelUr: string;
  children?: NavLink[];
}

export interface Personnel {
  id: string;
  category: 'board' | 'partner' | 'employee' | 'volunteer';
  uid: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  profile_image_url: string | null;
  qr_code_url: string | null;
  status: 'active' | 'suspended' | 'former';
  title: string;
  bio: string | null;
  created_at: string;
  updated_at: string;
}
