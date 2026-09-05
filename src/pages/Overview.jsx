import { useState, useEffect, useCallback } from 'react';
import { getAnalytics, getVoters } from '../lib/api';
import { getSocket } from '../lib/socket';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import StatCards from '../components/StatCards';
import AnalyticsCharts from '../components/charts/AnalyticsCharts';

export default function Overview() {
  const { user } = useAuth();
  const { wardId } = useData();
  const [analytics, setAnalytics] = useState(null);
  const [recentVoters, setRecentVoters] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = wardId ? { ward_id: wardId } : {};
      const [{ data: analyticsData }, { data: votersData }] = await Promise.all([
        getAnalytics(params),
        getVoters({ ...params })
      ]);
      setAnalytics(analyticsData);
      setRecentVoters(votersData.slice(0, 6));
    } finally {
      setLoading(false);
    }
  }, [wardId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    const socket = getSocket();
    const handler = () => fetchAll();
    socket.on('voter:created', handler);
    socket.on('voter:updated', handler);
    socket.on('voter:deleted', handler);
    socket.on('voters:bulk-imported', handler);
    return () => {
      socket.off('voter:created', handler);
      socket.off('voter:updated', handler);
      socket.off('voter:deleted', handler);
      socket.off('voters:bulk-imported', handler);
    };
  }, [fetchAll]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink dark:text-paper">Welcome, {user?.name?.split(' ')[0]}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          {user?.role === 'admin' ? 'Constituency-wide overview' : `${user?.wardName} — dashboard`}
        </p>
      </div>

      {loading && !analytics ? (
        <div className="text-center py-16 text-slate-500 dark:text-slate-400 text-sm">Loading dashboard…</div>
      ) : (
        <>
          <StatCards stats={analytics?.stats} />
          <AnalyticsCharts analytics={analytics} />

          <div className="bg-white dark:bg-ink-light border border-black/10 dark:border-white/10 rounded-2xl p-5">
            <h3 className="font-semibold text-ink dark:text-paper mb-4 text-sm">Recently Added Voters</h3>
            {recentVoters.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No voters yet.</p>
            ) : (
              <div className="divide-y divide-black/10 dark:divide-white/10">
                {recentVoters.map((v) => (
                  <div key={v.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <span className="text-ink dark:text-paper font-medium">{v.name}</span>
                      <span className="text-slate-500 dark:text-slate-400 ml-2 font-mono text-xs">{v.voter_card_id}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${v.has_voted ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {v.has_voted ? 'Voted' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
