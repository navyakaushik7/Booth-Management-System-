import { useState } from 'react';
import { Plus, Trash2, Gift } from 'lucide-react';
import { createScheme, deleteScheme } from '../lib/api';
import { useData } from '../context/DataContext';

export default function Schemes() {
  const { schemes, wardId, refreshSchemes } = useData();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [adding, setAdding] = useState(false);

  const grouped = schemes.reduce((acc, s) => {
    (acc[s.category] = acc[s.category] || []).push(s);
    return acc;
  }, {});

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim() || !category.trim()) return;
    setAdding(true);
    try {
      await createScheme({ name: name.trim(), category: category.trim(), ward_id: wardId });
      setName('');
      setCategory('');
      await refreshSchemes();
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (scheme) => {
    if (!window.confirm(`Delete scheme "${scheme.name}"? Voters enrolled in it will be unassigned.`)) return;
    await deleteScheme(scheme.id);
    await refreshSchemes();
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink dark:text-paper">Schemes</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Welfare scheme categories and sub-schemes for this ward</p>
      </div>

      <form onSubmit={handleAdd} className="bg-white dark:bg-ink-light border border-black/10 dark:border-white/10 rounded-2xl p-4 mb-6 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Category</label>
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Welfare / Education / Housing..."
            className="w-full bg-paper dark:bg-ink border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-ink dark:text-paper" />
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Scheme name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Old Age Pension"
            className="w-full bg-paper dark:bg-ink border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-ink dark:text-paper" />
        </div>
        <button type="submit" disabled={adding} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brass hover:bg-brass-light text-ink dark:text-paper text-xs font-semibold disabled:opacity-60">
          <Plus className="w-4 h-4" /> Add Scheme
        </button>
      </form>

      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16 border border-dashed border-black/10 dark:border-white/10 rounded-2xl text-slate-500 dark:text-slate-400 text-sm">
          No schemes yet — add one above.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <h3 className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold mb-2">{cat}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((s) => (
                  <div key={s.id} className="bg-white dark:bg-ink-light border border-black/10 dark:border-white/10 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Gift className="w-4 h-4 text-brass dark:text-brass-light" />
                      <div>
                        <p className="text-sm font-medium text-ink dark:text-paper">{s.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{s.enrolled_count} enrolled</p>
                      </div>
                    </div>
                    <button onClick={() => handleDelete(s)} className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-400 hover:bg-red-500/10">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
