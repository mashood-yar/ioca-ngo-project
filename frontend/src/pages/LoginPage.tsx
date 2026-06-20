import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { signUpWithEmail, signInWithEmail, resetPassword } from '../lib/authHelpers';
import { useAuth } from '../hooks/useAuth';
import { hasSupabaseConfig } from '../lib/supabase';

export function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, loading: authLoading, signInWithGoogle } = useAuth();

  // Extract redirect URL from query parameter
  const queryParams = new URLSearchParams(location.search);
  const redirectUrl = queryParams.get('redirect') || '/dashboard';
  
  // Detect if we are in admin mode based on path or redirect destination
  const isAdminMode = location.pathname.startsWith('/admin') || redirectUrl.startsWith('/admin');

  // Set default tab based on path
  useEffect(() => {
    if (location.pathname === '/signup') {
      setIsSignUp(true);
    } else {
      setIsSignUp(false);
    }
  }, [location.pathname]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-gray">
        <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Already logged in redirects:
  if (user) {
    if (isAdminMode) {
      if (isAdmin) {
        return <Navigate to="/admin/dashboard" replace />;
      } else {
        // Logged in but trying to access admin panel without admin role
        return (
          <div className="min-h-screen bg-brand-gray flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
              <div className="flex justify-center mb-6">
                <img
                  src="/assets/logos/logo-icon-teal.webp"
                  alt="IOCA Icon"
                  className="w-20 h-20 object-contain drop-shadow-sm hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h2 className="text-3xl font-extrabold text-brand-navy mb-2 tracking-tight">Access Denied</h2>
              <p className="text-gray-600 mb-8 max-w-sm mx-auto leading-relaxed">
                You are successfully signed in, but your account does not have administrator privileges.
                Please contact the system administrator if you need access.
              </p>
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-brand-teal hover:bg-brand-teal/90 shadow-md hover:shadow-lg transition-all duration-200"
              >
                Return to Home
              </button>
            </div>
          </div>
        );
      }
    } else {
      // Normal user redirects to dashboard or redirect param
      return <Navigate to={redirectUrl} replace />;
    }
  }

  // Sign up with email
  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    const fullName = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!fullName || !email || !password) {
      setError('All fields are required.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!agreeTerms) {
      setError('You must agree to the Terms of Service & Privacy Policy.');
      return;
    }

    setLoading(true);
    try {
      await signUpWithEmail(email, password, fullName);
      setSuccess('Account created! Please check your email to verify your account.');
      e.currentTarget.reset();
      setAgreeTerms(false);
      setTimeout(() => {
        setIsSignUp(false);
        setSuccess(null);
      }, 5000);
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign up.');
    } finally {
      setLoading(false);
    }
  };

  // Sign in with email
  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
      setError('Email and password required.');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmail(email, password);
      setSuccess('Successfully signed in! Redirecting...');
      setTimeout(() => {
        navigate(isAdminMode ? '/admin/dashboard' : redirectUrl);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Reset password request
  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setSuccess('Password reset link sent to your email. Please check your inbox.');
      e.currentTarget.reset();
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccess(null);
    try {
      const targetRedirect = isAdminMode ? '/admin/dashboard' : redirectUrl;
      await signInWithGoogle(targetRedirect);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1D2D49] to-[#0D9488] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 border border-white/10 transition-all duration-300">
        
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <img
              src="/assets/logos/logo-icon-teal.webp"
              alt="IOCA Icon"
              className="w-16 h-16 object-contain drop-shadow-sm hover:scale-110 transition-transform duration-300"
            />
          </div>
          <h1 className="text-3xl font-extrabold text-[#1D2D49] tracking-tight">IOCA</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto leading-normal">
            {isAdminMode 
              ? 'International Organization For Community Advancement — Admin Portal' 
              : 'International Organization For Community Advancement'
            }
          </p>
        </div>

        {!hasSupabaseConfig && (
          <div className="mb-4 bg-amber-50 text-amber-800 p-4 rounded-xl text-sm border border-amber-100 shadow-sm leading-relaxed">
            <p className="font-semibold mb-1">⚠️ Setup Required:</p>
            Supabase environment variables are missing. Please configure <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-xs">VITE_SUPABASE_URL</code> and <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-xs">VITE_SUPABASE_ANON_KEY</code>.
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium animate-fadeIn leading-relaxed">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium animate-fadeIn leading-relaxed">
            {success}
          </div>
        )}

        {/* Forgot Password View */}
        {isForgotPassword ? (
          <div>
            <h2 className="text-xl font-bold text-[#1D2D49] mb-2">Reset Password</h2>
            <p className="text-sm text-gray-500 mb-4 leading-normal">
              Enter your email address and we'll send you a recovery link to choose a new password.
            </p>
            
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none transition-all duration-200 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0D9488] text-white py-2.5 rounded-xl font-semibold hover:bg-[#0F766E] shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 text-sm"
              >
                {loading ? 'Sending Link...' : 'Send Reset Link'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setIsForgotPassword(false);
                  setError(null);
                  setSuccess(null);
                }}
                className="text-sm font-medium text-[#0D9488] hover:text-[#0F766E] transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        ) : (
          /* Normal Sign In / Sign Up Forms */
          <>
            {/* Tab Toggle */}
            <div className="flex gap-2 mb-6 bg-gray-100 p-1.5 rounded-xl">
              <button
                onClick={() => {
                  setIsSignUp(false);
                  setError(null);
                  setSuccess(null);
                }}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  !isSignUp
                    ? 'bg-white text-[#1D2D49] shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setIsSignUp(true);
                  setError(null);
                  setSuccess(null);
                }}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  isSignUp
                    ? 'bg-white text-[#1D2D49] shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Forms */}
            {!isSignUp ? (
              /* Sign In Form */
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none transition-all duration-200 text-sm"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-semibold text-gray-700">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setError(null);
                        setSuccess(null);
                      }}
                      className="text-xs font-semibold text-[#0D9488] hover:text-[#0F766E] transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none transition-all duration-200 text-sm"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    id="remember_me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-[#0D9488] focus:ring-[#0D9488] border-gray-300 rounded cursor-pointer"
                  />
                  <label htmlFor="remember_me" className="ml-2 block text-sm text-gray-600 cursor-pointer">
                    Remember me
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0D9488] text-white py-2.5 rounded-xl font-semibold hover:bg-[#0F766E] shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 text-sm"
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>
            ) : (
              /* Sign Up Form */
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Your Name"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none transition-all duration-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none transition-all duration-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    minLength={8}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none transition-all duration-200 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none transition-all duration-200 text-sm"
                  />
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="agree_terms"
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      required
                      className="h-4 w-4 text-[#0D9488] focus:ring-[#0D9488] border-gray-300 rounded cursor-pointer"
                    />
                  </div>
                  <div className="ml-2 text-sm">
                    <label htmlFor="agree_terms" className="text-gray-600 cursor-pointer">
                      I agree to the{' '}
                      <Link to="/about" className="font-semibold text-[#0D9488] hover:text-[#0F766E] transition-colors">
                        Terms of Service
                      </Link>{' '}
                      &{' '}
                      <Link to="/about" className="font-semibold text-[#0D9488] hover:text-[#0F766E] transition-colors">
                        Privacy Policy
                      </Link>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0D9488] text-white py-2.5 rounded-xl font-semibold hover:bg-[#0F766E] shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 text-sm"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
            )}

            {/* Divider */}
            <div className="my-6 flex items-center gap-4">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-gray-400 text-xs uppercase font-bold tracking-wider">Or</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            {/* Google OAuth Button */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full border border-gray-300 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center justify-center gap-2.5 shadow-sm text-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign {isSignUp ? 'up' : 'in'} with Google
            </button>
          </>
        )}
      </div>
    </div>
  );
}
