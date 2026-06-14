import { supabase, hasSupabaseConfig } from '../lib/supabase';
import type { 
  Project, 
  Program, 
  Campaign, 
  TeamMember, 
  Testimonial, 
  GalleryItem, 
  ImpactStory 
} from '../types';
import { 
  projects as mockProjects,
  programs as mockPrograms,
  campaigns as mockCampaigns,
  teamMembers as mockTeam,
  testimonials as mockTestimonials,
  galleryItems as mockGallery,
  impactStories as mockStories
} from '../data/mockData';

// ============================================================================
// API Service Layer
// Backend Developer (Sultan): Swap out these mock returns and Supabase calls
// with your actual backend API fetch calls (e.g., axios.get('/api/projects'))
// ============================================================================

export async function getProjects(): Promise<Project[]> {
  if (!hasSupabaseConfig) {
    return mockProjects;
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase error, falling back to mock projects.');
      return mockProjects;
    }

    return (data || []).map((row: any) => {
      const status = row.status === 'completed' ? 'completed' : 'ongoing';
      return {
        id: row.id,
        titleEn: row.title,
        titleUr: row.title,
        descEn: row.description,
        descUr: row.description,
        locationEn: '',
        locationUr: '',
        status,
        statusEn: status === 'completed' ? 'Completed' : 'Ongoing',
        statusUr: status === 'completed' ? 'مکمل' : 'جاری',
        date: new Date(row.created_at).toLocaleDateString(),
        image: row.image_url ?? '/assets/proj-education.webp',
        progress: status === 'completed' ? 100 : 50,
      };
    });
  } catch (err) {
    console.warn('Fetch error, falling back to mock projects.', err);
    return mockProjects;
  }
}

export async function getEvents(): Promise<any[]> {
  if (!hasSupabaseConfig) return [];
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });
    
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function getNews(): Promise<any[]> {
  if (!hasSupabaseConfig) return [];
  try {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------
// The following currently return purely mock data.
// Replace with actual fetch calls when the backend is ready.
// ---------------------------------------------------------

export async function getPrograms(): Promise<Program[]> {
  return mockPrograms;
}

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
  // Simulating a backend ORDER BY created_at DESC
  return [...mockGallery].reverse();
}

export async function getImpactStories(): Promise<ImpactStory[]> {
  return mockStories;
}
