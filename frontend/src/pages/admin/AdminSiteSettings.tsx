import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import { fetchApi } from '../../lib/apiClient';
import { useCloudinaryUpload } from '../../hooks/useCloudinaryUpload';
import { useSiteSettings, invalidateSiteSettingsCache } from '../../hooks/useSiteSettings';
import { optimizeImage } from '../../lib/optimizeImage';

export function AdminSiteSettings() {
  const { settings: initialSettings, loading: initialLoading } = useSiteSettings();
  const [activeTab, setActiveTab] = useState<'general' | 'logo' | 'contact' | 'social' | 'hero'>('general');
  
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const { upload, uploading } = useCloudinaryUpload();

  useEffect(() => {
    if (initialSettings && !initialLoading) {
      setFormData(initialSettings);
    }
  }, [initialSettings, initialLoading]);

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Find what changed
      const updates: Record<string, string> = {};
      for (const [k, v] of Object.entries(formData)) {
        if (v !== initialSettings[k]) {
          updates[k] = v;
        }
      }

      if (Object.keys(updates).length > 0) {
        await fetchApi('/site-settings', {
          method: 'PATCH',
          body: JSON.stringify(updates),
        });
        invalidateSiteSettingsCache();
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Settings saved successfully', variant: 'success' }}));
      }
    } catch (err: any) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: err.message || 'Error saving settings', variant: 'error' }}));
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    try {
      const uploadResult = await upload(file, 'ioca/settings');
      if (uploadResult) {
        handleChange(key, uploadResult.url);
      }
    } catch (err: any) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: err.message || 'Upload failed', variant: 'error' }}));
    } finally {
      setSaving(false);
    }
  };

  const handleSlideUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    try {
      const uploadResult = await upload(file, 'ioca/hero');
      if (uploadResult) {
        const currentSlides = formData.hero_slides ? JSON.parse(formData.hero_slides) : [];
        const newSlide = { url: uploadResult.url, alt_en: 'New Slide', alt_ur: 'Ù†ÛŒØ§ Ø³Ù„Ø§Ø¦ÛŒÚˆ' };
        handleChange('hero_slides', JSON.stringify([...currentSlides, newSlide]));
      }
    } catch (err: any) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: err.message || 'Upload failed', variant: 'error' }}));
    } finally {
      setSaving(false);
    }
  };

  const updateSlide = (index: number, key: string, value: string) => {
    const currentSlides = formData.hero_slides ? JSON.parse(formData.hero_slides) : [];
    currentSlides[index][key] = value;
    handleChange('hero_slides', JSON.stringify(currentSlides));
  };

  const deleteSlide = (index: number) => {
    const currentSlides = formData.hero_slides ? JSON.parse(formData.hero_slides) : [];
    currentSlides.splice(index, 1);
    handleChange('hero_slides', JSON.stringify(currentSlides));
  };

  const moveSlide = (index: number, direction: -1 | 1) => {
    const currentSlides = formData.hero_slides ? JSON.parse(formData.hero_slides) : [];
    if (index + direction < 0 || index + direction >= currentSlides.length) return;
    
    const temp = currentSlides[index];
    currentSlides[index] = currentSlides[index + direction];
    currentSlides[index + direction] = temp;
    
    handleChange('hero_slides', JSON.stringify(currentSlides));
  };

  if (initialLoading) {
    return <div className="animate-pulse h-64 bg-gray-100 rounded-lg"></div>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">Site Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage global website configuration, logos, and hero section.</p>
      </div>

      <div className="flex space-x-1 border-b border-gray-200 overflow-x-auto">
          {[
            { id: 'general', label: 'General / Status' },
            { id: 'hero', label: 'Hero Section' },
          { id: 'logo', label: 'Logos & Branding' },
          { id: 'contact', label: 'Contact Info' },
          { id: 'social', label: 'Social Links' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-brand-teal text-brand-teal'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        
        {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Site Status</h3>
                <p className="text-sm text-gray-500 mb-4">Enable maintenance mode to temporarily hide the public site from visitors. (Admins can still view the site).</p>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.maintenance_mode === 'true'}
                    onChange={(e) => handleChange('maintenance_mode', e.target.checked ? 'true' : 'false')}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-teal/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    {formData.maintenance_mode === 'true' ? 'Maintenance Mode is ACTIVE' : 'Maintenance Mode is OFF'}
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* HERO TAB */}
        {activeTab === 'hero' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Hero Mode</h3>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="hero_mode" value="slideshow" checked={formData.hero_mode === 'slideshow'} onChange={e => handleChange('hero_mode', e.target.value)} className="text-brand-teal focus:ring-brand-teal" />
                  <span className="text-sm font-medium">Slideshow (Multiple Images)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="hero_mode" value="static" checked={formData.hero_mode === 'static'} onChange={e => handleChange('hero_mode', e.target.value)} className="text-brand-teal focus:ring-brand-teal" />
                  <span className="text-sm font-medium">Static (Single Image)</span>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Text Content</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Eyebrow (English)</label>
                  <input type="text" value={formData.hero_eyebrow_en || ''} onChange={e => handleChange('hero_eyebrow_en', e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Eyebrow (Urdu)</label>
                  <input type="text" value={formData.hero_eyebrow_ur || ''} onChange={e => handleChange('hero_eyebrow_ur', e.target.value)} className="w-full px-3 py-2 border rounded-md" dir="rtl" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Headline (English)</label>
                  <input type="text" value={formData.hero_headline_en || ''} onChange={e => handleChange('hero_headline_en', e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Headline (Urdu)</label>
                  <input type="text" value={formData.hero_headline_ur || ''} onChange={e => handleChange('hero_headline_ur', e.target.value)} className="w-full px-3 py-2 border rounded-md" dir="rtl" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Sub-headline (English)</label>
                  <input type="text" value={formData.hero_subheadline_en || ''} onChange={e => handleChange('hero_subheadline_en', e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Sub-headline (Urdu)</label>
                  <input type="text" value={formData.hero_subheadline_ur || ''} onChange={e => handleChange('hero_subheadline_ur', e.target.value)} className="w-full px-3 py-2 border rounded-md" dir="rtl" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Call to Action (Primary)</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Label (English)</label>
                  <input type="text" value={formData.hero_cta_primary_text_en || ''} onChange={e => handleChange('hero_cta_primary_text_en', e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Label (Urdu)</label>
                  <input type="text" value={formData.hero_cta_primary_text_ur || ''} onChange={e => handleChange('hero_cta_primary_text_ur', e.target.value)} className="w-full px-3 py-2 border rounded-md" dir="rtl" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">URL</label>
                  <input type="text" value={formData.hero_cta_primary_url || ''} onChange={e => handleChange('hero_cta_primary_url', e.target.value)} className="w-full px-3 py-2 border rounded-md" placeholder="/donate" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Call to Action (Secondary)</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Label (English)</label>
                  <input type="text" value={formData.hero_cta_secondary_text_en || ''} onChange={e => handleChange('hero_cta_secondary_text_en', e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Label (Urdu)</label>
                  <input type="text" value={formData.hero_cta_secondary_text_ur || ''} onChange={e => handleChange('hero_cta_secondary_text_ur', e.target.value)} className="w-full px-3 py-2 border rounded-md" dir="rtl" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">URL</label>
                  <input type="text" value={formData.hero_cta_secondary_url || ''} onChange={e => handleChange('hero_cta_secondary_url', e.target.value)} className="w-full px-3 py-2 border rounded-md" placeholder="/programs" />
                </div>
              </div>
            </div>

            {formData.hero_mode === 'static' ? (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Static Image Background</h3>
                <div className="flex gap-4 items-end">
                  {formData.hero_static_image_url && (
                    <img src={optimizeImage(formData.hero_static_image_url, { width: 300 })} alt="Static Background" className="h-32 rounded-lg object-cover" />
                  )}
                  <div className="flex-1">
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'hero_static_image_url')} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-teal/10 file:text-brand-teal hover:file:bg-brand-teal/20" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-lg font-semibold text-gray-900">Slideshow Images</h3>
                  <label className="cursor-pointer bg-brand-teal/10 text-brand-teal px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-brand-teal/20 flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Add Slide
                    <input type="file" accept="image/*" onChange={handleSlideUpload} className="hidden" />
                  </label>
                </div>
                
                <div className="space-y-3">
                  {(formData.hero_slides ? JSON.parse(formData.hero_slides) : []).map((slide: any, idx: number) => (
                    <div key={idx} className="flex gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200 items-start">
                      <div className="flex flex-col gap-1 items-center mt-2">
                        <button type="button" onClick={() => moveSlide(idx, -1)} disabled={idx === 0} className="text-gray-400 hover:text-brand-teal disabled:opacity-30">â–²</button>
                        <span className="text-xs font-bold text-gray-400">{idx + 1}</span>
                        <button type="button" onClick={() => moveSlide(idx, 1)} disabled={idx === (JSON.parse(formData.hero_slides).length - 1)} className="text-gray-400 hover:text-brand-teal disabled:opacity-30">â–¼</button>
                      </div>
                      <img src={optimizeImage(slide.url, { width: 200 })} alt="Slide Preview" className="w-32 h-20 object-cover rounded shadow-sm" />
                      <div className="flex-1 space-y-2">
                        <input type="text" value={slide.alt_en} onChange={e => updateSlide(idx, 'alt_en', e.target.value)} placeholder="Alt Text (English)" className="w-full px-2 py-1 text-sm border rounded" />
                        <input type="text" value={slide.alt_ur} onChange={e => updateSlide(idx, 'alt_ur', e.target.value)} placeholder="Alt Text (Urdu)" className="w-full px-2 py-1 text-sm border rounded" dir="rtl" />
                      </div>
                      <button type="button" onClick={() => deleteSlide(idx)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  {(!formData.hero_slides || JSON.parse(formData.hero_slides).length === 0) && (
                    <div className="text-center py-8 text-gray-400 text-sm">No slides added. Click "Add Slide" to upload one.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* LOGO TAB */}
        {activeTab === 'logo' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Main Logo (Colored for light backgrounds)</label>
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gray-100 rounded-lg border border-gray-200">
                    <img src={optimizeImage(formData.logo_url, { width: 200 })} alt="Main Logo" className="h-12 object-contain" />
                  </div>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo_url')} className="text-sm" />
                </div>
              </div>
              
              <hr />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">White Logo (For dark backgrounds)</label>
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-brand-navy rounded-lg border border-gray-200">
                    <img src={optimizeImage(formData.logo_url_white, { width: 200 })} alt="White Logo" className="h-12 object-contain" />
                  </div>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo_url_white')} className="text-sm" />
                </div>
              </div>
              
              <hr />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Favicon (Browser Tab Icon - .ico, .png, .svg)</label>
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gray-100 rounded-lg border border-gray-200">
                    {formData.favicon_url ? (
                      <img src={optimizeImage(formData.favicon_url, { width: 64 })} alt="Favicon" className="h-8 w-8 object-contain" />
                    ) : (
                      <span className="text-gray-400 text-sm">None</span>
                    )}
                  </div>
                  <input type="file" accept="image/*,.ico" onChange={(e) => handleImageUpload(e, 'favicon_url')} className="text-sm" />
                </div>
              </div>

              <hr />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hero Logo Icon (Shown in the Home Page Banner)</label>
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-brand-navy rounded-lg border border-gray-200">
                    {formData.hero_icon_url ? (
                      <img src={optimizeImage(formData.hero_icon_url, { width: 200 })} alt="Hero Icon" className="h-12 object-contain" />
                    ) : (
                      <span className="text-white/50 text-sm">None</span>
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'hero_icon_url')} className="text-sm" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONTACT INFO TAB */}
        {activeTab === 'contact' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Contact Email</label>
              <input type="email" value={formData.contact_email || ''} onChange={e => handleChange('contact_email', e.target.value)} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
              <input type="text" value={formData.contact_phone || ''} onChange={e => handleChange('contact_phone', e.target.value)} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Physical Address</label>
              <textarea value={formData.contact_address || ''} onChange={e => handleChange('contact_address', e.target.value)} className="w-full px-3 py-2 border rounded-md" rows={3}></textarea>
            </div>
          </div>
        )}

        {/* SOCIAL LINKS TAB */}
        {activeTab === 'social' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Facebook URL</label>
              <input type="url" value={formData.facebook_url || ''} onChange={e => handleChange('facebook_url', e.target.value)} className="w-full px-3 py-2 border rounded-md" placeholder="https://facebook.com/..." />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Instagram URL</label>
              <input type="url" value={formData.instagram_url || ''} onChange={e => handleChange('instagram_url', e.target.value)} className="w-full px-3 py-2 border rounded-md" placeholder="https://instagram.com/..." />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">LinkedIn URL</label>
              <input type="url" value={formData.linkedin_url || ''} onChange={e => handleChange('linkedin_url', e.target.value)} className="w-full px-3 py-2 border rounded-md" placeholder="https://linkedin.com/..." />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">TikTok URL</label>
              <input type="url" value={formData.tiktok_url || ''} onChange={e => handleChange('tiktok_url', e.target.value)} className="w-full px-3 py-2 border rounded-md" placeholder="https://tiktok.com/..." />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">X (Twitter) URL</label>
              <input type="url" value={formData.twitter_url || ''} onChange={e => handleChange('twitter_url', e.target.value)} className="w-full px-3 py-2 border rounded-md" placeholder="https://x.com/..." />
            </div>
          </div>
        )}

        <div className="pt-6 border-t flex justify-end">
          <button
            type="submit"
            disabled={saving || uploading}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-navy text-white rounded-lg font-medium hover:bg-brand-navy/90 transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving || uploading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}



