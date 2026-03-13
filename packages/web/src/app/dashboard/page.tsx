'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { WeekDto, DashboardDto } from '@lol/shared';
import { useAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { ProfitStatsChart, SpecialProfitStatsChart } from './DashboardCharts';
import { PageShell } from '@/components/PageShell';
import { ErrorBanner, LoadingBox, EmptyBox } from '@/components/StateBoxes';
import { fmt, tabBtnStyle, cardStyle, colors, fontSizes } from '@/lib/styles';

// ── KPI card ─────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div
      style={{
        ...cardStyle,
        flex: '1 1 160px',
        minWidth: 140,
      }}
    >
      <div style={{ fontSize: fontSizes.sm, color: colors.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: '1.375rem', fontWeight: 700, color: color || colors.text, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
    </div>
  );
}

// ── Range selector options ───────────────────────────────────
type RangeOption = '4' | '8' | '12' | 'all';
const RANGE_OPTIONS: { value: RangeOption; label: string }[] = [
  { value: '4', label: 'Last 4 weeks' },
  { value: '8', label: 'Last 8 weeks' },
  { value: '12', label: 'Last 12 weeks' },
  { value: 'all', label: 'All weeks' },
];

// ── Page component ───────────────────────────────────────────
export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [weeks, setWeeks] = useState<WeekDto[]>([]);
  const [range, setRange] = useState<RangeOption>('4');
  const [dashboard, setDashboard] = useState<DashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Auth guard ─────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  // ── Fetch weeks list once ──────────────────────────────────
  useEffect(() => {
    if (!user) return;

    apiFetch<WeekDto[]>('/weeks')
      .then(setWeeks)
      .catch((err) => setError(err.message || 'Failed to load weeks'));
  }, [user]);

  // ── Selected week IDs based on range ───────────────────────
  const selectedWeekIds = useMemo(() => {
    if (!weeks.length) return [];
    // weeks come newest-first from API; take the first N
    const count = range === 'all' ? weeks.length : parseInt(range, 10);
    return weeks.slice(0, count).map((w) => w.id);
  }, [weeks, range]);

  // ── Fetch dashboard aggregation when selection changes ─────
  useEffect(() => {
    if (!selectedWeekIds.length) return;

    setLoading(true);
    setError(null);

    apiFetch<DashboardDto>(`/dashboard?weekIds=${selectedWeekIds.join(',')}`)
      .then((data) => {
        setDashboard(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load dashboard');
        setLoading(false);
      });
  }, [selectedWeekIds]);

  // ── Render guards ──────────────────────────────────────────
  if (authLoading) {
    return <main style={{ padding: '2rem' }}>Loading...</main>;
  }

  if (!user) return null;

  // ── Main render ────────────────────────────────────────────
  return (
    <PageShell breadcrumb="/ Dashboard" user={user} onLogout={logout} nav={[{label:'Home',href:'/'},{label:'Loads',href:'/loads'}]} title="Dashboard" subtitle="Weekly profit overview and trends">

      {/* Range selector */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <span style={{ fontSize: fontSizes.base, color: colors.textSecondary, fontWeight: 500 }}>Range:</span>
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setRange(opt.value)}
            style={tabBtnStyle(range === opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && <ErrorBanner message={error} />}

      {/* Loading state */}
      {loading && !dashboard && <LoadingBox message="Loading dashboard..." />}

      {/* Empty state */}
      {!loading && !error && dashboard && dashboard.totals.loadCount === 0 && (
        <EmptyBox title="No data for this range" subtitle="Try selecting a wider range or create some loads first." />
      )}

      {/* Dashboard content */}
      {dashboard && (loading || dashboard.totals.loadCount > 0) && (
        <>
          {/* KPI Cards */}
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
              opacity: loading ? 0.6 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            <KpiCard label="Load Count" value={String(dashboard.totals.loadCount)} />
            <KpiCard label="Gross" value={fmt(dashboard.totals.grossAmount)} color="#1976d2" />
            <KpiCard label="Driver Cost" value={fmt(dashboard.totals.driverCostAmount)} color="#f57c00" />
            <KpiCard
              label="Profit"
              value={fmt(dashboard.totals.profitAmount)}
              color={dashboard.totals.profitAmount >= 0 ? '#388e3c' : '#d32f2f'}
            />
            <KpiCard label="OTR" value={fmt(dashboard.totals.otrAmount)} color="#7b1fa2" />
            <KpiCard
              label="Net Profit"
              value={fmt(dashboard.totals.netProfitAmount)}
              color={dashboard.totals.netProfitAmount >= 0 ? '#00897b' : '#d32f2f'}
            />
          </div>

          {/* Charts */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap',
              opacity: loading ? 0.6 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            <ProfitStatsChart weeks={dashboard.weeks} />
            <SpecialProfitStatsChart weeks={dashboard.weeks} />
          </div>
        </>
      )}
    </PageShell>
  );
}
