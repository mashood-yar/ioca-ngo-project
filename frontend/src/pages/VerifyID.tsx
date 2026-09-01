import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, User, Briefcase } from 'lucide-react';
import SEO from '../components/SEO';
import { PageLoadingSpinner } from '../components/PageLoadingSpinner';
import { optimizeImage } from '../lib/optimizeImage';
import { fetchApi } from '../lib/apiClient';
import type { Personnel } from '../types';

type VerifyPerson = Pick<Personnel, 'id' | 'full_name' | 'category' | 'title' | 'profile_image_url' | 'status'>;

export const VerifyID: React.FC = () => {
  const { uid } = useParams();
  const [person, setPerson] = useState<VerifyPerson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setError('No ID provided');
      setLoading(false);
      return;
    }

    fetchApi<VerifyPerson>(`/verify/${uid}`)
      .then(({ data, error: apiError }) => {
        if (apiError || !data) {
          setError(apiError || 'Personnel not found');
        } else {
          setPerson(data);
        }
      })
      .catch(() => setError('Connection error'))
      .finally(() => setLoading(false));
  }, [uid]);

  if (loading) return <PageLoadingSpinner />;

  const isActive = person?.status === 'active';
  const themeColor = isActive ? 'text-green-600' : 'text-red-600';
  const bgColor = isActive ? 'bg-green-50' : 'bg-red-50';
  const borderColor = isActive ? 'border-green-200' : 'border-red-200';

  return (
    <>
      <SEO title="ID Verification | IOCA" description="Verify IOCA Personnel ID" />
      <div className="py-24 bg-brand-gray flex items-center justify-center p-4">
        {/* M-06: rounded-2xl → rounded-xl to match brand shape language */}
        <div className={`max-w-md w-full bg-white rounded-xl shadow-2xl overflow-hidden border ${borderColor}`}>
          
          <div className={`${bgColor} p-6 pb-14 text-center border-b ${borderColor}`}>
            {isActive ? (
              <ShieldCheck className={`w-16 h-16 mx-auto mb-4 ${themeColor}`} />
            ) : (
              <ShieldAlert className={`w-16 h-16 mx-auto mb-4 ${themeColor}`} />
            )}
            <h1 className={`text-2xl font-bold ${themeColor}`}>
              {isActive ? 'Verified ID' : 'Invalid / Suspended ID'}
            </h1>
            <p className="text-brand-navy/60 mt-1 text-sm">International Organization for Community Advancement</p>
          </div>

          {person && (
            <div className="p-6">
              <div className="flex justify-center -mt-16 mb-6">
                <div className={`w-32 h-32 rounded-full overflow-hidden border-4 ${isActive ? 'border-green-500' : 'border-red-500'} bg-white flex items-center justify-center text-brand-navy font-bold text-4xl shadow-md`}>
                  {person.profile_image_url ? (
                    <img
                      src={optimizeImage(person.profile_image_url, { width: 150 })}
                      alt={person.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{person.full_name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
              </div>

              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-brand-navy">{person.full_name}</h2>
                <p className="text-brand-teal font-medium capitalize">{person.category} • {person.title}</p>
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center text-brand-navy/60">
                  <User className="w-5 h-5 mr-3 text-brand-teal" />
                  <div>
                    <p className="text-xs text-brand-navy/40">Unique ID</p>
                    <p className="font-mono">{uid}</p>
                  </div>
                </div>
                <div className="flex items-center text-brand-navy/60">
                  <Briefcase className="w-5 h-5 mr-3 text-brand-teal" />
                  <div>
                    <p className="text-xs text-brand-navy/40">Current Status</p>
                    <p className={`font-semibold uppercase ${themeColor}`}>{person.status}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-8 text-center text-brand-navy/60">
              <ShieldAlert className="w-12 h-12 mx-auto mb-3 text-red-400" />
              <p>{error}</p>
            </div>
          )}

          <div className="bg-brand-navy p-4 text-center">
            <p className="text-white/60 text-xs">Official Verification Portal • IOCA</p>
          </div>
        </div>
      </div>
    </>
  );
};
