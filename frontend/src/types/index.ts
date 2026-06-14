// ============================================================
// IOCA - Centralized Type Definitions
// ============================================================

export interface Program {
  id: string;
  titleEn: string;
  titleUr: string;
  descEn: string;
  descUr: string;
  contentEn: string;
  contentUr: string;
  icon: string;
  image: string;
  heroImage?: string;
  stats: {
    beneficiaries: number;
    projects: number;
    volunteers: number;
  };
}

export interface Project {
  id: string;
  titleEn: string;
  titleUr: string;
  descEn: string;
  descUr: string;
  locationEn: string;
  locationUr: string;
  status: 'ongoing' | 'completed';
  statusEn: string;
  statusUr: string;
  date: string;
  image: string;
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
