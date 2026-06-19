import React, { useState } from 'react';
import SEO from '../components/SEO';
import { motion } from 'framer-motion';
import { Heart, CreditCard, Building2, CheckCircle2, Shield, BookOpen } from 'lucide-react';

interface DonatePageProps {
  isUrdu: boolean;
  /** H1-08: accepts the selected amount so the modal can pre-populate it */
  onDonateClick: (amount: number | null, isMonthly?: boolean) => void;
}

const DonatePage: React.FC<DonatePageProps> = ({ isUrdu, onDonateClick }) => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(5000);
  const [customAmount, setCustomAmount] = useState('');
  const [isMonthly, setIsMonthly] = useState<boolean>(false);

  const presetAmounts = [1000, 2500, 5000, 10000, 25000, 50000];

  const handleDonate = () => {
    const amount = selectedAmount || parseInt(customAmount) || 0;
    if (amount > 0) {
      // H1-08: pass the actual amount so modal pre-selects it
      onDonateClick(amount, isMonthly);
    }
  };

  const benefits = [
    {
      icon: Shield,
      titleEn: '100% Transparent',
      titleUr: '100% شفاف',
      descEn: 'Every rupee is tracked and reported. Full financial transparency guaranteed.',
      descUr: 'ہر روپے کی نگرانی اور رپورٹنگ ہوتی ہے۔ مکمل مالی شفافیت کی ضمانت۔',
    },
    {
      icon: CheckCircle2,
      titleEn: 'Tax Deductible',
      titleUr: 'ٹیکس میں چھوٹ',
      descEn: 'IOCA is registered under FBR Section 2(36)(c). Your donation is tax-exempt.',
      descUr: 'IOCA FBR سیکشن 2(36)(c) کے تحت رجسٹرڈ ہے۔ آپ کا عطیہ ٹیکس سے مستثنیٰ ہے۔',
    },
    {
      icon: BookOpen,
      titleEn: 'Zakat Eligible',
      titleUr: 'زکوٰۃ کے لیے موزوں',
      descEn: 'Our programs are Shariah-compliant. Zakat and Sadaqah donations accepted.',
      descUr: 'ہمارے پروگرام شریعت کے مطابق ہیں۔ زکوٰۃ اور صدقہ کے عطیات قبول ہیں۔',
    },
  ];

  return (
    <>
      <SEO 
        title={isUrdu ? 'عطیہ کریں | IOCA' : 'Donate | IOCA'}
        description="Support IOCA's mission to transform communities in Pakistan. Your donation funds education, healthcare, and emergency relief programs."
        isUrdu={isUrdu}
      />

      <div className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-16">
          {/* Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className={`text-4xl md:text-6xl font-extrabold text-brand-navy mb-4 ${isUrdu ? 'font-urduHeading' : ''}`}>
              {isUrdu ? 'تبدیلی لانے میں ہماری مدد کریں' : 'Help Us Create Change'}
            </h1>
            <p className={`text-brand-navy/60 text-base md:text-lg max-w-2xl mx-auto ${isUrdu ? 'font-urduBody' : ''}`}>
              {isUrdu
                ? 'آپ کا ہر عطیہ ایک زندگی بدل سکتا ہے۔ تعلیم، صحت اور ہنگامی امداد - آپ کا تعاون سب سے زیادہ ضرورت مند لوگوں تک پہنچتا ہے۔'
                : 'Every donation has the power to change a life. From education to healthcare to emergency relief - your support reaches those who need it most.'}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            {/* Donation Card */}
            <motion.div
              className="lg:col-span-3 bg-brand-white rounded-xl p-8 md:p-10 shadow-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >


              {/* Frequency Toggle */}
              <div className="bg-brand-gray p-1.5 rounded-lg flex mb-8">
                <button
                  onClick={() => setIsMonthly(false)}
                  className={`flex-1 py-3 text-sm md:text-base font-bold rounded-md transition-all ${!isMonthly ? 'bg-white shadow-sm text-brand-navy' : 'text-brand-navy/60 hover:text-brand-navy'}`}
                >
                  {isUrdu ? 'ایک بار کا عطیہ' : 'One-time Donation'}
                </button>
                <button
                  onClick={() => setIsMonthly(true)}
                  className={`flex-1 py-3 text-sm md:text-base font-bold rounded-md transition-all ${isMonthly ? 'bg-white shadow-sm text-brand-navy' : 'text-brand-navy/60 hover:text-brand-navy'}`}
                >
                  {isUrdu ? 'ماہانہ عطیہ' : 'Monthly Donation'}
                </button>
              </div>

              {/* Amount Presets */}
              <h3 className={`font-bold text-brand-navy mb-4 ${isUrdu ? 'font-urduHeading' : ''}`}>
                {isUrdu ? 'رقم منتخب کریں' : 'Select Amount'}
              </h3>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {presetAmounts.map(amount => (
                  <button
                    key={amount}
                    onClick={() => { setSelectedAmount(amount); setCustomAmount(''); }}
                    className={`p-4 rounded-lg font-bold text-lg transition-all ${
                      selectedAmount === amount
                        ? 'bg-brand-teal text-white shadow-lg shadow-brand-teal/20 scale-105'
                        : 'bg-brand-gray text-brand-navy border border-brand-navy/10 hover:border-brand-teal/50'
                    }`}
                  >
                    Rs {amount.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Custom Amount */}
              <div className="mb-8">
                <label htmlFor="custom-amount" className={`block text-sm font-medium text-brand-navy mb-1.5 ${isUrdu ? 'font-urduBody' : ''}`}>
                  {isUrdu ? 'دوسری رقم درج کریں' : 'Or enter a custom amount'}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-navy/50 font-medium">Rs</span>
                  <input
                    id="custom-amount"
                    type="number"
                    min="100"
                    value={customAmount}
                    onChange={e => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                    placeholder="0"
                    className="w-full pl-12 pr-4 py-4 rounded-lg border border-brand-navy/10 bg-brand-gray focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal/20 transition-all text-lg font-bold"
                  />
                </div>
              </div>

              {/* Donate Button */}
              <button
                onClick={handleDonate}
                className="w-full bg-brand-teal text-brand-white font-bold py-4 rounded-lg text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-3 shadow-lg shadow-brand-teal/20"
              >
                <Heart className="w-5 h-5" />
                {isUrdu ? 'ابھی عطیہ کریں' : 'Donate Now'}
              </button>

              {/* Payment Methods */}
              <div className="mt-6 flex items-center justify-center gap-4 text-brand-navy/30">
                <CreditCard className="w-6 h-6" />
                <Building2 className="w-6 h-6" />
                <span className="text-xs">{isUrdu ? 'محفوظ ادائیگی' : 'Secure Payment'}</span>
              </div>
            </motion.div>

            {/* Benefits Cards */}
            <div className="lg:col-span-2 space-y-4">
              {benefits.map((benefit, idx) => {
                const Icon = benefit.icon;
                return (
                  <motion.div
                    key={idx}
                    className="bg-brand-white rounded-xl p-6 border border-brand-navy/5 hover:shadow-lg transition-shadow"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 + idx * 0.1 }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-brand-teal/10 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-brand-teal" />
                      </div>
                      <div>
                        <h3 className={`font-bold text-brand-navy mb-1 ${isUrdu ? 'font-urduHeading' : ''}`}>
                          {isUrdu ? benefit.titleUr : benefit.titleEn}
                        </h3>
                        <p className={`text-sm text-brand-navy/60 ${isUrdu ? 'font-urduBody' : ''}`}>
                          {isUrdu ? benefit.descUr : benefit.descEn}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DonatePage;
