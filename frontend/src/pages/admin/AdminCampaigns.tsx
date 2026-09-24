import React, { useState, useEffect } from 'react';
import { Mail, Send, Users, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { fetchApi } from '../../lib/apiClient';
import { AdminButton } from './AdminButton';

interface Contact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  source: string;
  tags: string[];
  is_subscribed_email: boolean;
  created_at: string;
}

export function AdminCampaigns() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Broadcast State
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [targetTags, setTargetTags] = useState<string[]>(['all']);
  
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{success: boolean, message: string} | null>(null);

  const loadContacts = async () => {
    try {
      const { data } = await fetchApi<Contact[]>('/admin/campaigns/audience');
      if (data) setContacts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('Are you sure you want to broadcast this email? This cannot be undone.')) return;
    
    setSending(true);
    setSendResult(null);
    try {
      const response = await fetchApi<{ success: boolean, message: string }>('/admin/campaigns/send', {
        method: 'POST',
        body: JSON.stringify({
          subject,
          html: htmlContent,
          targetTags
        })
      });
      
      if (response.error) throw new Error(response.error);
      
      setSendResult({ success: true, message: response.data?.message || 'Campaign sent successfully!' });
      setSubject('');
      setHtmlContent('');
    } catch (err: any) {
      setSendResult({ success: false, message: err.message || 'Failed to send campaign' });
    } finally {
      setSending(false);
    }
  };

  // Get unique tags for the filter dropdown
  const uniqueTags = Array.from(new Set(contacts.flatMap(c => c.tags || []))).filter(Boolean);

  if (loading) {
    return <div className="p-8 text-brand-navy/60">Loading CRM data...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">Campaigns & Audience CRM</h1>
        <p className="text-brand-navy/60">Manage your audience list and send broadcast emails.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Composer Column */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-brand-navy/5 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-brand-teal/10 flex items-center justify-center">
                <Send className="w-5 h-5 text-brand-teal" />
              </div>
              <h2 className="text-xl font-bold text-brand-navy">Broadcast Campaign</h2>
            </div>

            {sendResult && (
              <div className={`p-4 mb-6 rounded-xl text-sm flex items-start gap-2 ${sendResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {sendResult.success ? <CheckCircle2 className="w-4 h-4 mt-0.5" /> : <ShieldAlert className="w-4 h-4 mt-0.5" />}
                {sendResult.message}
              </div>
            )}

            <form onSubmit={handleSendCampaign} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-brand-navy mb-1.5">Target Audience</label>
                <select
                  value={targetTags[0]}
                  onChange={(e) => setTargetTags([e.target.value])}
                  className="w-full px-4 py-2.5 rounded-xl border border-brand-navy/10 bg-brand-gray focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal/20"
                >
                  <option value="all">All Subscribed Contacts</option>
                  {uniqueTags.map(tag => (
                    <option key={tag} value={tag}>Has Tag: {tag}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-navy mb-1.5">Email Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-brand-navy/10 bg-brand-gray focus:outline-none focus:border-brand-teal"
                  placeholder="e.g. Monthly Newsletter - IOCA"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-navy mb-1.5">Email Body (HTML/Text)</label>
                <textarea
                  required
                  rows={10}
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-brand-navy/10 bg-brand-gray focus:outline-none focus:border-brand-teal"
                  placeholder="<p>Hello,</p><p>Write your HTML or plain text email here...</p>"
                />
                <p className="text-xs text-brand-navy/40 mt-1">You can use HTML tags like &lt;b&gt;, &lt;p&gt;, and &lt;a&gt; for formatting.</p>
              </div>

              <div className="pt-2">
                <AdminButton type="submit" disabled={sending} className="w-full flex justify-center items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {sending ? 'Sending Broadcast...' : 'Send Campaign'}
                </AdminButton>
              </div>
            </form>
          </div>
        </div>

        {/* Stats Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-brand-navy text-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-brand-teal" />
              <h3 className="font-bold">Total Audience</h3>
            </div>
            <div className="text-4xl font-extrabold mb-1">{contacts.length}</div>
            <p className="text-sm text-white/60">contacts synced from all forms</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-brand-navy/5 p-6">
            <h3 className="font-bold text-brand-navy mb-4">Audience Tags</h3>
            {uniqueTags.length === 0 ? (
              <p className="text-sm text-brand-navy/40">No tags found.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {uniqueTags.map(tag => (
                  <span key={tag} className="px-2.5 py-1 rounded-md bg-brand-teal/10 text-brand-teal text-xs font-bold uppercase tracking-wider">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-brand-navy/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-brand-navy/5 bg-brand-gray/30">
          <h2 className="font-bold text-brand-navy">Contact List</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-brand-navy">
            <thead className="bg-brand-gray/50 text-brand-navy/60 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Tags</th>
                <th className="px-6 py-3 font-medium">Subscribed</th>
                <th className="px-6 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-navy/5">
              {contacts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-brand-navy/50">
                    No contacts found. Run the SQL migration to sync existing users.
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-brand-gray/20 transition-colors">
                    <td className="px-6 py-4 font-medium">{contact.email}</td>
                    <td className="px-6 py-4">{contact.first_name} {contact.last_name || ''}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {contact.tags?.map(t => (
                          <span key={t} className="px-1.5 py-0.5 rounded bg-brand-navy/5 text-brand-navy/60 text-[10px] uppercase font-bold">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {contact.is_subscribed_email ? (
                        <span className="text-green-600 font-medium">Yes</span>
                      ) : (
                        <span className="text-red-500">Unsubscribed</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-brand-navy/60">
                      {new Date(contact.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
