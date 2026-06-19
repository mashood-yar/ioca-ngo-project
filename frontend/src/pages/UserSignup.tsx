import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate, Link, useNavigate, useLocation } from 'react-router-dom';

import { hasSupabaseConfig } from '../lib/supabase';

export function UserSignup() {
  const { user, isAdmin, loading, signUpWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const redirectUrl = queryParams.get('redirect') || '/dashboard';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-gray">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If already logged in
  if (user) {
    if (isAdmin) return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to={redirectUrl} replace />;
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUpWithEmail(
        formData.email,
        formData.password,
        formData.fullName,
        formData.phone
      );
      if (error) throw error;
      
      // On success, redirect
      navigate(redirectUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to sign up. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const { error } = await signInWithGoogle(redirectUrl);
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Failed to sign up with Google');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-brand-gray flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-6">
          <img src="/assets/logos/logo-icon-teal.webp" alt="IOCA Icon" className="w-16 h-16 object-contain drop-shadow-sm hover:scale-105 transition-transform" />
        </div>
        <h2 className="text-3xl font-bold text-brand-navy tracking-tight">
          Create an Account
        </h2>
        <p className="mt-2 text-sm text-brand-navy/60">
          Join IOCA to track your donations and impact
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-brand-navy/5 sm:rounded-2xl sm:px-10 border border-brand-navy/5">
          {!hasSupabaseConfig && (
            <div className="mb-4 bg-amber-50 text-amber-800 p-4 rounded-lg text-sm border border-amber-100 shadow-sm leading-relaxed">
              <p className="font-semibold mb-1">⚠️ Setup Required:</p>
              Supabase environment variables are missing in this build. Please configure <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-xs">VITE_SUPABASE_URL</code> and <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-xs">VITE_SUPABASE_ANON_KEY</code> in your Vercel project settings, then redeploy.
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSignup}>
            <div>
              <label className="block text-sm font-medium text-brand-navy/70">Full Name</label>
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-brand-navy/20 rounded-lg shadow-sm focus:outline-none focus:ring-brand-teal focus:border-brand-teal sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-navy/70">Email Address</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-brand-navy/20 rounded-lg shadow-sm focus:outline-none focus:ring-brand-teal focus:border-brand-teal sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-navy/70">Phone Number (Optional)</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-brand-navy/20 rounded-lg shadow-sm focus:outline-none focus:ring-brand-teal focus:border-brand-teal sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-navy/70">Password</label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-brand-navy/20 rounded-lg shadow-sm focus:outline-none focus:ring-brand-teal focus:border-brand-teal sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-navy/70">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-brand-navy/20 rounded-lg shadow-sm focus:outline-none focus:ring-brand-teal focus:border-brand-teal sm:text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand-teal hover:bg-brand-teal/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-teal disabled:opacity-50 transition-colors mt-6"
            >
              {isLoading ? 'Creating account...' : 'Sign up'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-brand-navy/20" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-brand-navy/50">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleGoogleSignup}
                className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-brand-navy/20 rounded-lg shadow-sm bg-white text-sm font-medium text-brand-navy/70 hover:bg-brand-gray focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-teal transition-colors"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                Sign up with Google
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-brand-navy/60">
            Already have an account?{' '}
            <Link to="/user/login" className="font-medium text-brand-teal hover:text-brand-teal-dark transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
