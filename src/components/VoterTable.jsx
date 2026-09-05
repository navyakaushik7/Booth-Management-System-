import { Pencil, Trash2, CheckCircle2, Circle } from 'lucide-react';

export default function VoterTable({ voters, onEdit, onDelete, onToggleVoted, loading }) {
  if (loading) {
    return <div className="text-center py-16 text-slate-500 dark:text-slate-400 text-sm">Loading voters…</div>;
  }

  if (voters.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-black/10 dark:border-white/10 rounded-2xl">
        <p className="text-slate-500 dark:text-slate-400 text-sm">No voters match the current filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-ink-light border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 dark:border-white/10 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
              <th className="px-4 py-3 font-medium">Voter ID</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Age</th>
              <th className="px-4 py-3 font-medium">Gender</th>
              <th className="px-4 py-3 font-medium">Booth</th>
              <th className="px-4 py-3 font-medium">Scheme</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {voters.map((v) => (
              <tr key={v.id} className="border-b border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5">
                <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{v.voter_card_id}</td>
                <td className="px-4 py-3 text-ink dark:text-paper font-medium">{v.name}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{v.age}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{v.gender}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{v.booth_name || '—'}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{v.scheme_name || '—'}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onToggleVoted(v)}
                    className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${
                      v.has_voted ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}
                  >
                    {v.has_voted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                    {v.has_voted ? 'Voted' : 'Pending'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => onEdit(v)} className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-brass dark:hover:text-brass-light hover:bg-brass-light/10">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(v)} className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-400 hover:bg-red-500/10">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
