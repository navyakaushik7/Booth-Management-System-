import { useState } from 'react';
import { Plus, Sun, Moon } from 'lucide-react';
import { createWard } from '../lib/api';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Settings() {
  const { user } = useAuth();
  const { wards, refreshBooths, refreshSchemes } = useData();
  const { theme, toggleTheme } = useTheme();
  const [newWard, setNewWard] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleAddWard = async (e) => {
    e.preventDefault();
    if (!newWard.trim()) return;
    setBusy(true);
    setError('');
    try {
      await createWard({ name: newWard.trim() });
      setNewWard('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add ward');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink dark:text-paper">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Account and system preferences</p>
      </div>

      <div className="bg-white dark:bg-ink-light border border-black/10 dark:border-white/10 rounded-2xl p-5 mb-6">
        <h3 className="font-semibold text-ink dark:text-paper mb-3 text-sm">Account</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Name</dt><dd className="text-ink dark:text-paper">{user?.name}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Phone</dt><dd className="text-ink dark:text-paper font-mono text-xs">{user?.phone}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Role</dt><dd className="text-ink dark:text-paper uppercase text-xs">{user?.role}</dd></div>
          {user?.role !== 'admin' && (
            <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Ward</dt><dd className="text-ink dark:text-paper">{user?.wardName}</dd></div>
          )}
        </dl>
      </div>

      <div className="bg-white dark:bg-ink-light border border-black/10 dark:border-white/10 rounded-2xl p-5 mb-6">
        <h3 className="font-semibold text-ink dark:text-paper mb-3 text-sm">Appearance</h3>
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:bg-white/20 text-ink dark:text-paper text-xs font-semibold"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          Switch to {theme === 'dark' ? 'light' : 'dark'} mode
        </button>
      </div>

      {user?.role === 'admin' && (
        <div className="bg-white dark:bg-ink-light border border-black/10 dark:border-white/10 rounded-2xl p-5">
          <h3 className="font-semibold text-ink dark:text-paper mb-3 text-sm">Wards</h3>
          <div className="space-y-1.5 mb-4">
            {wards.map((w) => (
              <div key={w.id} className="text-sm text-ink/80 dark:text-paper/80 py-1 border-b border-black/5 dark:border-white/5 last:border-0">{w.name}</div>
            ))}
          </div>
          <form onSubmit={handleAddWard} className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">New ward name</label>
              <input value={newWard} onChange={(e) => setNewWard(e.target.value)}
                className="w-full bg-paper dark:bg-ink border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-ink dark:text-paper" />
            </div>
            <button type="submit" disabled={busy} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brass hover:bg-brass-light text-ink dark:text-paper text-xs font-semibold disabled:opacity-60">
              <Plus className="w-4 h-4" /> Add Ward
            </button>
          </form>
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </div>
      )}
    </div>
  );
}
