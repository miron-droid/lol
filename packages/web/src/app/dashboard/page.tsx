'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { WeekDto, DashboardDto } from '@lol/shared';
import { useAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import {
  ProfitStatsChart,
  StatusStatsCards,
  TopCorridorsCard,
  FlagSummaryCard,
  Sparkline,
} from './DashboardCharts';
import { PageShell } from '@/components/PageShell';
import { ErrorBanner, LoadingBox, EmptyBox } from '@/components/StateBoxes';
import { fmt, tabBtnStyle, cardStyle, colors, fontSizes, fontFamily, spacing, transition, radii } from '@/lib/styles';

/* ──────────── HR Portal-style KPI card with left accent ──────── */

function KpiCard({
  label,
  value,
  accentColor,
  icon,
  sparkData,
  sparkColor,
}: {
  label: string;
  value: string;
  accentColor: string;
  icon?: React.ReactNode;
  sparkData?: number[];
  sparkColor?: string;
}) {
  return (
    <div
      style={{
        ...cardStyle,
        borderLeft: `4px solid ${accentColor}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        minWidth: 0,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: fontSizes.sm, color: colors.textMuted, fontWeight: 500, marginBottom: 6 }}>
          {label}
        </div>
        <div
          style={{
            fontSize: fontSizes.display,
            fontWeight: 700,
            color: colors.text,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1.1,
          }}
        >
          {value}
        </div>
      </div>
      {sparkData && sparkData.length >= 2 ? (
        <Sparkline data={sparkData} color={sparkColor || accentColor} width={80} height={32} />
      ) : icon ? (
        <div style={{ color: accentColor, opacity: 0.3, fontSize: 32 }}>{icon}</div>
      ) : null}
    </div>
  );
}

/* ──────────── Averages strip ─────────────────────────────────── */

function AveragesSummary({
  averages,
}: {
  averages: { avgGross: number; avgProfit: number; avgMiles: number; avgProfitMargin: number };
}) {
  const items = [
    { label: 'Avg Gross / Load', value: fmt(averages.avgGross), color: colors.primary },
    { label: 'Avg Profit / Load', value: fmt(averages.avgProfit), color: averages.avgProfit >= 0 ? colors.success : colors.danger },
    { label: 'Avg Miles', value: averages.avgMiles.toLocaleString('en-US', { maximumFractionDigits: 0 }), color: colors.textSecondary },
    { label: 'Avg Margin', value: `${averages.avgProfitMargin.toFixed(1)}%`, color: averages.avgProfitMargin >= 0 ? colors.teal : colors.danger },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: spacing.md,
        padding: '14px 20px',
        background: colors.bgMuted,
        borderRadius: radii.lg,
        border: `1px solid ${colors.borderSubtle}`,
      }}
    >
      {items.map((item) => (
        <div key={item.label}>
          <div style={{ fontSize: fontSizes.xs, color: colors.textMuted, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 2 }}>
            {item.label}
          </div>
          <div style={{ fontSize: fontSizes.lg, fontWeight: 700, color: item.color, fontVariantNumeric: 'tabular-nums' }}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ──────────── Range selector ─────────────────────────────────── */

type RangeOption = '4' | '8' | '12' | 'all';
const RANGE_OPTIONS: { value: RangeOption; label: string }[] = [
  { value: '4', label: 'Last 4 weeks' },
  { value: '8', label: 'Last 8 weeks' },
  { value: '12', label: 'Last 12 weeks' },
  { value: 'all', label: 'All weeks' },
];

/* ──────────── Page ───────────────────────────────────────────── */

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [weeks, setWeeks] = useState<WeekDto[]>([]);
  const [range, setRange] = useState<RangeOption>('8');
  const [dashboard, setDashboard] = useState<DashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    apiFetch<WeekDto[]>('/weeks')
      .then(setWeeks)
      .catch((err) => setError(err.message || 'Failed to load weeks'));
  }, [user]);

  const selectedWeekIds = useMemo(() => {
    if (!weeks.length) return [];
    const count = range === 'all' ? weeks.length : parseInt(range, 10);
    return weeks.slice(0, count).map((w) => w.id);
  }, [weeks, range]);

  useEffect(() => {
    if (!selectedWeekIds.length) return;
    setLoading(true);
    setError(null);
    apiFetch<DashboardDto>(`/dashboard?weekIds=${selectedWeekIds.join(',')}`)
      .then((data) => { setDashboard(data); setLoading(false); })
      .catch((err) => { setError(err.message || 'Failed to load dashboard'); setLoading(false); });
  }, [selectedWeekIds]);

  if (authLoading) return <main style={{ padding: '2rem', fontFamily }}>Loading...</main>;
  if (!user) return null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const weeklyData = dashboard?.weeks ?? [];

  return (
    <PageShell user={user} onLogout={logout} title="Dashboard" subtitle="Weekly profit overview and trends">
      {/* ── Welcome banner ── */}
      <div
        style={{
          ...cardStyle,
          marginBottom: spacing.xxl,
          background: `linear-gradient(135deg, ${colors.primaryLight} 0%, ${colors.bgWhite} 100%)`,
          borderColor: colors.primaryBorder,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: spacing.xl,
        }}
      >
        <div>
          <div style={{ fontSize: fontSizes.xl, fontWeight: 600, color: colors.text }}>
            {greeting}, {user.firstName}
          </div>
          <div style={{ fontSize: fontSizes.md, color: colors.textSecondary, marginTop: spacing.xs }}>
            Here is your operational summary for the selected period.
          </div>
        </div>
        <div style={{ display: 'flex', gap: spacing.md, alignItems: 'center' }}>
          <span style={{ fontSize: fontSizes.base, color: colors.textSecondary, fontWeight: 500 }}>Range:</span>
          {RANGE_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => setRange(opt.value)} style={tabBtnStyle(range === opt.value)}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorBanner message={error} />}
      {loading && !dashboard && <LoadingBox message="Loading dashboard..." />}
      {!loading && !error && dashboard && dashboard.totals.loadCount === 0 && (
        <EmptyBox title="No data for this range" subtitle="Try selecting a wider range or create some loads first." />
      )}

      {dashboard && (loading || dashboard.totals.loadCount > 0) && (
        <div style={{ opacity: loading ? 0.6 : 1, transition: `opacity ${transition.normal}` }}>
          {/* ── KPI cards (HR Portal style — left colored border) ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: spacing.lg,
              marginBottom: spacing.xl,
            }}
          >
            <KpiCard
              label="Total Loads"
              value={String(dashboard.totals.loadCount)}
              accentColor={colors.primary}
              sparkData={weeklyData.map((w) => w.loadCount)}
              sparkColor={colors.primary}
            />
            <KpiCard
              label="Gross Revenue"
              value={fmt(dashboard.totals.grossAmount)}
              accentColor="#3b82f6"
              sparkData={weeklyData.map((w) => w.grossAmount)}
              sparkColor="#3b82f6"
            />
            <KpiCard
              label="Net Profit"
              value={fmt(dashboard.totals.netProfitAmount)}
              accentColor={dashboard.totals.netProfitAmount >= 0 ? colors.success : colors.danger}
              sparkData={weeklyData.map((w) => w.netProfitAmount)}
              sparkColor={colors.success}
            />
            <KpiCard
              label="Driver Cost"
              value={fmt(dashboard.totals.driverCostAmount)}
              accentColor={colors.orangeLight}
              sparkData={weeklyData.map((w) => w.driverCostAmount)}
              sparkColor={colors.orangeLight}
            />
          </div>

          {/* ── Averages strip ── */}
          <div style={{ marginBottom: spacing.xl }}>
            <AveragesSummary averages={dashboard.averages} />
          </div>

          {/* ── Status cards with ring indicators (HR Portal style) ── */}
          <div style={{ marginBottom: spacing.xl }}>
            <h2 style={{ fontSize: fontSizes.xl, fontWeight: 700, color: colors.text, marginBottom: spacing.sm }}>
              Load Status
            </h2>
            <p style={{ fontSize: fontSizes.md, color: colors.textSecondary, marginBottom: spacing.lg }}>
              Distribution for the selected period
            </p>
            <StatusStatsCards breakdown={dashboard.statusBreakdown} totalLoads={dashboard.totals.loadCount} />
          </div>

          {/* ── Profit Statistics chart (Net Profit + Driver Cost bars, Margin % line) ── */}
          <div style={{ marginBottom: spacing.xl }}>
            <ProfitStatsChart weeks={weeklyData} />
          </div>

          {/* ── Bottom: Corridors + Flags ── */}
          <div style={{ display: 'flex', gap: spacing.xl, flexWrap: 'wrap', marginBottom: spacing.xl }}>
            <div style={{ flex: 2, minWidth: 340 }}>
              <TopCorridorsCard corridors={dashboard.topCorridors} />
            </div>
            <div style={{ flex: 1, minWidth: 280 }}>
              <FlagSummaryCard flags={dashboard.flags} totalLoads={dashboard.totals.loadCount} />
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
