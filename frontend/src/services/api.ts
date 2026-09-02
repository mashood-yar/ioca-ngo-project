import { fetchApi } from '../lib/apiClient';
import type { 
  Project, 
  Campaign, 
  TeamMember, 
  Testimonial, 
  GalleryItem, 
  ImpactStory 
} from '../types';
import { 
  projects as mockProjects,
  campaigns as mockCampaigns,
  teamMembers as mockTeam,
  testimonials as mockTestimonials,
  impactStories as mockStories
} from '../data/mockData';

// ============================================================================
// API Service Layer
// ============================================================================

export async function getProjects(): Promise<Project[]> {
  const { data, error } = await fetchApi<any[]>('/projects');

  if (error || !data) {
    console.warn('Backend error or unreachable, falling back to mock projects.', error);
    return mockProjects;
  }

  return data.map((row: any) => {
    const status = row.status === 'completed' ? 'completed' : 'ongoing';
    const progress = typeof row.progress === 'number' ? row.progress : (status === 'completed' ? 100 : 50);
    const locationEn = row.location_en || '';
    const locationUr = row.location_ur || locationEn;
    const dateStr = row.start_date
      ? new Date(row.start_date).toLocaleDateString()
      : new Date(row.created_at).toLocaleDateString();
    return {
      id: row.id,
      titleEn: row.title_en,
      titleUr: row.title_ur || row.title_en,
      descEn: row.desc_en,
      descUr: row.desc_ur || row.desc_en,
      locationEn: locationEn,
      locationUr: locationUr,
      status,
      statusEn: status === 'completed' ? 'Completed' : 'Ongoing',
      statusUr: status === 'completed' ? 'U.UcU.U,' : 'OO OUO',
      image: row.image_url || '/assets/appeal1.webp',
      progress,
      date: dateStr,
    };
  });
}

export async function getEvents(): Promise<any[]> {
  const { data, error } = await fetchApi<any[]>('/events');
  if (error || !data) return [];
  return data;
}

export async function getNews(): Promise<any[]> {
  const { data, error } = await fetchApi<any[]>('/news');
  if (error || !data) return [];
  return data;
}

// ---------------------------------------------------------
// The following currently return purely mock data.
// Replace with actual fetch calls when the backend is ready.
// ---------------------------------------------------------

export async function getCampaigns(): Promise<Campaign[]> {
  return mockCampaigns;
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  return mockTeam;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  return mockTestimonials;
}

export async function getGalleryItems(): Promise<GalleryItem[]> {
  return [];
}

export async function getImpactStories(): Promise<ImpactStory[]> {
  return mockStories;
}
