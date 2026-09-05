import { useState, useEffect, useCallback } from 'react';
import { UserPlus, ShieldOff } from 'lucide-react';
import { getStaff, createStaff, deactivateStaff } from '../lib/api';
import { useData } from '../context/DataContext';

export default function Staff() {
  const { wards } = useData();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', phone: '', role: 'mla', ward_id: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getStaff();
      setStaff(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await createStaff({
        name: form.name.trim(),
        phone: form.phone.trim(),
        role: form.role,
        ward_id: form.role === 'mla' ? (form.ward_id ? parseInt(form.ward_id, 10) : undefined) : undefined
      });
      setForm({ name: '', phone: '', role: 'mla', ward_id: '' });
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add account');
    } finally {
      setBusy(false);
    }
  };

  const handleDeactivate = async (member) => {
    if (!window.confirm(`Revoke login access for ${member.name}?`)) return;
    await deactivateStaff(member.id);
    await load();
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink dark:text-paper">Staff & Access</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Accounts with OTP login access to this system</p>
      </div>

      <form onSubmit={handleAdd} className="bg-white dark:bg-ink-light border border-black/10 dark:border-white/10 rounded-2xl p-4 mb-6 flex flex-wrap items-end gap-3">
        <div className="min-w-[140px]">
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Name</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-paper dark:bg-ink border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-ink dark:text-paper" />
        </div>
        <div className="min-w-[160px]">
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Phone (with country code)</label>
          <input required placeholder="+919999900003" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full bg-paper dark:bg-ink border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-ink dark:text-paper" />
        </div>
        <div className="min-w-[120px]">
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Role</label>
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full bg-paper dark:bg-ink border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-ink dark:text-paper">
            <option value="mla">MLA</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        {form.role === 'mla' && (
          <div className="min-w-[160px]">
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Ward</label>
            <select value={form.ward_id} onChange={(e) => setForm({ ...form, ward_id: e.target.value })}
              className="w-full bg-paper dark:bg-ink border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-ink dark:text-paper">
              <option value="">Select ward</option>
              {wards.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
        )}
        <button type="submit" disabled={busy} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brass hover:bg-brass-light text-ink dark:text-paper text-xs font-semibold disabled:opacity-60">
          <UserPlus className="w-4 h-4" /> Add Account
        </button>
      </form>
      {error && <p className="text-xs text-red-400 mb-4">{error}</p>}

      <div className="bg-white dark:bg-ink-light border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-slate-500 dark:text-slate-400 border-b border-black/10 dark:border-white/10">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Ward</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-slate-500 dark:text-slate-400 text-xs">Loading…</td></tr>
            ) : staff.map((s) => (
              <tr key={s.id} className="border-b border-black/5 dark:border-white/5">
                <td className="px-4 py-3 text-ink dark:text-paper">{s.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{s.phone}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400 uppercase text-xs">{s.role}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{s.ward_name || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${s.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-black/5 dark:bg-white/10 text-slate-500 dark:text-slate-400'}`}>
                    {s.is_active ? 'Active' : 'Revoked'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {s.is_active && (
                    <button onClick={() => handleDeactivate(s)} className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-400 hover:bg-red-500/10">
                      <ShieldOff className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
