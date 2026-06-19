import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, MapPin, Mail, Phone } from 'lucide-react';

interface FooterProps {
  isUrdu: boolean;
}

const Footer: React.FC<FooterProps> = ({ isUrdu }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Backend dev to integrate newsletter API here
    console.log('Newsletter signup:', email);
    setSubscribed(true);
    setEmail('');
  };

  return (
    <footer className="bg-brand-navy text-brand-white pt-20 md:pt-32 pb-8 px-4 md:px-16 rounded-t-[3rem] mt-[-3rem] relative z-20 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
        aria-hidden="true"
        style={{ backgroundImage: 'url("/assets/pattern-jali-accent.webp")', backgroundSize: '200px' }}
      />
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12 mb-16">
          {/* Brand Column */}
          <div className="md:col-span-2 flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start mb-6">
              <img src="/assets/logos/vertical-main-logo-white.webp" alt="IOCA Logo" className="h-32 md:h-40 w-auto object-contain" loading="lazy" decoding="async" width={160} height={160} />
            </div>
            <p className={`text-brand-white/70 text-lg max-w-sm leading-relaxed mb-6 mx-auto md:mx-0 ${isUrdu ? 'font-urduBody' : ''}`}>
              {isUrdu
                ? 'آئی او سی اے (انٹرنیشنل آرگنائزیشن فار کمیونٹی ایڈوانسمنٹ) کے ساتھ مل کر ہم ایک روشن کل بنا سکتے ہیں۔'
                : 'Together with IOCA (International Organization For Community Advancement), we can build a future full of possibilities.'}
            </p>
            <div className="space-y-4 pt-6">
              <div className="flex items-center gap-3 text-sm text-brand-white/90 bg-white/5 p-3 rounded-xl border border-white/10 w-fit mx-auto md:mx-0">
                <ShieldCheck className="w-5 h-5 text-brand-gold shrink-0" />
                <span className="font-medium">{isUrdu ? 'PCP (پاکستان سینٹر فار فلانتھروپی) سے تصدیق شدہ' : 'PCP (Pakistan Centre for Philanthropy) Certified'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-brand-white/90 bg-white/5 p-3 rounded-xl border border-white/10 w-fit mx-auto md:mx-0">
                <CheckCircle2 className="w-5 h-5 text-brand-gold shrink-0" />
                <span className="font-medium">{isUrdu ? 'FBR ٹیکس سے مستثنیٰ حیثیت سیکشن 2(36)(c)' : 'FBR Tax Exempt Status under Section 2(36)(c)'}</span>
              </div>
            </div>

            {/* Social Media */}
            <div className="flex gap-3 mt-6 mx-auto md:mx-0">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-brand-teal hover:border-brand-teal hover:text-brand-white transition-all">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-brand-teal hover:border-brand-teal hover:text-brand-white transition-all">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" /></svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-brand-teal hover:border-brand-teal hover:text-brand-white transition-all">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-brand-teal hover:border-brand-teal hover:text-brand-white transition-all">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className={`font-bold text-xl mb-6 text-brand-gold ${isUrdu ? 'font-urduHeading' : ''}`}>{isUrdu ? 'اہم لنکس' : 'Quick Links'}</h4>
            <ul className="space-y-3 text-brand-white/80">
              <li><Link to="/about" className="hover:text-brand-gold transition-colors">{isUrdu ? 'ہمارے بارے میں' : 'About Us'}</Link></li>
              <li><Link to="/programs" className="hover:text-brand-gold transition-colors">{isUrdu ? 'پروگرامز' : 'Programs'}</Link></li>
              <li><Link to="/projects" className="hover:text-brand-gold transition-colors">{isUrdu ? 'پروجیکٹس' : 'Projects'}</Link></li>
              <li><Link to="/impact-stories" className="hover:text-brand-gold transition-colors">{isUrdu ? 'کہانیاں' : 'Impact Stories'}</Link></li>
              <li><Link to="/volunteer" className="hover:text-brand-gold transition-colors">{isUrdu ? 'رضاکار' : 'Volunteer'}</Link></li>
              <li><Link to="/donate" className="hover:text-brand-gold transition-colors font-bold text-brand-gold">{isUrdu ? 'عطیہ کریں' : 'Donate'}</Link></li>
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h4 className={`font-bold text-xl mb-6 text-brand-gold ${isUrdu ? 'font-urduHeading' : ''}`}>{isUrdu ? 'رابطہ کریں' : 'Contact Us'}</h4>
            <ul className="space-y-5 text-brand-white/80">
              <li className="flex items-start gap-3 group">
                <MapPin className="w-5 h-5 shrink-0 mt-1 text-brand-gold group-hover:scale-110 transition-transform" />
                <span className="leading-relaxed">
                  {isUrdu ? 'IOCA ہیڈ آفس، لاہور، پاکستان' : 'IOCA Head Office,\nLahore, Pakistan'}
                </span>
              </li>
              <li className="flex items-center gap-3 group">
                <Phone className="w-5 h-5 text-brand-gold group-hover:scale-110 transition-transform shrink-0" />
                <a href="tel:+924235761234" className="hover:text-white transition-colors">+92 42 3576 1234</a>
              </li>
              <li className="flex items-center gap-3 group">
                <Mail className="w-5 h-5 text-brand-gold group-hover:scale-110 transition-transform shrink-0" />
                <a href="mailto:info@ioca.org" className="hover:text-white transition-colors">info@ioca.org</a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className={`font-bold text-xl mb-6 text-brand-gold ${isUrdu ? 'font-urduHeading' : ''}`}>{isUrdu ? 'نیوز لیٹر' : 'Newsletter'}</h4>
            <p className="text-sm text-brand-white/70 mb-6 leading-relaxed">
              {isUrdu ? 'تازہ ترین اپ ڈیٹس اور اثرات کی رپورٹس کے لیے سبسکرائب کریں۔' : 'Subscribe for updates on our impact and urgent appeals.'}
            </p>
            {subscribed ? (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <CheckCircle2 className="w-8 h-8 text-brand-gold mx-auto mb-2" />
                <p className="text-sm text-brand-white/90 font-medium">
                  {isUrdu ? 'شکریہ! آپ نے سبسکرائب کر لیا ہے۔' : 'Thank you! You\'re subscribed.'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col gap-3">
                <label htmlFor="newsletter-email" className="sr-only">
                  {isUrdu ? 'ای میل ایڈریس' : 'Email address'}
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isUrdu ? 'آپ کا ای میل' : 'Your email address'}
                  className="bg-white/5 border border-white/20 rounded-full px-5 py-3.5 text-sm focus:outline-none focus:border-brand-gold focus:bg-white/10 transition-all placeholder:text-brand-white/40"
                />
                <button
                  type="submit"
                  className="bg-brand-teal text-brand-white font-bold py-3.5 rounded-full hover:opacity-90 transition-opacity shadow-lg shadow-brand-teal/20"
                >
                  {isUrdu ? 'سبسکرائب' : 'Subscribe'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-brand-white/50">
          <p>&copy; {new Date().getFullYear()} IOCA. {isUrdu ? 'تمام حقوق محفوظ ہیں۔' : 'All rights reserved.'}</p>
          <div className="flex flex-wrap justify-center gap-6 font-medium">
            <Link to="/privacy" className="hover:text-brand-gold transition-colors">{isUrdu ? 'رازداری کی پالیسی' : 'Privacy Policy'}</Link>
            <Link to="/terms" className="hover:text-brand-gold transition-colors">{isUrdu ? 'شرائط و ضوابط' : 'Terms of Service'}</Link>
            <Link to="/zakat-policy" className="hover:text-brand-gold transition-colors">{isUrdu ? 'زکوٰۃ پالیسی' : 'Zakat Policy'}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
