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
      fetchPromise = fetchApi<SiteSettings>('/api/site-settings')
        .then(({ data }) => {
          if (data) {
            cachedSettings = { ...DEFAULTS, ...data };
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
