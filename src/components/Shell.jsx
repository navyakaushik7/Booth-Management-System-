import { LayoutDashboard, Users, Landmark, Gift, FileBarChart, ShieldCheck, Settings as SettingsIcon, LogOut, Sun, Moon, Wifi } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';

const NAV_ITEMS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'register', label: 'Voter Register', icon: Users },
  { key: 'booths', label: 'Booth-wise View', icon: Landmark },
  { key: 'schemes', label: 'Schemes', icon: Gift },
  { key: 'reports', label: 'Reports', icon: FileBarChart },
  { key: 'staff', label: 'Staff & Access', icon: ShieldCheck, adminOnly: true },
  { key: 'settings', label: 'Settings', icon: SettingsIcon }
];

export default function Shell({ page, onNavigate, children }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { wards, selectedWardId, setSelectedWardId, wardId } = useData();

  const wardLabel = user?.role === 'admin'
    ? (wards.find((w) => w.id === selectedWardId)?.name || 'All wards')
    : user?.wardName;

  return (
    <div className="min-h-screen bg-paper dark:bg-ink flex">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-black/10 dark:border-white/10 bg-white/70 dark:bg-ink-light/60 flex flex-col">
        <div className="px-5 py-5 border-b border-black/10 dark:border-white/10 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brass/15 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-brass dark:text-brass-light" />
          </div>
          <div>
            <p className="text-sm font-bold text-ink dark:text-paper leading-tight">Booth Management</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">System</p>
          </div>
        </div>
        <nav className="flex-1 py-3 px-2 space-y-1">
          {NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === 'admin').map((item) => {
            const Icon = item.icon;
            const active = page === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-brass/15 text-brass dark:text-brass-light font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-ink dark:hover:text-paper hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="px-4 py-4 border-t border-black/10 dark:border-white/10">
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-500 dark:text-slate-400 hover:text-seal-red hover:bg-seal-red/10 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Log out
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-black/10 dark:border-white/10 bg-white/50 dark:bg-ink-light/40 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Signed in as</span>
            <span className="text-sm font-semibold text-ink dark:text-paper">{user?.name}</span>
            <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-slate-500 dark:text-slate-400">{user?.role}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-seal-green dark:text-emerald-400">
              <Wifi className="w-3.5 h-3.5" /> Live
            </div>

            {user?.role === 'admin' ? (
              <select
                value={selectedWardId ?? ''}
                onChange={(e) => setSelectedWardId(e.target.value ? parseInt(e.target.value, 10) : null)}
                className="bg-paper dark:bg-ink border border-black/10 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-ink dark:text-paper"
              >
                <option value="">All wards</option>
                {wards.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            ) : (
              <span className="text-xs text-slate-500 dark:text-slate-400">{wardLabel}</span>
            )}

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-ink dark:hover:text-paper hover:bg-black/5 dark:hover:bg-white/10"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
