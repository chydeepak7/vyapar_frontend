'use client';

import { useState, useEffect } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { api, firstRecord } from '@/lib/api';
import { API_BASE } from '@/lib/config';
import { Save, Building2, Sliders, FileText, Lock, Eye, EyeOff } from 'lucide-react';
import type { BusinessProfile, Settings as SettingsType } from '@/lib/types';

export default function SettingsPage() {
  const { data: businessArr, error: bizError, isLoading: bizLoading, mutate: mutateBiz } = useSWR(`${API_BASE}/business/`);
  const { data: settingsArr, error: setError, isLoading: setLoading, mutate: mutateSet } = useSWR(`${API_BASE}/settings/`);

  const business = firstRecord<BusinessProfile>(businessArr);
  const settings = firstRecord<SettingsType>(settingsArr);

  const [bizForm, setBizForm] = useState<any>({});
  const [setForm, setSetForm] = useState<any>({});
  const [saved, setSaved] = useState(false);

  // Password change state
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (business) setBizForm({ ...business });
  }, [business]);
  useEffect(() => {
    if (settings) setSetForm({ ...settings });
  }, [settings]);

  const setBiz = (field: string, value: string | number) => setBizForm((p: any) => ({ ...p, [field]: value }));
  const setSet = (field: string, value: string | number | boolean) => setSetForm((p: any) => ({ ...p, [field]: value }));

  const saveBusiness = async () => {
    if (!business) return;
    await api.updateBusiness(business.id, bizForm);
    mutateBiz();
    showSaved();
  };

  const saveSettings = async () => {
    if (!settings) return;
    await api.updateSettings(settings.id, setForm);
    mutateSet();
    showSaved();
  };

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (!pwForm.old_password || !pwForm.new_password || !pwForm.confirm_password) {
      setPwError('All fields are required.');
      return;
    }
    if (pwForm.new_password.length < 6) {
      setPwError('New password must be at least 6 characters.');
      return;
    }
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwError('New passwords do not match.');
      return;
    }

    setPwLoading(true);
    try {
      const res = await api.changePassword(pwForm.old_password, pwForm.new_password);
      setPwSuccess(res.detail || 'Password changed successfully!');
      setPwForm({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err: any) {
      // Extract the detail message from the error string "API 400: {...}"
      const msg = err?.message || '';
      try {
        const json = JSON.parse(msg.replace(/^API \d+: /, ''));
        setPwError(json.detail || 'Failed to change password.');
      } catch {
        setPwError('Current password is incorrect.');
      }
    } finally {
      setPwLoading(false);
    }
  };

  // Show error state if either fetch failed
  const hasError = bizError || setError;
  const isLoading = bizLoading || setLoading;

  if (hasError && !business && !settings) {
    return (
      <div className="text-center py-10 space-y-3">
        <p className="text-red-500 text-sm">Failed to load settings. Please check your connection and try again.</p>
        <Button onClick={() => { mutateBiz(); mutateSet(); }}>Retry</Button>
      </div>
    );
  }

  if (isLoading && (!business || !settings)) {
    return <div className="text-center text-slate-400 py-10">Loading settings...</div>;
  }

  if (!business || !settings) {
    return (
      <div className="text-center py-10 space-y-3">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-vyapar-600" />
        <p className="text-slate-400 text-sm">Setting up your account...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {saved && <div className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-600">Settings saved successfully!</div>}

      {/* Business Profile */}
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Building2 size={18} className="text-vyapar-600" />
          <h3 className="text-sm font-semibold text-slate-700">Business Profile</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Input label="Business Name" value={bizForm.name || ''} onChange={(e) => setBiz('name', e.target.value)} /></div>
          <Input label="Phone" value={bizForm.phone || ''} onChange={(e) => setBiz('phone', e.target.value)} />
          <Input label="Email" value={bizForm.email || ''} onChange={(e) => setBiz('email', e.target.value)} />
          <Input label="PAN" value={bizForm.gstin || ''} onChange={(e) => setBiz('gstin', e.target.value)} />
          <Select label="Province" value={bizForm.state || ''} onChange={(e) => setBiz('state', e.target.value)}>
            {['Koshi Province', 'Madhesh Province', 'Bagmati Province', 'Gandaki Province', 'Lumbini Province', 'Karnali Province', 'Sudurpashchim Province'].map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <div className="col-span-2"><Input label="Address" value={bizForm.address || ''} onChange={(e) => setBiz('address', e.target.value)} /></div>
          <Select label="Currency" value={bizForm.currency || 'रू'} onChange={(e) => setBiz('currency', e.target.value)}>
            <option value="रू">रू (NPR)</option><option value="$">$ (USD)</option><option value="€">€ (EUR)</option>
          </Select>
          <Input label="Decimal Places" type="number" value={bizForm.decimal_places ?? 2} onChange={(e) => setBiz('decimal_places', +e.target.value)} />
        </div>
        <div className="mt-4 flex justify-end"><Button onClick={saveBusiness}><Save size={15} className="mr-1" /> Save Business Profile</Button></div>
      </Card>

      {/* Invoice / Transaction Settings */}
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <FileText size={18} className="text-vyapar-600" />
          <h3 className="text-sm font-semibold text-slate-700">Transaction &amp; Invoice Prefixes</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Input label="Sale Invoice" value={setForm.invoice_prefix || ''} onChange={(e) => setSet('invoice_prefix', e.target.value)} />
          <Input label="Purchase Bill" value={setForm.purchase_prefix || ''} onChange={(e) => setSet('purchase_prefix', e.target.value)} />
          <Input label="Estimate" value={setForm.estimate_prefix || ''} onChange={(e) => setSet('estimate_prefix', e.target.value)} />
          <Input label="Payment-In" value={setForm.payment_in_prefix || ''} onChange={(e) => setSet('payment_in_prefix', e.target.value)} />
          <Input label="Payment-Out" value={setForm.payment_out_prefix || ''} onChange={(e) => setSet('payment_out_prefix', e.target.value)} />
          <Input label="Credit Note" value={setForm.credit_note_prefix || ''} onChange={(e) => setSet('credit_note_prefix', e.target.value)} />
          <Input label="Debit Note" value={setForm.debit_note_prefix || ''} onChange={(e) => setSet('debit_note_prefix', e.target.value)} />
          <Input label="Payment Terms (days)" value={setForm.default_payment_terms || '30'} onChange={(e) => setSet('default_payment_terms', e.target.value)} />
        </div>
        <div className="mt-4 flex justify-end"><Button onClick={saveSettings}><Save size={15} className="mr-1" /> Save Settings</Button></div>
      </Card>

      {/* GST & Tax Settings */}
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Sliders size={18} className="text-vyapar-600" />
          <h3 className="text-sm font-semibold text-slate-700">GST &amp; Tax Settings</h3>
        </div>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={setForm.enable_gst ?? true} onChange={(e) => setSet('enable_gst', e.target.checked)} className="rounded" /> Enable GST</label>
          <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={setForm.inclusive_tax ?? false} onChange={(e) => setSet('inclusive_tax', e.target.checked)} className="rounded" /> Tax Inclusive Prices (item rate includes GST)</label>
          <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={setForm.round_off ?? true} onChange={(e) => setSet('round_off', e.target.checked)} className="rounded" /> Round Off Transaction Amount</label>
          <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={setForm.print_company_info ?? true} onChange={(e) => setSet('print_company_info', e.target.checked)} className="rounded" /> Print Company Info on Invoices</label>
          <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={setForm.print_terms ?? true} onChange={(e) => setSet('print_terms', e.target.checked)} className="rounded" /> Print Terms &amp; Conditions on Invoices</label>
        </div>
        <div className="mt-4 flex justify-end"><Button onClick={saveSettings}><Save size={15} className="mr-1" /> Save Settings</Button></div>
      </Card>

      {/* Change Password */}
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Lock size={18} className="text-vyapar-600" />
          <h3 className="text-sm font-semibold text-slate-700">Change Password</h3>
        </div>

        {pwError && (
          <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{pwError}</div>
        )}
        {pwSuccess && (
          <div className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-600">{pwSuccess}</div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3">
          {/* Current Password */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Current Password</label>
            <div className="flex items-center rounded-lg border border-slate-300 px-3 focus-within:border-vyapar-500 focus-within:ring-1 focus-within:ring-vyapar-500">
              <input
                type={showOld ? 'text' : 'password'}
                value={pwForm.old_password}
                onChange={(e) => setPwForm((p) => ({ ...p, old_password: e.target.value }))}
                className="w-full bg-transparent py-2 text-sm outline-none"
                placeholder="Enter current password"
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowOld((v) => !v)} className="ml-2 text-slate-400 hover:text-slate-600">
                {showOld ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">New Password</label>
            <div className="flex items-center rounded-lg border border-slate-300 px-3 focus-within:border-vyapar-500 focus-within:ring-1 focus-within:ring-vyapar-500">
              <input
                type={showNew ? 'text' : 'password'}
                value={pwForm.new_password}
                onChange={(e) => setPwForm((p) => ({ ...p, new_password: e.target.value }))}
                className="w-full bg-transparent py-2 text-sm outline-none"
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowNew((v) => !v)} className="ml-2 text-slate-400 hover:text-slate-600">
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Confirm New Password</label>
            <div className="flex items-center rounded-lg border border-slate-300 px-3 focus-within:border-vyapar-500 focus-within:ring-1 focus-within:ring-vyapar-500">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={pwForm.confirm_password}
                onChange={(e) => setPwForm((p) => ({ ...p, confirm_password: e.target.value }))}
                className="w-full bg-transparent py-2 text-sm outline-none"
                placeholder="Repeat new password"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowConfirm((v) => !v)} className="ml-2 text-slate-400 hover:text-slate-600">
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button type="submit" disabled={pwLoading}>
              <Lock size={15} className="mr-1" />
              {pwLoading ? 'Changing...' : 'Change Password'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
