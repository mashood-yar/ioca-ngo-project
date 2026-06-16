import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Target, Eye, Users, ShieldCheck, Heart, Lightbulb, UsersRound, ArrowRight, Mail } from 'lucide-react';
import { teamMembers } from '../data/mockData';

interface AboutProps {
  isUrdu: boolean;
}

const About: React.FC<AboutProps> = ({ isUrdu }) => {

  const values = [
    {
      icon: <ShieldCheck className="w-8 h-8 text-brand-teal" />,
      titleEn: 'Transparency',
      titleUr: 'شفافیت',
      descEn: 'Every rupee is tracked and publicly reported. We maintain open books and annual audits.',
      descUr: 'ہر روپے کا حساب رکھا جاتا ہے اور عوامی طور پر رپورٹ کیا جاتا ہے۔ ہم کھلے کھاتے اور سالانہ آڈٹ رکھتے ہیں۔',
    },
    {
      icon: <Heart className="w-8 h-8 text-brand-teal" />,
      titleEn: 'Compassion',
      titleUr: 'شفقت',
      descEn: 'We serve with empathy, treating every beneficiary with dignity and genuine care.',
      descUr: 'ہم ہمدردی کے ساتھ خدمت کرتے ہیں، ہر مستفید کے ساتھ عزت اور حقیقی دیکھ بھال سے پیش آتے ہیں۔',
    },
    {
      icon: <Lightbulb className="w-8 h-8 text-brand-teal" />,
      titleEn: 'Innovation',
      titleUr: 'جدت',
      descEn: 'We embrace creative solutions - from solar-powered clinics to digital literacy bootcamps.',
      descUr: 'ہم تخلیقی حل اپناتے ہیں - شمسی توانائی والے کلینکس سے لے کر ڈیجیٹل خواندگی بوٹ کیمپس تک۔',
    },
    {
      icon: <UsersRound className="w-8 h-8 text-brand-teal" />,
      titleEn: 'Community',
      titleUr: 'کمیونٹی',
      descEn: 'Lasting change happens from within. We empower local leaders to drive their own development.',
      descUr: 'پائیدار تبدیلی اندر سے آتی ہے۔ ہم مقامی رہنماؤں کو ان کی اپنی ترقی کے لیے بااختیار بناتے ہیں۔',
    },
  ];

  return (
    <>
      <Helmet>
        <title>{isUrdu ? 'ہمارے بارے میں | IOCA' : 'About Us | IOCA'}</title>
        <meta
          name="description"
          content={
            isUrdu
              ? 'IOCA کے مشن، وژن، اقدار اور ٹیم کے بارے میں جانیں۔ ہم پاکستان بھر میں کمیونٹیز کو بااختیار بنا رہے ہیں۔'
              : 'Learn about IOCA\'s mission, vision, values, and the dedicated team empowering communities across Pakistan.'
          }
        />
      </Helmet>

      <div className="bg-brand-gray min-h-screen pb-24">
        {/* Hero Section */}
        <section className="relative h-[40vh] md:h-[50vh] flex items-center justify-center bg-brand-navy overflow-hidden">
          <div className="absolute inset-0 bg-black/50 z-10" />
          <img
            src="/assets/hero-community.webp"
            alt={isUrdu ? 'ہمارے بارے میں' : 'About IOCA'}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <motion.div
            className="relative z-20 text-center px-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className={`text-5xl md:text-7xl font-bold text-brand-white mb-4 ${isUrdu ? 'font-urduHeading' : ''}`}>
              {isUrdu ? 'ہمارے بارے میں' : 'About Us'}
            </h1>
            <p className={`text-xl text-brand-white/80 max-w-2xl mx-auto ${isUrdu ? 'font-urduBody' : ''}`}>
              {isUrdu
                ? 'ایک روشن اور خوشحال پاکستان کے لیے ہماری کاوشیں۔'
                : 'Dedicated to building a brighter, more prosperous Pakistan.'}
            </p>
          </motion.div>
        </section>

        {/* Mission & Vision */}
        <section className="max-w-7xl mx-auto px-4 md:px-16 py-20">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            <motion.div
              className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-brand-navy/5 flex flex-col items-center text-center"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-16 h-16 bg-brand-teal/10 rounded-full flex items-center justify-center mb-6">
                <Target className="w-8 h-8 text-brand-teal" />
              </div>
              <h2 className={`text-3xl font-bold text-brand-navy mb-4 ${isUrdu ? 'font-urduHeading' : ''}`}>
                {isUrdu ? 'ہمارا مشن' : 'Our Mission'}
              </h2>
              <p className={`text-brand-navy/70 leading-relaxed text-lg ${isUrdu ? 'font-urduBody' : ''}`}>
                {isUrdu
                  ? 'پسماندہ طبقات کو تعلیم، صحت اور روزگار کے مواقع فراہم کر کے ان کی زندگیوں میں مثبت تبدیلی لانا۔'
                  : 'To bring positive change to marginalized communities by providing access to education, healthcare, and livelihood opportunities.'}
              </p>
            </motion.div>

            <motion.div
              className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-brand-navy/5 flex flex-col items-center text-center"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <div className="w-16 h-16 bg-brand-gold/10 rounded-full flex items-center justify-center mb-6">
                <Eye className="w-8 h-8 text-brand-gold" />
              </div>
              <h2 className={`text-3xl font-bold text-brand-navy mb-4 ${isUrdu ? 'font-urduHeading' : ''}`}>
                {isUrdu ? 'ہمارا وژن' : 'Our Vision'}
              </h2>
              <p className={`text-brand-navy/70 leading-relaxed text-lg ${isUrdu ? 'font-urduBody' : ''}`}>
                {isUrdu
                  ? 'ایک ایسا معاشرہ جہاں ہر فرد کو برابری کے حقوق اور ترقی کے یکساں مواقع حاصل ہوں۔'
                  : 'A society where every individual has equal rights and access to equal opportunities for growth and development.'}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Our Values */}
        <section className="max-w-7xl mx-auto px-4 md:px-16 py-12">
          <div className="text-center mb-12">
            <h2 className={`text-4xl md:text-5xl font-bold text-brand-navy mb-4 ${isUrdu ? 'font-urduHeading' : ''}`}>
              {isUrdu ? 'ہماری اقدار' : 'Our Values'}
            </h2>
            <p className={`text-lg text-brand-navy/60 max-w-xl mx-auto ${isUrdu ? 'font-urduBody' : ''}`}>
              {isUrdu
                ? 'یہ اصول ہمارے ہر فیصلے اور ہر اقدام کی بنیاد ہیں۔'
                : 'These principles guide every decision we make and every action we take.'}
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {values.map((val, i) => (
              <motion.div
                key={val.titleEn}
                className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-lg border border-brand-navy/5 text-center flex flex-col items-center will-change-transform transform-gpu"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="w-14 h-14 bg-brand-teal/10 rounded-full flex items-center justify-center mb-4">
                  {val.icon}
                </div>
                <h3 className={`text-base md:text-xl font-bold text-brand-navy mb-2 ${isUrdu ? 'font-urduHeading' : ''}`}>
                  {isUrdu ? val.titleUr : val.titleEn}
                </h3>
                <p className={`text-xs md:text-sm text-brand-navy/70 leading-relaxed ${isUrdu ? 'font-urduBody' : ''}`}>
                  {isUrdu ? val.descUr : val.descEn}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Our Team - wired to mockData */}
        <section className="max-w-7xl mx-auto px-4 md:px-16 py-12">
          <div className="text-center mb-16">
            <Users className="w-12 h-12 text-brand-teal mx-auto mb-4" />
            <h2 className={`text-4xl md:text-5xl font-bold text-brand-navy mb-4 ${isUrdu ? 'font-urduHeading' : ''}`}>
              {isUrdu ? 'ہماری ٹیم' : 'Our Team'}
            </h2>
            <p className={`text-lg text-brand-navy/60 max-w-xl mx-auto ${isUrdu ? 'font-urduBody' : ''}`}>
              {isUrdu
                ? 'ان پرعزم لوگوں سے ملیں جو تبدیلی ممکن بنا رہے ہیں۔'
                : 'Meet the dedicated individuals making change possible.'}
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {teamMembers.map((member, i) => (
              <motion.div
                key={member.id}
                className="bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-lg border border-brand-navy/5 flex flex-col group will-change-transform transform-gpu"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="overflow-hidden">
                  <img
                    src={member.image}
                    alt={isUrdu ? member.nameUr : member.nameEn}
                    className="w-full h-36 md:h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="p-4 md:p-6 text-center flex-grow flex flex-col justify-center">
                  <h3 className={`text-sm md:text-xl font-bold text-brand-navy mb-1 ${isUrdu ? 'font-urduHeading' : ''}`}>
                    {isUrdu ? member.nameUr : member.nameEn}
                  </h3>
                  <p className={`text-xs md:text-sm text-brand-teal font-medium mb-2 ${isUrdu ? 'font-urduBody' : ''}`}>
                    {isUrdu ? member.positionUr : member.positionEn}
                  </p>
                  <p className={`text-xs text-brand-navy/60 hidden md:block ${isUrdu ? 'font-urduBody' : ''}`}>
                    {isUrdu ? member.bioUr : member.bioEn}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Bottom CTA Section */}
        <section className="max-w-7xl mx-auto px-4 md:px-16 py-16">
          <motion.div
            className="bg-brand-navy rounded-3xl p-8 md:p-16 text-center relative overflow-hidden will-change-transform transform-gpu"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
          >
            {/* Decorative jali pattern overlay */}
            <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[length:20px_20px]" />
            <div className="relative z-10">
              <h2 className={`text-3xl md:text-5xl font-bold text-brand-white mb-4 ${isUrdu ? 'font-urduHeading' : ''}`}>
                {isUrdu ? 'ہمارے ساتھ شامل ہوں' : 'Get Involved'}
              </h2>
              <p className={`text-lg text-brand-white/70 max-w-xl mx-auto mb-10 ${isUrdu ? 'font-urduBody' : ''}`}>
                {isUrdu
                  ? 'آپ کا وقت اور مہارت ہزاروں زندگیاں بدل سکتے ہیں۔ آج ہی ہمارے مشن کا حصہ بنیں۔'
                  : 'Your time and skills can transform thousands of lives. Become part of our mission today.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/volunteer"
                  className="inline-flex items-center justify-center gap-2 bg-brand-teal text-brand-white px-8 py-4 rounded-full font-bold text-lg hover:opacity-90 transition-opacity shadow-lg"
                >
                  {isUrdu ? 'رضاکار بنیں' : 'Join Our Team'}
                  <ArrowRight className={`w-5 h-5 ${isUrdu ? 'rotate-180' : ''}`} />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 text-brand-white border border-white/20 px-8 py-4 rounded-full font-bold text-lg hover:bg-white/20 transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  {isUrdu ? 'رابطہ کریں' : 'Get In Touch'}
                </Link>
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </>
  );
};

export default About;
