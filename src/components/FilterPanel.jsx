import { Search, Filter } from 'lucide-react';

const AGE_GROUPS = ['18-25', '26-35', '36-45', '46-60', '60+'];

export default function FilterPanel({ filters, onChange, booths, schemes }) {
  const set = (patch) => onChange({ ...filters, ...patch });

  return (
    <div className="bg-white dark:bg-ink-light border border-black/10 dark:border-white/10 rounded-2xl p-4 mb-6 flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
        <input
          type="text"
          placeholder="Search by name or voter ID..."
          value={filters.search || ''}
          onChange={(e) => set({ search: e.target.value })}
          className="w-full bg-paper dark:bg-ink border border-black/10 dark:border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-ink dark:text-paper focus:outline-none focus:ring-2 focus:ring-brass/50"
        />
      </div>

      <select
        value={filters.ageGroup || ''}
        onChange={(e) => set({ ageGroup: e.target.value || undefined })}
        className="bg-paper dark:bg-ink border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-ink dark:text-paper"
      >
        <option value="">All ages</option>
        {AGE_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
      </select>

      <select
        value={filters.booth_id || ''}
        onChange={(e) => set({ booth_id: e.target.value || undefined })}
        className="bg-paper dark:bg-ink border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-ink dark:text-paper"
      >
        <option value="">All booths</option>
        {booths.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>

      <select
        value={filters.scheme_id || ''}
        onChange={(e) => set({ scheme_id: e.target.value || undefined })}
        className="bg-paper dark:bg-ink border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-ink dark:text-paper"
      >
        <option value="">All schemes</option>
        {schemes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>

      <select
        value={filters.has_voted ?? ''}
        onChange={(e) => set({ has_voted: e.target.value || undefined })}
        className="bg-paper dark:bg-ink border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-ink dark:text-paper"
      >
        <option value="">Voted status</option>
        <option value="true">Voted</option>
        <option value="false">Pending</option>
      </select>

      {(filters.search || filters.ageGroup || filters.booth_id || filters.scheme_id || filters.has_voted) && (
        <button
          onClick={() => onChange({})}
          className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-ink/80 dark:text-paper/80 px-2"
        >
          <Filter className="w-3.5 h-3.5" /> Clear filters
        </button>
      )}
    </div>
  );
}
