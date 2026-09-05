import { useState, useEffect, useCallback } from 'react';
import { Download } from 'lucide-react';
import { getAnalytics } from '../lib/api';
import { exportReportToExcel } from '../utils/excelUtils';
import { useData } from '../context/DataContext';

export default function Reports() {
  const { wardId } = useData();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getAnalytics(wardId ? { ward_id: wardId } : {});
      setAnalytics(data);
    } finally {
      setLoading(false);
    }
  }, [wardId]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const handleExport = () => {
    if (!analytics) return;
    exportReportToExcel(
      { wardStats: analytics.wardStats, schemeStats: analytics.schemeDistribution },
      `booth-report-${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-ink dark:text-paper">Reports</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Booth-wise turnout and scheme coverage</p>
        </div>
        <button
          onClick={handleExport}
          disabled={!analytics}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:bg-white/20 text-ink dark:text-paper text-xs font-semibold disabled:opacity-50"
        >
          <Download className="w-4 h-4" /> Export Report (.xlsx)
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 py-10 text-center">Loading report…</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-ink-light border border-black/10 dark:border-white/10 rounded-2xl p-5">
            <h3 className="font-semibold text-ink dark:text-paper mb-4 text-sm">Booth-wise Turnout</h3>
            {analytics?.wardStats?.length ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-slate-500 dark:text-slate-400 border-b border-black/10 dark:border-white/10">
                    <th className="py-2 font-medium">Booth</th>
                    <th className="py-2 font-medium text-right">Voted</th>
                    <th className="py-2 font-medium text-right">Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.wardStats.map((b) => (
                    <tr key={b.name} className="border-b border-black/5 dark:border-white/5">
                      <td className="py-2 text-ink dark:text-paper">{b.name}</td>
                      <td className="py-2 text-right text-emerald-400">{b.voted}</td>
                      <td className="py-2 text-right text-amber-400">{b.pending}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">No booth data yet.</p>
            )}
          </div>

          <div className="bg-white dark:bg-ink-light border border-black/10 dark:border-white/10 rounded-2xl p-5">
            <h3 className="font-semibold text-ink dark:text-paper mb-4 text-sm">Scheme Coverage</h3>
            {analytics?.schemeDistribution?.length ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-slate-500 dark:text-slate-400 border-b border-black/10 dark:border-white/10">
                    <th className="py-2 font-medium">Scheme</th>
                    <th className="py-2 font-medium text-right">Enrolled</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.schemeDistribution.map((s) => (
                    <tr key={s.name} className="border-b border-black/5 dark:border-white/5">
                      <td className="py-2 text-ink dark:text-paper">{s.name}</td>
                      <td className="py-2 text-right text-brass dark:text-brass-light">{s.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">No scheme enrolments yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
