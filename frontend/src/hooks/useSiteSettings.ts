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
  logo_url: '/assets/logos/horizontal-main-logo-teal.svg',
  logo_url_white: '/assets/logos/horizontal-main-logo-white.svg',
  contact_email: 'info@iocaworld.org',
  contact_phone: '+92 346 8182838',
  contact_address: 'IOCA Head Office, House No. 190, Street No. 08, Sector-S, Sheikh Maltoon Town Mardan.',
  facebook_url: 'https://www.facebook.com/profile.php?id=61591926238691',
  instagram_url: 'https://www.instagram.com/ioca_org',
  linkedin_url: 'https://www.linkedin.com/company/ioca-org',
  tiktok_url: 'https://www.tiktok.com/@ioca_org',
  twitter_url: 'https://x.com/ioca_org',
  hero_mode: 'static',
  hero_headline_en: 'Transforming\nCommunities',
  hero_headline_ur: 'تبدیلی لا رہے ہیں',
  hero_subheadline_en: 'We are a community advancement organization dedicated to empowering marginalized youth and women through equal access to education, healthcare, and livelihood opportunities.',
  hero_subheadline_ur: 'ایک زندگی، ایک کمیونٹی',
  hero_eyebrow_en: '',
  hero_eyebrow_ur: '',
  hero_cta_primary_text_en: 'Donate Now',
  hero_cta_primary_text_ur: 'عطیہ کریں',
  hero_cta_primary_url: '/donate',
  hero_cta_secondary_text_en: 'Explore Programs →',
  hero_cta_secondary_text_ur: 'پروگرامز دیکھیں ←',
  hero_cta_secondary_url: '/programs',
  hero_static_image_url: 'https://pub-08bf957adb3447a5b4574c3d9713558c.r2.dev/ioca/settings/w56r8dyx5mtrh3s8c.webp',
  hero_slides: '[]',
  maintenance_mode: 'false',
  about_hero_image_url: 'https://pub-08bf957adb3447a5b4574c3d9713558c.r2.dev/ioca/settings/ostyfa4lvpgmu2id5f0.webp',
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

