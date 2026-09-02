import { useState, useEffect } from 'react';
import { fetchApi } from '../lib/apiClient';

interface SiteSettings {
  logo_url: string;
  logo_url_white: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  facebook_url: string;
  instagram_url: string;
  linkedin_url: string;
  [key: string]: string;
}

// Default fallbacks so the UI never breaks even before the API responds
const DEFAULTS: SiteSettings = {
  logo_url: '/assets/logos/horizontal-main-logo-teal.webp',
  logo_url_white: '/assets/logos/horizontal-main-logo-white.webp',
  contact_email: 'info@iocaworld.org',
  contact_phone: '+92 42 3576 1234',
  contact_address: 'IOCA Head Office, Lahore, Pakistan',
  facebook_url: 'https://www.facebook.com/ioca.official',
  instagram_url: 'https://www.instagram.com/ioca.official',
  linkedin_url: 'https://www.linkedin.com/company/ioca-official',
  hero_mode: 'slideshow',
  hero_headline_en: 'Transforming Communities',
  hero_headline_ur: 'پاکستان میں تبدیلی لا رہے ہیں',
  hero_subheadline_en: 'Across Pakistan — One Life at a Time',
  hero_subheadline_ur: 'ایک زندگی، ایک کمیونٹی',
  hero_eyebrow_en: 'PCP Certified NGO — Since 2004',
  hero_eyebrow_ur: 'PCP مصدقہ این جی او',
  hero_cta_primary_text_en: 'Donate Now',
  hero_cta_primary_text_ur: 'عطیہ کریں',
  hero_cta_primary_url: '/donate',
  hero_cta_secondary_text_en: 'Explore Programs →',
  hero_cta_secondary_text_ur: 'پروگرامز دیکھیں ←',
  hero_cta_secondary_url: '/programs',
  hero_static_image_url: '/assets/hero-slider/service-to-humanity.webp',
  hero_slides: '[{"url":"/assets/hero-slider/service-to-humanity.webp","alt_en":"Volunteers serving the community","alt_ur":"رضاکار کمیونٹی کی خدمت کر رہے ہیں"},{"url":"/assets/hero-slider/a-ray-of-hope.webp","alt_en":"A ray of hope","alt_ur":"امید کی کرن"},{"url":"/assets/hero-slider/a-healthy-society.webp","alt_en":"Building a healthy society","alt_ur":"صحت مند معاشرے کی تعمیر"}]',
};

// Module-level cache so we only fetch once per page load
let cachedSettings: SiteSettings | null = null;
let fetchPromise: Promise<void> | null = null;

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(cachedSettings ?? DEFAULTS);
  const [loading, setLoading] = useState(!cachedSettings);

  useEffect(() => {
    if (cachedSettings) {
      setSettings(cachedSettings);
      setLoading(false);
      return;
    }

    if (!fetchPromise) {
      fetchPromise = fetchApi<SiteSettings>('/site-settings')
        .then(({ data }) => {
          if (data) {
            cachedSettings = { ...DEFAULTS, ...data };
            
            // Dynamically update the favicon if a custom one is set
            if (data.favicon_url) {
              let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
              if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.head.appendChild(link);
              }
              link.href = data.favicon_url;
            }
          } else {
            cachedSettings = DEFAULTS;
          }
        })
        .catch(() => {
          // On error, fall back to defaults silently
          cachedSettings = DEFAULTS;
        });
    }

    fetchPromise.then(() => {
      setSettings(cachedSettings ?? DEFAULTS);
      setLoading(false);
    });
  }, []);

  return { settings, loading };
}

// Call this after a successful admin update to invalidate cache
export function invalidateSiteSettingsCache() {
  cachedSettings = null;
  fetchPromise = null;
}
