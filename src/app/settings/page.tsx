'use client';

import { useState, useEffect } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { Save, Building2, Sliders, FileText } from 'lucide-react';
import type { BusinessProfile, Settings as SettingsType } from '@/lib/types';

export default function SettingsPage() {
  const { data: businessArr, mutate: mutateBiz } = useSWR('/api/business/', (url: string) => fetch(url).then((r) => r.json()));
  const { data: settingsArr, mutate: mutateSet } = useSWR('/api/settings/', (url: string) => fetch(url).then((r) => r.json()));

  const business = (businessArr as BusinessProfile[] | undefined)?.[0];
  const settings = (settingsArr as SettingsType[] | undefined)?.[0];

  const [bizForm, setBizForm] = useState<any>({});
  const [setForm, setSetForm] = useState<any>({});
  const [saved, setSaved] = useState(false);

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

  if (!business || !settings) return <div className="text-center text-slate-400 py-10">Loading settings...</div>;

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
          <Input label="GSTIN" value={bizForm.gstin || ''} onChange={(e) => setBiz('gstin', e.target.value)} />
          <Select label="State" value={bizForm.state || ''} onChange={(e) => setBiz('state', e.target.value)}>
            {['Karnataka', 'Maharashtra', 'Tamil Nadu', 'Delhi', 'Gujarat', 'Telangana', 'West Bengal', 'Uttar Pradesh', 'Rajasthan', 'Kerala', 'Other'].map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <div className="col-span-2"><Input label="Address" value={bizForm.address || ''} onChange={(e) => setBiz('address', e.target.value)} /></div>
          <Select label="Currency" value={bizForm.currency || '₹'} onChange={(e) => setBiz('currency', e.target.value)}>
            <option value="₹">₹ (INR)</option><option value="$">$ (USD)</option><option value="€">€ (EUR)</option>
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
    </div>
  );
}
