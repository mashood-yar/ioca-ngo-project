import React from 'react';
import SEO from '../components/SEO';
import { ShieldCheck } from 'lucide-react';

interface ZakatPolicyProps {
  isUrdu: boolean;
}

const ZakatPolicy: React.FC<ZakatPolicyProps> = ({ isUrdu }) => {
  return (
    <>
      <SEO 
        title={isUrdu ? 'زکوٰۃ پالیسی | IOCA' : 'Zakat Policy | IOCA'}
        description="IOCA Zakat Policy"
        isUrdu={isUrdu}
      />
      <div className="py-24 md:py-32 bg-brand-gray min-h-[70vh] flex items-center justify-center">
        <div className="max-w-3xl mx-auto px-4 md:px-8 text-center">
          <div className="w-16 h-16 mx-auto bg-brand-teal/10 rounded-2xl flex items-center justify-center mb-6">
            <ShieldCheck className="w-8 h-8 text-brand-teal" />
          </div>
          <h1 className={`text-3xl md:text-5xl font-bold text-brand-navy mb-6 ${isUrdu ? 'font-urduHeading' : ''}`}>
            {isUrdu ? 'زکوٰۃ پالیسی' : 'Zakat Policy'}
          </h1>
          <div className={`bg-white p-8 md:p-12 rounded-2xl shadow-xl border-t-4 border-brand-teal text-left ${isUrdu ? 'text-right' : ''}`}>
            <p className={`text-lg text-brand-navy/70 leading-relaxed ${isUrdu ? 'font-urduBody' : ''}`}>
              {isUrdu 
                ? 'ہماری زکوٰۃ پالیسی کی مکمل دستاویز جلد ہی دستیاب ہوگی۔ ہم شرعی اصولوں کے مطابق 100% شفافیت کو یقینی بناتے ہیں۔' 
                : 'Our full Zakat Policy document is coming soon. We ensure 100% transparency and compliance with Shariah guidelines for all Zakat distributions.'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ZakatPolicy;
