import React, { useState, lazy, Suspense } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import DonationModal from './components/DonationModal';
import { PageLoadingSpinner } from './components/PageLoadingSpinner';

import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Lazy-loaded pages for code splitting
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Programs = lazy(() => import('./pages/Programs'));
const ProgramDetails = lazy(() => import('./pages/ProgramDetails'));
const Projects = lazy(() => import('./pages/Projects'));
const ImpactStories = lazy(() => import('./pages/ImpactStories'));
const DonatePage = lazy(() => import('./pages/DonatePage'));
const Volunteer = lazy(() => import('./pages/Volunteer'));
const Gallery = lazy(() => import('./pages/Gallery'));
const Contact = lazy(() => import('./pages/Contact'));
const News = lazy(() => import('./pages/News'));
const Events = lazy(() => import('./pages/Events'));
const NotFound = lazy(() => import('./pages/NotFound'));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const UserLogin = lazy(() => import('./pages/UserLogin').then(m => ({ default: m.UserLogin })));
const UserSignup = lazy(() => import('./pages/UserSignup').then(m => ({ default: m.UserSignup })));
const UserDashboard = lazy(() => import('./pages/UserDashboard').then(m => ({ default: m.UserDashboard })));
const Logout = lazy(() => import('./pages/Logout'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminPosts = lazy(() => import('./pages/admin/AdminPosts').then(m => ({ default: m.AdminPosts })));
const AdminEvents = lazy(() => import('./pages/admin/AdminEvents').then(m => ({ default: m.AdminEvents })));
const AdminZones = lazy(() => import('./pages/admin/AdminZones').then(m => ({ default: m.AdminZones })));
const AdminMembers = lazy(() => import('./pages/admin/AdminMembers').then(m => ({ default: m.AdminMembers })));
const AdminDonations = lazy(() => import('./pages/admin/AdminDonations').then(m => ({ default: m.AdminDonations })));
const AdminQueries = lazy(() => import('./pages/admin/AdminQueries').then(m => ({ default: m.AdminQueries })));
const AdminApplications = lazy(() => import('./pages/admin/AdminApplications').then(m => ({ default: m.AdminApplications })));
const MembershipApply = lazy(() => import('./pages/membership/MembershipApply').then(m => ({ default: m.MembershipApply })));
const MembershipWaiting = lazy(() => import('./pages/membership/MembershipWaiting').then(m => ({ default: m.MembershipWaiting })));

/** Scrolls to top on route change */
function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

/** Simple error boundary */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode, isUrdu: boolean },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      const { isUrdu } = this.props;
      return (
        <div className={`min-h-screen flex items-center justify-center text-center p-8 ${isUrdu ? 'font-urduBody rtl' : 'ltr'}`} dir={isUrdu ? 'rtl' : 'ltr'}>
          <div>
            <h1 className="text-3xl font-bold text-brand-navy mb-4">
              {isUrdu ? 'کچھ غلط ہو گیا' : 'Something went wrong'}
            </h1>
            <p className="text-brand-navy/70 mb-6">
              {isUrdu ? 'براہ کرم صفحہ ریفریش کریں یا بعد میں دوبارہ کوشش کریں۔' : 'Please refresh the page or try again later.'}
            </p>
            <button onClick={() => window.location.reload()} className="bg-brand-teal text-brand-white px-6 py-3 rounded-full font-semibold">
              {isUrdu ? 'صفحہ ریفریش کریں' : 'Refresh Page'}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/** Loading spinner for Suspense fallback */
const PageLoader = () => <PageLoadingSpinner />;

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const [isUrdu, setIsUrdu] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  React.useEffect(() => {
    document.documentElement.lang = isUrdu ? 'ur' : 'en';
  }, [isUrdu]);

  const handleDonateClick = (campaignName: string | null = null) => {
    setSelectedCampaign(campaignName);
    setIsModalOpen(true);
  };

  if (isAdminRoute) {
    return (
      <>
        <ScrollToTop />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/admin/login" element={<LoginPage />} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="posts" element={<AdminPosts />} />
              <Route path="events" element={<AdminEvents />} />
              <Route path="zones" element={<AdminZones />} />
              <Route path="members" element={<AdminMembers />} />
              <Route path="applications" element={<AdminApplications />} />
              <Route path="donations" element={<AdminDonations />} />
              <Route path="queries" element={<AdminQueries />} />
            </Route>
          </Routes>
        </Suspense>
      </>
    );
  }

  return (
    <div className={`min-h-screen bg-brand-gray text-brand-navy selection:bg-brand-gold selection:text-white pb-[72px] md:pb-0 ${isUrdu ? 'font-urduBody' : 'font-sans'}`} dir={isUrdu ? 'rtl' : 'ltr'}>
      <ScrollToTop />
      <Navbar isUrdu={isUrdu} setIsUrdu={setIsUrdu} onDonateClick={() => handleDonateClick(null)} />

      <main id="main-content">
        <ErrorBoundary isUrdu={isUrdu}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home isUrdu={isUrdu} onDonateClick={handleDonateClick} />} />
              <Route path="/about" element={<About isUrdu={isUrdu} />} />
              <Route path="/programs" element={<Programs isUrdu={isUrdu} />} />
              <Route path="/programs/:id" element={<ProgramDetails isUrdu={isUrdu} />} />
              <Route path="/projects" element={<Projects isUrdu={isUrdu} />} />
              <Route path="/impact-stories" element={<ImpactStories isUrdu={isUrdu} />} />
              <Route path="/donate" element={<DonatePage isUrdu={isUrdu} onDonateClick={() => handleDonateClick(null)} />} />
              <Route path="/volunteer" element={<Volunteer isUrdu={isUrdu} />} />
              <Route path="/gallery" element={<Gallery isUrdu={isUrdu} />} />
              <Route path="/news" element={<News isUrdu={isUrdu} />} />
              <Route path="/events" element={<Events isUrdu={isUrdu} />} />
              <Route path="/contact" element={<Contact isUrdu={isUrdu} />} />
              <Route path="/login" element={<Navigate to="/user/login" replace />} />
              <Route path="/user/login" element={<UserLogin />} />
              <Route path="/signup" element={<UserSignup />} />
              <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
              <Route path="/membership/apply" element={<ProtectedRoute><MembershipApply /></ProtectedRoute>} />
              <Route path="/membership/waiting" element={<ProtectedRoute><MembershipWaiting /></ProtectedRoute>} />
              <Route path="/logout" element={<Logout />} />
              <Route path="*" element={<NotFound isUrdu={isUrdu} />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>

      <Footer isUrdu={isUrdu} />
      <DonationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} initialCampaign={selectedCampaign || undefined} isUrdu={isUrdu} />
    </div>
  );
}

export default App;
