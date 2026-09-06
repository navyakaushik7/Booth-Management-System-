import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

const COLORS = ['#C08829', '#2F7A4D', '#46586B', '#B23A34', '#DFA94A'];
const OTHER_COLOR = '#9A9284'; // neutral gray-brass for grouped "Other" slices/bars

// Keeps the pie chart legible: shows the top N schemes by enrollment and
// folds everything else into a single "Other" slice.
function groupTopSchemes(schemeDistribution, topN = 5) {
  if (!schemeDistribution || schemeDistribution.length <= topN) {
    return schemeDistribution || [];
  }
  const sorted = [...schemeDistribution].sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, topN);
  const rest = sorted.slice(topN);
  const otherTotal = rest.reduce((sum, s) => sum + s.value, 0);
  return otherTotal > 0
    ? [...top, { name: 'Other', value: otherTotal, isOther: true }]
    : top;
}

// Same idea for the bar chart: with dozens of booths, showing every single
// one guarantees overlapping labels no matter how they're angled. Rank by
// total activity (voted + pending) and fold the long tail into "Other".
// topN adapts to how much data there is, so it stays useful whether there
// are 8 booths or 80.
function groupTopBooths(wardStats, topN = 8) {
  if (!wardStats || wardStats.length <= topN) {
    return wardStats || [];
  }
  const withTotal = wardStats.map((b) => ({ ...b, _total: (b.voted || 0) + (b.pending || 0) }));
  const sorted = [...withTotal].sort((a, b) => b._total - a._total);
  const top = sorted.slice(0, topN);
  const rest = sorted.slice(topN);
  const otherVoted = rest.reduce((sum, b) => sum + (b.voted || 0), 0);
  const otherPending = rest.reduce((sum, b) => sum + (b.pending || 0), 0);
  const grouped = top.map(({ _total, ...b }) => b);
  if (otherVoted + otherPending > 0) {
    grouped.push({ name: `Other (${rest.length} booths)`, voted: otherVoted, pending: otherPending, isOther: true });
  }
  return grouped;
}

export default function AnalyticsCharts({ analytics }) {
  const { theme } = useTheme();

  // Hooks must run unconditionally, so these sit above the early return below.
  const groupedBooths = useMemo(
    () => groupTopBooths(analytics?.wardStats),
    [analytics?.wardStats]
  );
  const groupedSchemes = useMemo(
    () => groupTopSchemes(analytics?.schemeDistribution),
    [analytics?.schemeDistribution]
  );

  if (!analytics) return null;

  const axisColor = theme === 'dark' ? '#8a97a8' : '#46586B';
  const tooltipStyle = {
    backgroundColor: theme === 'dark' ? '#16283F' : '#FFFFFF',
    borderColor: theme === 'dark' ? '#1E3350' : '#E5E0D0',
    borderRadius: 8,
    fontSize: 12,
    color: theme === 'dark' ? '#F6F3EA' : '#0F1B2E'
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

      {/* ============== BAR CHART (wider: spans 2 of 3 columns) ============== */}
      <div className="lg:col-span-2 bg-white dark:bg-ink-light border border-black/10 dark:border-white/10 p-5 rounded-2xl shadow-xl h-[420px] flex flex-col">
        <h3 className="font-semibold text-ink dark:text-paper mb-4 text-sm text-center">Ward Turnout</h3>
        <div className="flex-1 w-full h-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={groupedBooths}
              margin={{ top: 20, right: 10, left: 0, bottom: 30 }}
              barGap={4}
              barCategoryGap="25%"
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={axisColor} opacity={0.2} />

              <XAxis
                dataKey="name"
                stroke={axisColor}
                tick={{ angle: -35, textAnchor: 'end', fontSize: 11, fill: axisColor }}
                interval={0}
                height={80}
                tickLine={false}
                axisLine={{ strokeOpacity: 0.3 }}
                tickFormatter={(name) => (name.length > 12 ? `${name.slice(0, 12)}…` : name)}
              />
              <YAxis
                stroke={axisColor}
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
              <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '20px' }} />

              <Bar dataKey="voted" name="Voted" fill="#2F7A4D" radius={[2, 2, 0, 0]} />
              <Bar dataKey="pending" name="Pending" fill="#C08829" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ============== PIE CHART (narrower: 1 of 3 columns) ============== */}
      <div className="bg-white dark:bg-ink-light border border-black/10 dark:border-white/10 p-5 rounded-2xl shadow-xl h-[420px] flex flex-col">
        <h3 className="font-semibold text-ink dark:text-paper mb-4 text-sm text-center">Scheme Beneficiaries </h3>
        <div className="flex-1 w-full h-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={groupedSchemes}
                dataKey="value"
                cx="50%"
                cy="45%"
                outerRadius={75}
              >
                {groupedSchemes.map((entry, i) => (
                  <Cell key={i} fill={entry.isOther ? OTHER_COLOR : COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{ fontSize: '11px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}