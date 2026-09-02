import React from 'react';
import { useSiteSettings } from '../hooks/useSiteSettings';
import SEO from './SEO';
import { Mail, Phone } from 'lucide-react';

export const MaintenanceScreen: React.FC<{ isUrdu: boolean }> = ({ isUrdu }) => {
  const { settings } = useSiteSettings();

  return (
    <div className={`min-h-screen bg-brand-gray flex flex-col items-center justify-center p-4 ${isUrdu ? 'font-urduBody' : 'font-sans'}`} dir={isUrdu ? 'rtl' : 'ltr'}>
      <SEO title="Maintenance | IOCA" description="We are currently upgrading our website." isUrdu={isUrdu} />
      
      <div className="max-w-xl w-full bg-white p-8 md:p-12 rounded-2xl shadow-xl border border-brand-navy/10 text-center space-y-8">
        <div className="flex justify-center">
          {settings.logo_url ? (
            <img src={settings.logo_url} alt="IOCA Logo" className="h-20 object-contain" />
          ) : (
            <span className="text-3xl font-extrabold text-brand-navy">IOCA</span>
          )}
        </div>

        <div className="space-y-4">
          <h1 className={`text-3xl font-bold text-brand-navy ${isUrdu ? 'font-urduHeading' : ''}`}>
            {isUrdu ? 'ویب سائٹ اپ ڈیٹ ہو رہی ہے' : 'We are upgrading our website'}
          </h1>
          <p className="text-brand-navy/70 leading-relaxed text-lg">
            {isUrdu
              ? 'ہماری ویب سائٹ پر کچھ اہم تبدیلیاں کی جا رہی ہیں۔ براہ کرم کچھ دیر بعد دوبارہ کوشش کریں۔ ہم جلد ہی واپس آئیں گے!'
              : 'Our website is currently undergoing scheduled maintenance. We are making some important improvements and will be back online shortly. Thank you for your patience!'}
          </p>
        </div>

        <div className="pt-8 border-t border-brand-navy/10 space-y-4">
          <p className="text-sm font-semibold text-brand-navy/50 uppercase tracking-widest">
            {isUrdu ? 'ہم سے رابطہ کریں' : 'Contact Us'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
            {settings.contact_email && (
              <a href={`mailto:${settings.contact_email}`} className="flex items-center gap-2 text-brand-teal hover:text-brand-navy transition-colors font-medium">
                <Mail className="w-5 h-5" />
                {settings.contact_email}
              </a>
            )}
            {settings.contact_phone && (
              <a href={`tel:${settings.contact_phone}`} className="flex items-center gap-2 text-brand-teal hover:text-brand-navy transition-colors font-medium" dir="ltr">
                <Phone className="w-5 h-5" />
                {settings.contact_phone}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
