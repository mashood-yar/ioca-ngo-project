import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { optimizeImage } from '../../lib/optimizeImage';
import { 
  LayoutDashboard, 
  FileText, 
  Calendar, 
  MapPin, 
  DollarSign, 
  MessageSquare, 
  LogOut,
  Menu,
  ClipboardList
} from 'lucide-react';

export function AdminLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const avatarUrl = user?.user_metadata?.avatar_url;
  const fullName = user?.user_metadata?.full_name || 'Admin';
  const initials = fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/posts', label: 'News Posts', icon: FileText },
    { to: '/admin/events', label: 'Events', icon: Calendar },
    { to: '/admin/zones', label: 'Zones & Members', icon: MapPin },
    { to: '/admin/applications', label: 'Applications', icon: ClipboardList },
    { to: '/admin/donations', label: 'Donations', icon: DollarSign },
    { to: '/admin/queries', label: 'Client Queries', icon: MessageSquare },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full text-white bg-[#1D2D49]">
      <div className="flex items-center gap-3 px-6 py-8 border-b border-white/10 bg-[#162238]">
        <div className="w-10 h-10 bg-brand-teal/20 rounded-xl flex items-center justify-center">
          <span className="font-bold text-brand-teal">IO</span>
        </div>
        <div>
          <h2 className="font-bold text-lg leading-tight">IOCA Admin</h2>
          <p className="text-xs text-white/60">Management Portal</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-brand-teal text-white border-l-[3px] border-brand-teal shadow-lg shadow-[#0D9488]/20' 
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl bg-white/5">
          <img 
            src={user?.user_metadata?.avatar_url ? optimizeImage(user.user_metadata.avatar_url, { width: 80 }) : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.user_metadata?.full_name || 'Admin')}`} 
            alt="Profile" 
            className="w-8 h-8 rounded-full"
            width={32}
            height={32}
            loading="lazy"
            decoding="async"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-white">{user?.user_metadata?.full_name || 'Admin User'}</p>
            <p className="text-xs text-white/60 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center justify-center w-full gap-2 px-4 py-2 text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[80%] bg-gray-900 h-full transform transition-transform duration-300 ease-in-out">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b px-4 py-3 flex items-center justify-between z-30">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-8 h-8 bg-brand-teal/20 rounded-lg flex items-center justify-center">
              <span className="font-bold text-brand-teal text-xs">IO</span>
            </div>
            <span className="font-bold text-[#1D2D49]">IOCA Admin</span>
          </div>

          {/* Right side: Avatar & Mobile menu */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Avatar Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="focus:outline-none flex items-center justify-center rounded-full transition-transform hover:scale-105"
              >
                {avatarUrl ? (
                  <img src={optimizeImage(avatarUrl, { width: 80 })} alt={fullName} className="w-9 h-9 rounded-full object-cover border border-gray-200" width={36} height={36} loading="lazy" decoding="async" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#1D2D49] text-white flex items-center justify-center text-sm font-bold">
                    {initials}
                  </div>
                )}
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 top-12 bg-white shadow-lg rounded-lg border border-gray-200 p-2 w-52 z-50">
                  <div className="px-3 py-2">
                    <p className="font-bold text-sm text-gray-900 truncate">{fullName}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-[#1D2D49] hover:bg-[#F3F4F6] rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
