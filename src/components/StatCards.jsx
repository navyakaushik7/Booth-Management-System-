import React from 'react';
import { Users, CheckCircle2, Clock, Landmark, Vote } from 'lucide-react';

export default function StatCards({ stats }) {
  if (!stats) return null;
  const items = [
    { title: 'Total Voters', value: stats.totalVoters, icon: Users, color: 'text-blue-400' },
    { title: 'Voted Count', value: stats.votedCount, icon: CheckCircle2, color: 'text-emerald-400' },
    { title: 'Pending Votes', value: stats.pendingCount, icon: Clock, color: 'text-amber-400' },
    { title: 'Turnout %', value: `${stats.turnoutPercentage}%`, icon: Vote, color: 'text-purple-400' },
    { title: 'Total Booths', value: stats.totalBooths, icon: Landmark, color: 'text-cyan-400' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div key={idx} className="p-4 rounded-xl bg-white dark:bg-ink-light border border-black/10 dark:border-white/10 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold">{item.title}</span>
              <Icon className={`w-5 h-5 ${item.color}`} />
            </div>
            <div className="text-2xl font-bold text-ink dark:text-paper">{item.value}</div>
          </div>
        );
      })}
    </div>
  );
}
