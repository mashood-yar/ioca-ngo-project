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
  hero_headline_ur: 'Ù¾Ø§Ú©Ø³ØªØ§Ù† Ù…ÛŒÚº ØªØ¨Ø¯ÛŒÙ„ÛŒ Ù„Ø§ Ø±ÛÛ’ ÛÛŒÚº',
  hero_subheadline_en: 'Across Pakistan â€” One Life at a Time',
  hero_subheadline_ur: 'Ø§ÛŒÚ© Ø²Ù†Ø¯Ú¯ÛŒØŒ Ø§ÛŒÚ© Ú©Ù…ÛŒÙˆÙ†Ù¹ÛŒ',
  hero_eyebrow_en: 'PCP Certified NGO â€” Since 2004',
  hero_eyebrow_ur: 'PCP Ù…ØµØ¯Ù‚Û Ø§ÛŒÙ† Ø¬ÛŒ Ø§Ùˆ',
  hero_cta_primary_text_en: 'Donate Now',
  hero_cta_primary_text_ur: 'Ø¹Ø·ÛŒÛ Ú©Ø±ÛŒÚº',
  hero_cta_primary_url: '/donate',
  hero_cta_secondary_text_en: 'Explore Programs â†’',
  hero_cta_secondary_text_ur: 'Ù¾Ø±ÙˆÚ¯Ø±Ø§Ù…Ø² Ø¯ÛŒÚ©Ú¾ÛŒÚº â†',
  hero_cta_secondary_url: '/programs',
  hero_static_image_url: '/assets/hero-slider/service-to-humanity.webp',
  hero_slides: '[{"url":"/assets/hero-slider/service-to-humanity.webp","alt_en":"Volunteers serving the community","alt_ur":"Ø±Ø¶Ø§Ú©Ø§Ø± Ú©Ù…ÛŒÙˆÙ†Ù¹ÛŒ Ú©ÛŒ Ø®Ø¯Ù…Øª Ú©Ø± Ø±ÛÛ’ ÛÛŒÚº"},{"url":"/assets/hero-slider/a-ray-of-hope.webp","alt_en":"A ray of hope","alt_ur":"Ø§Ù…ÛŒØ¯ Ú©ÛŒ Ú©Ø±Ù†"},{"url":"/assets/hero-slider/a-healthy-society.webp","alt_en":"Building a healthy society","alt_ur":"ØµØ­Øª Ù…Ù†Ø¯ Ù…Ø¹Ø§Ø´Ø±Û’ Ú©ÛŒ ØªØ¹Ù…ÛŒØ±"}]',
  maintenance_mode: 'false',
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

