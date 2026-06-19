import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, User, LogOut, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { optimizeImage } from '../lib/optimizeImage';

interface NavbarProps {
  isUrdu: boolean;
  setIsUrdu: React.Dispatch<React.SetStateAction<boolean>>;
  onDonateClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isUrdu, setIsUrdu, onDonateClick }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProgramsOpen, setIsProgramsOpen] = useState(false);
  const location = useLocation();
  const programsRef = useRef<HTMLDivElement>(null);
  const programsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMenu = () => {
    setIsMobileMenuOpen(false);
    setIsProgramsOpen(false);
  };

  const { user, isAdmin, signOut, signInWithGoogle } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const avatarUrl = user?.user_metadata?.avatar_url;
  const fullName = user?.user_metadata?.full_name || 'Member';
  const initials = fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    setIsDropdownOpen(false);
  };

  /** Check if a path matches the current route (exact or prefix) */
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const activeLinkClass = (path: string) =>
    isActive(path) ? 'text-brand-gold font-bold' : 'hover:text-brand-gold';

  /** Keyboard handling for the Programs dropdown */
  const handleProgramsKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsProgramsOpen(prev => !prev);
    } else if (e.key === 'Escape') {
      setIsProgramsOpen(false);
    }
  };

  /** Delayed close so the mouse can travel from trigger to dropdown */
  const handleProgramsMouseEnter = () => {
    if (programsTimerRef.current) clearTimeout(programsTimerRef.current);
    setIsProgramsOpen(true);
  };
  const handleProgramsMouseLeave = () => {
    programsTimerRef.current = setTimeout(() => setIsProgramsOpen(false), 150);
  };

  /** Close dropdown on outside click */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (programsRef.current && !programsRef.current.contains(e.target as Node)) {
        setIsProgramsOpen(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const programSubLinks = [
    { to: '/programs/education', labelEn: 'Education', labelUr: 'تعلیم' },
    { to: '/programs/health', labelEn: 'Health', labelUr: 'صحت' },
    { to: '/programs/youth', labelEn: 'Youth', labelUr: 'نوجوانوں کی ترقی' },
    { to: '/programs/community-bonding', labelEn: 'Community Bonding', labelUr: 'معاشرتی روابط' },
  ];

  return (
    <>
      {/* Skip Navigation Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:bg-brand-teal focus:text-brand-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-bold focus:text-sm focus:shadow-lg"
      >
        {isUrdu ? 'مواد پر جائیں' : 'Skip to main content'}
      </a>

      <nav
        className="sticky top-0 z-50 bg-brand-white md:bg-brand-white/90 backdrop-blur-none md:backdrop-blur-md border-b border-brand-navy/10 will-change-transform"
        role="navigation"
        aria-label={isUrdu ? 'مرکزی نیویگیشن' : 'Main navigation'}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 md:px-16 flex items-center justify-between">
          <Link to="/" className="flex items-center" onClick={closeMenu}>
            <img src="/assets/logos/horizontal-main-logo-teal.webp" alt="IOCA Logo" className="h-10 md:h-12 w-auto object-contain" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6 font-medium text-sm">
            <Link to="/" className={`transition-colors ${activeLinkClass('/')}`}>
              {isUrdu ? 'ہوم' : 'Home'}
            </Link>
            <Link to="/about" className={`transition-colors ${activeLinkClass('/about')}`}>
              {isUrdu ? 'ہمارے بارے میں' : 'About Us'}
            </Link>

            {/* Programs Dropdown */}
            <div
              ref={programsRef}
              className="relative"
              onMouseEnter={handleProgramsMouseEnter}
              onMouseLeave={handleProgramsMouseLeave}
            >
              <button
                className={`flex items-center gap-1 transition-colors py-2 ${activeLinkClass('/programs')}`}
                onClick={() => setIsProgramsOpen(prev => !prev)}
                onKeyDown={handleProgramsKeyDown}
                aria-expanded={isProgramsOpen}
                aria-haspopup="true"
                aria-controls="programs-dropdown"
              >
                {isUrdu ? 'پروگرامز' : 'Programs'}
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isProgramsOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isProgramsOpen && (
                  <motion.div
                    id="programs-dropdown"
                    role="menu"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="absolute top-full left-0 bg-white shadow-xl border border-brand-navy/5 rounded-xl py-2 w-48 flex flex-col z-50"
                  >
                    <Link
                      to="/programs"
                      onClick={closeMenu}
                      role="menuitem"
                      className="px-4 py-2 hover:bg-brand-gray transition-colors font-semibold"
                    >
                      {isUrdu ? 'تمام پروگرامز' : 'All Programs'}
                    </Link>
                    {programSubLinks.map(link => (
                      <Link
                        key={link.to}
                        to={link.to}
                        onClick={closeMenu}
                        role="menuitem"
                        className="px-4 py-2 hover:bg-brand-gray transition-colors"
                      >
                        {isUrdu ? link.labelUr : link.labelEn}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link to="/projects" className={`transition-colors ${activeLinkClass('/projects')}`}>
              {isUrdu ? 'پروجیکٹس' : 'Projects'}
            </Link>
            <Link to="/impact-stories" className={`transition-colors ${activeLinkClass('/impact-stories')}`}>
              {isUrdu ? 'کہانیاں' : 'Impact Stories'}
            </Link>
            <Link to="/gallery" className={`transition-colors ${activeLinkClass('/gallery')}`}>
              {isUrdu ? 'گیلری' : 'Gallery'}
            </Link>
            <Link to="/contact" className={`transition-colors ${activeLinkClass('/contact')}`}>
              {isUrdu ? 'رابطہ کریں' : 'Contact'}
            </Link>
            <Link to="/volunteer" className={`text-brand-teal hover:text-brand-navy font-bold transition-colors ${isActive('/volunteer') ? 'text-brand-navy underline underline-offset-4' : ''}`}>
              {isUrdu ? 'رضاکار' : 'Volunteer'}
            </Link>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => {
                setIsUrdu(!isUrdu);
                closeMenu();
              }}
              className="text-sm font-semibold min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-brand-navy/5 transition-colors"
              aria-label={isUrdu ? 'Switch to English' : 'اردو میں تبدیل کریں'}
            >
              {isUrdu ? 'EN' : 'اردو'}
            </button>

            <button
              onClick={onDonateClick}
              className="hidden md:flex bg-brand-teal text-brand-white px-6 py-2.5 min-h-[48px] items-center justify-center rounded-lg font-semibold hover:opacity-90 transition-all shadow-md shadow-brand-teal/20"
            >
              {isUrdu ? 'عطیہ کریں' : 'Donate Now'}
            </button>

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 flex items-center justify-center rounded-full transition-transform hover:scale-105 ml-1 md:ml-2"
                  aria-expanded={isDropdownOpen}
                  aria-label="User menu"
                >
                  {avatarUrl ? (
                    <img src={optimizeImage(avatarUrl, { width: 80 })} alt={fullName} className="w-10 h-10 rounded-full object-cover border-2 border-brand-teal/30" width={40} height={40} loading="lazy" decoding="async" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-brand-teal text-white flex items-center justify-center text-sm font-bold shadow-sm">
                      {initials}
                    </div>
                  )}
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 bg-white shadow-xl rounded-xl border border-brand-navy/10 py-2 w-56 flex flex-col z-50 overflow-hidden"
                    >
                      <div className="px-4 py-3 bg-brand-gray/30 border-b border-brand-navy/5 mb-1">
                        <p className="font-bold text-sm text-brand-navy truncate">{fullName}</p>
                        <p className="text-xs text-brand-navy/60 truncate">{user.email}</p>
                      </div>
                      
                      <Link
                        to={isAdmin ? '/admin/dashboard' : '/dashboard'}
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-brand-navy hover:bg-brand-gray transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-brand-teal" />
                        {isUrdu ? 'ڈیش بورڈ' : 'Dashboard'}
                      </Link>
                      
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        {isUrdu ? 'لاگ آؤٹ' : 'Sign Out'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link 
                to="/user/login" 
                className="flex items-center justify-center min-h-[44px] min-w-[44px] md:min-w-0 md:min-h-0 md:gap-2 font-bold text-brand-navy/80 hover:text-brand-teal hover:bg-brand-navy/5 md:hover:bg-transparent rounded-full md:rounded-none transition-colors"
                title={isUrdu ? 'لاگ ان' : 'Sign In'}
              >
                <User className="w-5 h-5 md:w-5 md:h-5" />
                <span className="sr-only lg:not-sr-only">{isUrdu ? 'لاگ ان' : 'Sign In'}</span>
              </Link>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={toggleMenu}
              className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-brand-navy hover:bg-brand-navy/5 rounded-md transition-colors"
              aria-label={isUrdu ? 'موبائل مینو کھولیں' : 'Toggle mobile menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              id="mobile-menu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="lg:hidden absolute top-[100%] left-0 w-full bg-brand-white border-b border-brand-navy/10 shadow-lg overflow-hidden"
            >
              <div className="px-4 py-4 flex flex-col gap-2 font-medium text-lg max-h-[80vh] overflow-y-auto">
                <Link to="/" onClick={closeMenu} className={`py-2 border-b border-brand-navy/5 ${isActive('/') ? 'text-brand-gold font-bold' : ''}`}>
                  {isUrdu ? 'ہوم' : 'Home'}
                </Link>
                <Link to="/about" onClick={closeMenu} className={`py-2 border-b border-brand-navy/5 ${isActive('/about') ? 'text-brand-gold font-bold' : ''}`}>
                  {isUrdu ? 'ہمارے بارے میں' : 'About Us'}
                </Link>

                <div className="py-2 border-b border-brand-navy/5">
                  <button
                    className="flex justify-between items-center w-full text-left"
                    onClick={() => setIsProgramsOpen(!isProgramsOpen)}
                    aria-expanded={isProgramsOpen}
                    aria-controls="mobile-programs-dropdown"
                  >
                    <span className={isActive('/programs') ? 'text-brand-gold font-bold' : ''}>{isUrdu ? 'پروگرامز' : 'Programs'}</span>
                    <ChevronDown className={`w-5 h-5 transition-transform ${isProgramsOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {isProgramsOpen && (
                      <motion.div
                        id="mobile-programs-dropdown"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-col gap-2 pl-4 mt-2">
                          <Link to="/programs" onClick={closeMenu} className="py-1 text-brand-navy/70">
                            {isUrdu ? 'تمام پروگرامز' : 'All Programs'}
                          </Link>
                          {programSubLinks.map(link => (
                            <Link key={link.to} to={link.to} onClick={closeMenu} className="py-1 text-brand-navy/70">
                              {isUrdu ? link.labelUr : link.labelEn}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Link to="/projects" onClick={closeMenu} className={`min-h-[48px] flex items-center border-b border-brand-navy/5 ${isActive('/projects') ? 'text-brand-gold font-bold' : ''}`}>
                  {isUrdu ? 'پروجیکٹس' : 'Projects'}
                </Link>
                <Link to="/impact-stories" onClick={closeMenu} className={`min-h-[48px] flex items-center border-b border-brand-navy/5 ${isActive('/impact-stories') ? 'text-brand-gold font-bold' : ''}`}>
                  {isUrdu ? 'کہانیاں' : 'Impact Stories'}
                </Link>
                <Link to="/gallery" onClick={closeMenu} className={`min-h-[48px] flex items-center border-b border-brand-navy/5 ${isActive('/gallery') ? 'text-brand-gold font-bold' : ''}`}>
                  {isUrdu ? 'گیلری' : 'Gallery'}
                </Link>
                <Link to="/contact" onClick={closeMenu} className={`min-h-[48px] flex items-center border-b border-brand-navy/5 ${isActive('/contact') ? 'text-brand-gold font-bold' : ''}`}>
                  {isUrdu ? 'رابطہ کریں' : 'Contact'}
                </Link>
                <Link to="/volunteer" onClick={closeMenu} className="min-h-[48px] flex items-center border-b border-brand-navy/5 font-bold text-brand-teal">
                  {isUrdu ? 'رضاکار بنیں' : 'Volunteer'}
                </Link>

                {!user ? (
                  <>
                    <Link to="/user/login" onClick={closeMenu} className="min-h-[48px] flex items-center border-b border-brand-navy/5 font-semibold text-brand-teal">
                      {isUrdu ? 'لاگ ان کریں' : 'Sign In'}
                    </Link>
                    <Link to="/user/signup" onClick={closeMenu} className="min-h-[48px] flex items-center border-b border-brand-navy/5 font-semibold text-brand-teal">
                      {isUrdu ? 'سائن اپ کریں' : 'Sign Up'}
                    </Link>
                    <button
                      onClick={() => { closeMenu(); signInWithGoogle(); }}
                      className="py-2 mt-2 border-2 border-brand-teal text-brand-teal rounded-xl text-center font-bold min-h-[48px] flex items-center justify-center gap-2"
                    >
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="w-5 h-5" />
                      {isUrdu ? 'گوگل کے ساتھ جاری رکھیں' : 'Continue with Google'}
                    </button>
                  </>
                ) : (
                  <>
                    <Link to={isAdmin ? '/admin/dashboard' : '/dashboard'} onClick={closeMenu} className="min-h-[48px] flex items-center border-b border-brand-navy/5 font-semibold text-brand-teal gap-2">
                      <LayoutDashboard className="w-4 h-4" />
                      {isUrdu ? 'ڈیش بورڈ' : 'Dashboard'}
                    </Link>
                    <button
                      onClick={() => { closeMenu(); handleSignOut(); }}
                      className="min-h-[48px] flex items-center text-red-600 font-semibold text-left gap-2 w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      {isUrdu ? 'لاگ آؤٹ' : 'Sign Out'}
                    </button>
                  </>
                )}

                {/* Mobile Donate - calls onDonateClick instead of navigating */}
                <button
                  onClick={() => {
                    closeMenu();
                    onDonateClick();
                  }}
                  className="py-2 mt-2 bg-brand-teal text-brand-white rounded-xl text-center font-bold min-h-[48px]"
                >
                  {isUrdu ? 'عطیہ کریں' : 'Donate Now'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
};

export default Navbar;
