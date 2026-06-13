import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

interface NotFoundProps {
  isUrdu: boolean;
}

const NotFound: React.FC<NotFoundProps> = ({ isUrdu }) => (
  <>
    <Helmet>
      <title>404 - Page Not Found | IOCA</title>
    </Helmet>
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-24">
      <img
        src="/assets/logos/logo-icon-teal.webp"
        alt="IOCA"
        className="h-20 mb-8 opacity-30"
      />
      <h1 className="text-8xl font-extrabold text-brand-navy/10 mb-4 select-none">404</h1>
      <h2 className={`text-2xl md:text-3xl font-bold text-brand-navy mb-3 ${isUrdu ? 'font-urduHeading' : ''}`}>
        {isUrdu ? 'صفحہ نہیں ملا' : 'Page Not Found'}
      </h2>
      <p className={`text-brand-navy/60 mb-8 max-w-md text-lg ${isUrdu ? 'font-urduBody' : ''}`}>
        {isUrdu
          ? 'معذرت، آپ جو صفحہ تلاش کر رہے ہیں وہ موجود نہیں ہے یا منتقل ہو چکا ہے۔'
          : 'Sorry, the page you are looking for does not exist or has been moved.'}
      </p>
      <Link
        to="/"
        className="bg-brand-teal text-brand-white px-8 py-3.5 rounded-full font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-brand-teal/20"
      >
        {isUrdu ? 'ہوم پیج پر واپس جائیں' : 'Back to Home'}
      </Link>
    </div>
  </>
);

export default NotFound;
