import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { fetchApi } from '../../lib/apiClient';
import { Clock, Search, CheckCircle, XCircle } from 'lucide-react';

interface Application {
  id: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  submitted_at: string;
  admin_notes?: string;
  zones?: { name: string; city: string };
  tiers?: { name: string; price: number };
}

export function MembershipWaiting() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchApp() {
      try {
        setLoading(true);
        const { data, error } = await fetchApi<Application>('/misc/applications/me');
        if (error || !data) {
          // No application found, send to apply
          navigate('/membership/apply', { replace: true });
          return;
        }
        setApplication(data);

        // If approved, trigger a dashboard refetch in background if they visit it next
        if (data.status === 'approved') {
          fetchApi('/memberships/me').catch(() => {});
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchApp();
  }, [navigate]);

  const handleReapply = async () => {
    try {
      await fetchApi('/misc/applications/me', { method: 'DELETE' });
      navigate('/membership/apply');
    } catch (err) {
      console.error('Failed to delete rejected app', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!application) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-16 px-4">
      <div className="max-w-lg mx-auto w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        
        {application.status === 'pending' && (
          <>
            <Clock className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Application submitted</h1>
            <p className="text-gray-500 mb-6">
              Your membership application has been received and is awaiting review by the IOCA admin team. We will notify you by email once a decision has been made.
            </p>
          </>
        )}

        {application.status === 'under_review' && (
          <>
            <Search className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Application under review</h1>
            <p className="text-gray-500 mb-6">
              Your application is currently being reviewed by the admin team. You will receive an email notification with the decision soon.
            </p>
          </>
        )}

        {application.status === 'approved' && (
          <>
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Application approved!</h1>
            <p className="text-gray-500 mb-6">
              Congratulations! Your IOCA membership has been approved. Your membership is now active.
            </p>
            <div className="bg-green-50 text-green-800 p-4 rounded-xl font-medium mb-6">
              Welcome to IOCA, {user?.user_metadata?.full_name?.split(' ')[0] || 'Member'}!
            </div>
          </>
        )}

        {application.status === 'rejected' && (
          <>
            <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Application not approved</h1>
            <p className="text-gray-500 mb-6">
              Unfortunately your application was not approved at this time.
            </p>
            {application.admin_notes && (
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm text-left mb-6">
                <span className="block font-medium text-gray-900 mb-1">Reason provided:</span>
                <span className="text-gray-600">{application.admin_notes}</span>
              </div>
            )}
          </>
        )}

        {/* Info Box for pending/review */}
        {(application.status === 'pending' || application.status === 'under_review') && (
          <div className="bg-gray-50 rounded-xl p-4 text-sm text-left mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-gray-500">Submitted on:</span>
              <span className="font-medium text-gray-900">{new Date(application.submitted_at).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-500">Zone:</span>
              <span className="font-medium text-gray-900">{application.zones?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tier:</span>
              <span className="font-medium text-gray-900">{application.tiers?.name}</span>
            </div>
          </div>
        )}

        {(application.status === 'pending' || application.status === 'under_review') && (
          <div className="bg-yellow-50 text-yellow-800 text-sm p-3 rounded-lg font-medium mb-8">
            This usually takes 3–5 business days.
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          {(application.status === 'pending' || application.status === 'under_review') && (
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full bg-indigo-600 text-white font-medium py-3 rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Back to Dashboard
            </button>
          )}

          {application.status === 'approved' && (
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full bg-green-600 text-white font-medium py-3 rounded-xl hover:bg-green-700 transition-colors"
            >
              Go to Dashboard
            </button>
          )}

          {application.status === 'rejected' && (
            <div className="flex gap-3">
              <button 
                onClick={handleReapply}
                className="flex-1 bg-indigo-600 text-white font-medium py-3 rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Apply again
              </button>
              <button 
                onClick={() => navigate('/contact')}
                className="flex-1 bg-white border border-gray-300 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Contact us
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
