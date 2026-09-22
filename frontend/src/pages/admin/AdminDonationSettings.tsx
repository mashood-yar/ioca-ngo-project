import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Settings, Loader2 } from 'lucide-react';
import { fetchApi } from '../../lib/apiClient';
import { AdminButton } from './AdminButton';

interface PaymentMethod {
  id?: string;
  type: string;
  provider_name: string;
  account_title: string;
  account_number: string;
  iban?: string;
  is_active: boolean;
}

export function AdminDonationSettings() {
  const [donationsEnabled, setDonationsEnabled] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [savingMethod, setSavingMethod] = useState<string | null>(null); // method id being saved
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newMethod, setNewMethod] = useState<PaymentMethod>({
    type: 'Bank Transfer',
    provider_name: '',
    account_title: '',
    account_number: '',
    iban: '',
    is_active: true
  });

  const loadSettings = async () => {
    try {
      setLoading(true);
      // Load global toggle from site-settings
      const { data: settingsData, error: settingsError } = await fetchApi<Record<string, string>>('/site-settings');
      if (settingsData && settingsData.donations_enabled === 'true') {
        setDonationsEnabled(true);
      }

      // Load payment methods
      const { data: methodsData, error: methodsError } = await fetchApi<PaymentMethod[]>('/payment-methods');
      if (methodsData) {
        setPaymentMethods(methodsData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveGlobal = async () => {
    try {
      setSavingGlobal(true);
      const { error } = await fetchApi('/site-settings', {
        method: 'PATCH',
        body: JSON.stringify({ donations_enabled: donationsEnabled.toString() })
      });
      if (error) throw new Error(error);
      window.dispatchEvent(new CustomEvent('app-toast', { 
        detail: { message: 'Donation settings updated successfully.', variant: 'success' } 
      }));
    } catch (err: any) {
      window.dispatchEvent(new CustomEvent('app-toast', { 
        detail: { message: err.message || 'Failed to update settings.', variant: 'error' } 
      }));
    } finally {
      setSavingGlobal(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      setSavingMethod(id);
      const { error } = await fetchApi(`/payment-methods/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !currentStatus })
      });
      if (error) throw new Error(error);
      setPaymentMethods(prev => prev.map(m => m.id === id ? { ...m, is_active: !currentStatus } : m));
    } catch (err: any) {
      window.dispatchEvent(new CustomEvent('app-toast', { 
        detail: { message: err.message || 'Failed to update payment method.', variant: 'error' } 
      }));
    } finally {
      setSavingMethod(null);
    }
  };

  const handleDeleteMethod = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this payment method? This cannot be undone.')) return;
    try {
      setSavingMethod(id);
      const { error } = await fetchApi(`/payment-methods/${id}`, {
        method: 'DELETE'
      });
      if (error) throw new Error(error);
      setPaymentMethods(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      window.dispatchEvent(new CustomEvent('app-toast', { 
        detail: { message: err.message || 'Failed to delete payment method.', variant: 'error' } 
      }));
    } finally {
      setSavingMethod(null);
    }
  };

  const handleSaveNewMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingMethod('new');
      const { data, error } = await fetchApi<PaymentMethod>('/payment-methods', {
        method: 'POST',
        body: JSON.stringify(newMethod)
      });
      if (error) throw new Error(error);
      if (data) {
        setPaymentMethods([data, ...paymentMethods]);
        setIsAddingNew(false);
        setNewMethod({
          type: 'Bank Transfer',
          provider_name: '',
          account_title: '',
          account_number: '',
          iban: '',
          is_active: true
        });
        window.dispatchEvent(new CustomEvent('app-toast', { 
          detail: { message: 'Payment method added successfully.', variant: 'success' } 
        }));
      }
    } catch (err: any) {
      window.dispatchEvent(new CustomEvent('app-toast', { 
        detail: { message: err.message || 'Failed to add payment method.', variant: 'error' } 
      }));
    } finally {
      setSavingMethod(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-brand-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Global Status Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-brand-teal" />
              Global Donation Status
            </h3>
            <p className="text-sm text-slate-500 mt-1">Enable or pause the public acceptance of new donations on the website.</p>
          </div>
          <AdminButton 
            onClick={handleSaveGlobal} 
            disabled={savingGlobal}
            icon={<Save className="w-4 h-4" />}
          >
            {savingGlobal ? 'Saving...' : 'Save Status'}
          </AdminButton>
        </div>
        <div className="p-6">
          <label className="relative flex items-center cursor-pointer gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={donationsEnabled}
              onChange={(e) => setDonationsEnabled(e.target.checked)}
            />
            <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[18px] after:left-[20px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-brand-teal"></div>
            <span className="text-sm font-bold text-slate-900">
              {donationsEnabled ? '🟢 Donations are ENABLED and accepting funds' : '🔴 Donations are PAUSED on the website'}
            </span>
          </label>
        </div>
      </div>

      {/* Payment Methods Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Payment Gateways & Accounts</h3>
            <p className="text-sm text-slate-500 mt-1">Manage the bank accounts and mobile wallets users will transfer money to.</p>
          </div>
          <AdminButton 
            onClick={() => setIsAddingNew(!isAddingNew)} 
            icon={isAddingNew ? <Trash2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            variant={isAddingNew ? 'ghost' : 'primary'}
          >
            {isAddingNew ? 'Cancel' : 'Add Account'}
          </AdminButton>
        </div>
        <div className="p-6 space-y-6">
          
          {isAddingNew && (
            <form onSubmit={handleSaveNewMethod} className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4 mb-8">
              <h4 className="font-bold text-slate-900 mb-4">Add New Payment Account</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Account Type</label>
                  <select 
                    value={newMethod.type}
                    onChange={(e) => setNewMethod({...newMethod, type: e.target.value})}
                    className="w-full rounded-lg border-slate-300 shadow-sm focus:border-brand-teal focus:ring-brand-teal"
                    required
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="EasyPaisa">EasyPaisa</option>
                    <option value="JazzCash">JazzCash</option>
                    <option value="Other">Other Wallet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Provider Name</label>
                  <input 
                    type="text" 
                    value={newMethod.provider_name}
                    onChange={(e) => setNewMethod({...newMethod, provider_name: e.target.value})}
                    placeholder="e.g. Meezan Bank, Telenor Bank"
                    className="w-full rounded-lg border-slate-300 shadow-sm focus:border-brand-teal focus:ring-brand-teal"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Account Title</label>
                  <input 
                    type="text" 
                    value={newMethod.account_title}
                    onChange={(e) => setNewMethod({...newMethod, account_title: e.target.value})}
                    placeholder="e.g. IOCA NGO"
                    className="w-full rounded-lg border-slate-300 shadow-sm focus:border-brand-teal focus:ring-brand-teal"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Account Number</label>
                  <input 
                    type="text" 
                    value={newMethod.account_number}
                    onChange={(e) => setNewMethod({...newMethod, account_number: e.target.value})}
                    placeholder="Account Number or Mobile Number"
                    className="w-full rounded-lg border-slate-300 shadow-sm focus:border-brand-teal focus:ring-brand-teal"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">IBAN (Optional)</label>
                  <input 
                    type="text" 
                    value={newMethod.iban}
                    onChange={(e) => setNewMethod({...newMethod, iban: e.target.value})}
                    placeholder="PK..."
                    className="w-full rounded-lg border-slate-300 shadow-sm focus:border-brand-teal focus:ring-brand-teal"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <AdminButton type="submit" disabled={savingMethod === 'new'}>
                  {savingMethod === 'new' ? 'Saving...' : 'Save Payment Method'}
                </AdminButton>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {paymentMethods.length === 0 && !isAddingNew ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                <p className="text-slate-500 font-medium">No payment accounts found. Add one above.</p>
              </div>
            ) : (
              paymentMethods.map(method => (
                <div key={method.id} className={`flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl border ${method.is_active ? 'border-green-200 bg-green-50/30' : 'border-slate-200 bg-slate-50'} gap-4`}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${method.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                        {method.type}
                      </span>
                      <h4 className="font-bold text-slate-900">{method.provider_name}</h4>
                    </div>
                    <p className="text-sm text-slate-600 font-medium">{method.account_title}</p>
                    <p className="text-sm font-mono text-slate-900 mt-1">{method.account_number}</p>
                    {method.iban && <p className="text-xs font-mono text-slate-500">{method.iban}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => method.id && handleToggleActive(method.id, method.is_active)}
                      disabled={savingMethod === method.id}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${method.is_active ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-green-600 text-white hover:bg-green-700'}`}
                    >
                      {savingMethod === method.id ? '...' : (method.is_active ? 'Deactivate' : 'Activate')}
                    </button>
                    <button 
                      onClick={() => method.id && handleDeleteMethod(method.id)}
                      disabled={savingMethod === method.id}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
