import React from 'react';
import SEO from '../components/SEO';
import { ShieldCheck } from 'lucide-react';

interface PrivacyPolicyProps {
  isUrdu: boolean;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ isUrdu }) => {
  return (
    <>
      <SEO 
        title={isUrdu ? 'رازداری کی پالیسی | IOCA' : 'Privacy Policy | IOCA'}
        description="IOCA Privacy Policy"
        isUrdu={isUrdu}
      />
      <div className="py-24 md:py-32 bg-brand-gray min-h-[70vh] flex items-center justify-center">
        <div className="max-w-3xl mx-auto px-4 md:px-8 text-center">
          <div className="w-16 h-16 mx-auto bg-brand-teal/10 rounded-2xl flex items-center justify-center mb-6">
            <ShieldCheck className="w-8 h-8 text-brand-teal" />
          </div>
          <h1 className={`text-3xl md:text-5xl font-bold text-brand-navy mb-6 ${isUrdu ? 'font-urduHeading' : ''}`}>
            {isUrdu ? 'رازداری کی پالیسی' : 'Privacy Policy'}
          </h1>
          <div className={`bg-white p-8 md:p-12 rounded-2xl shadow-xl border-t-4 border-brand-teal text-left ${isUrdu ? 'text-right' : ''}`}>
            <p className={`text-lg text-brand-navy/70 leading-relaxed ${isUrdu ? 'font-urduBody' : ''}`}>
              {isUrdu 
                ? 'ہماری مکمل رازداری کی پالیسی کی دستاویز جلد ہی دستیاب ہوگی۔ ہم آپ کے ڈیٹا کی حفاظت اور رازداری کو انتہائی اہمیت دیتے ہیں۔' 
                : 'Our full Privacy Policy document is coming soon. We take your data protection and privacy very seriously and are currently finalizing our comprehensive policy guidelines.'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicy;
