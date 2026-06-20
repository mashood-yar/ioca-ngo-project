import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updatePassword } from '../lib/authHelpers';
import { useAuth } from '../hooks/useAuth';

export function ResetPassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!password || !confirmPassword) {
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

    setLoading(true);
    try {
      await updatePassword(password);
      setSuccess('Your password has been successfully updated! Redirecting to login...');
      e.currentTarget.reset();
      setTimeout(() => {
        navigate('/user/login', { replace: true });
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update your password. Please request a new reset link.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-gray">
        <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If there is no authenticated session (e.g. they visited the route directly without link token)
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1D2D49] to-[#0D9488] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center border border-white/10">
          <div className="flex justify-center mb-6">
            <img
              src="/assets/logos/logo-icon-teal.webp"
              alt="IOCA Icon"
              className="w-16 h-16 object-contain"
            />
          </div>
          <h2 className="text-2xl font-extrabold text-[#1D2D49] mb-3">Invalid Session</h2>
          <p className="text-gray-500 mb-6 text-sm leading-relaxed">
            It looks like your password reset link is invalid, expired, or was accessed directly.
            Please request a new reset link from the login page.
          </p>
          <button
            onClick={() => navigate('/user/login')}
            className="w-full bg-[#0D9488] text-white py-2.5 rounded-xl font-semibold hover:bg-[#0F766E] shadow-md hover:shadow-lg transition-all duration-200 text-sm"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1D2D49] to-[#0D9488] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 border border-white/10 transition-all duration-300">
        
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <img
              src="/assets/logos/logo-icon-teal.webp"
              alt="IOCA Icon"
              className="w-16 h-16 object-contain drop-shadow-sm"
            />
          </div>
          <h1 className="text-3xl font-extrabold text-[#1D2D49] tracking-tight">Set New Password</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto leading-normal">
            Choose a strong, secure password for your IOCA account.
          </p>
        </div>

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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              minLength={8}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none transition-all duration-200 text-sm"
            />
            <p className="text-xs text-gray-500 mt-1 font-medium">Minimum 8 characters</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none transition-all duration-200 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0D9488] text-white py-2.5 rounded-xl font-semibold hover:bg-[#0F766E] shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 text-sm"
          >
            {loading ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
