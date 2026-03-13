'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { WeekDto, DashboardDto } from '@lol/shared';
import { useAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import {
  ProfitStatsChart,
  ProfitMarginChart,
  StatusDonutChart,
  TopCorridorsCard,
  FlagSummaryCard,
  Sparkline,
} from './DashboardCharts';
import { PageShell } from '@/components/PageShell';
import { ErrorBanner, LoadingBox, EmptyBox } from '@/components/StateBoxes';
import { fmt, tabBtnStyle, cardStyle, colors, fontSizes, fontFamily, spacing, transition, radii, shadows } from '@/lib/styles';

// ── Trend arrow + percentage ────────────────────────────────────
function TrendIndicator({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return null;
  const delta = previous !== 0 ? ((current - previous) / Math.abs(previous)) * 100 : 100;
  const isUp = delta > 0;
  const isZero = Math.abs(delta) < 0.5;

  if (isZero) return <span style={{ fontSize: fontSizes.xs, color: colors.textMuted }}>—</span>;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        fontSize: fontSizes.xs,
        fontWeight: 600,
        color: isUp ? colors.success : colors.danger,
      }}
    >
      <svg width={10} height={10} viewBox="0 0 10 10">
        {isUp ? (
          <polygon points="5,1 9,7 1,7" fill="currentColor" />
        ) : (
          <polygon points="5,9 9,3 1,3" fill="currentColor" />
        )}
      </svg>
      {Math.abs(delta).toFixed(0)}%
    </span>
  );
}

// ── Enhanced KPI card ───────────────────────────────────────────
function KpiCard({
  label,
  value,
  color,
  sparkData,
  sparkColor,
  trend,
}: {
  label: string;
  value: string;
  color?: string;
  sparkData?: number[];
  sparkColor?: string;
  trend?: { current: number; previous: number };
}) {
  return (
    <div
      style={{
        ...cardStyle,
        flex: '1 1 160px',
        minWidth: 140,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div
        style={{
          fontSize: fontSizes.xs,
          color: colors.textMuted,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div
          style={{
            fontSize: fontSizes.xxl,
            fontWeight: 700,
            color: color || colors.text,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1.1,
          }}
        >
          {value}
        </div>
        {sparkData && sparkData.length >= 2 && (
          <Sparkline data={sparkData} color={sparkColor || color || colors.primary} width={72} height={26} />
        )}
      </div>
      {trend && <TrendIndicator current={trend.current} previous={trend.previous} />}
    </div>
  );
}

// ── Averages summary row ────────────────────────────────────────
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
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

// ── Range selector options ──────────────────────────────────────
type RangeOption = '4' | '8' | '12' | 'all';
const RANGE_OPTIONS: { value: RangeOption; label: string }[] = [
  { value: '4', label: 'Last 4 weeks' },
  { value: '8', label: 'Last 8 weeks' },
  { value: '12', label: 'Last 12 weeks' },
  { value: 'all', label: 'All weeks' },
];

// ── Page component ──────────────────────────────────────────────
export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [weeks, setWeeks] = useState<WeekDto[]>([]);
  const [range, setRange] = useState<RangeOption>('4');
  const [dashboard, setDashboard] = useState<DashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Auth guard ────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  // ── Fetch weeks list once ─────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    apiFetch<WeekDto[]>('/weeks')
      .then(setWeeks)
      .catch((err) => setError(err.message || 'Failed to load weeks'));
  }, [user]);

  // ── Selected week IDs based on range ──────────────────────────
  const selectedWeekIds = useMemo(() => {
    if (!weeks.length) return [];
    const count = range === 'all' ? weeks.length : parseInt(range, 10);
    return weeks.slice(0, count).map((w) => w.id);
  }, [weeks, range]);

  // ── Fetch dashboard aggregation ───────────────────────────────
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

  // ── Render guards ─────────────────────────────────────────────
  if (authLoading) {
    return <main style={{ padding: '2rem', fontFamily }}>Loading...</main>;
  }

  if (!user) return null;

  // ── Greeting ──────────────────────────────────────────────────
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // ── Trend helpers: split weeks into two halves ────────────────
  const weeklyData = dashboard?.weeks ?? [];
  const halfIdx = Math.floor(weeklyData.length / 2);
  const firstHalf = weeklyData.slice(0, halfIdx);
  const secondHalf = weeklyData.slice(halfIdx);

  function sumField(wks: typeof weeklyData, field: keyof typeof weeklyData[0]): number {
    return wks.reduce((acc, w) => acc + (w[field] as number), 0);
  }

  const trends = dashboard
    ? {
        gross: { current: sumField(secondHalf, 'grossAmount'), previous: sumField(firstHalf, 'grossAmount') },
        profit: { current: sumField(secondHalf, 'profitAmount'), previous: sumField(firstHalf, 'profitAmount') },
        netProfit: { current: sumField(secondHalf, 'netProfitAmount'), previous: sumField(firstHalf, 'netProfitAmount') },
        loadCount: { current: sumField(secondHalf, 'loadCount'), previous: sumField(firstHalf, 'loadCount') },
      }
    : null;

  // ── Render ────────────────────────────────────────────────────
  return (
    <PageShell
      user={user}
      onLogout={logout}
      title="Dashboard"
      subtitle="Weekly profit overview and trends"
    >
      {/* Welcome banner */}
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
        <div style={{ opacity: loading ? 0.6 : 1, transition: `opacity ${transition.normal}` }}>
          {/* ── KPI Cards row ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))',
              gap: spacing.lg,
              marginBottom: spacing.xl,
            }}
          >
            <KpiCard
              label="Loads"
              value={String(dashboard.totals.loadCount)}
              sparkData={weeklyData.map((w) => w.loadCount)}
              sparkColor={colors.textSecondary}
              trend={trends?.loadCount}
            />
            <KpiCard
              label="Gross Revenue"
              value={fmt(dashboard.totals.grossAmount)}
              color={colors.primary}
              sparkData={weeklyData.map((w) => w.grossAmount)}
              trend={trends?.gross}
            />
            <KpiCard
              label="Driver Cost"
              value={fmt(dashboard.totals.driverCostAmount)}
              color={colors.orangeLight}
              sparkData={weeklyData.map((w) => w.driverCostAmount)}
              sparkColor={colors.orangeLight}
            />
            <KpiCard
              label="Profit"
              value={fmt(dashboard.totals.profitAmount)}
              color={dashboard.totals.profitAmount >= 0 ? colors.success : colors.danger}
              sparkData={weeklyData.map((w) => w.profitAmount)}
              sparkColor={colors.success}
              trend={trends?.profit}
            />
            <KpiCard
              label="OTR (1.25%)"
              value={fmt(dashboard.totals.otrAmount)}
              color={colors.purple}
              sparkData={weeklyData.map((w) => w.otrAmount)}
              sparkColor={colors.purple}
            />
            <KpiCard
              label="Net Profit"
              value={fmt(dashboard.totals.netProfitAmount)}
              color={dashboard.totals.netProfitAmount >= 0 ? colors.teal : colors.danger}
              sparkData={weeklyData.map((w) => w.netProfitAmount)}
              sparkColor={colors.teal}
              trend={trends?.netProfit}
            />
          </div>

          {/* ── Averages summary strip ── */}
          <div style={{ marginBottom: spacing.xl }}>
            <AveragesSummary averages={dashboard.averages} />
          </div>

          {/* ── Charts row 1: Revenue bar + Margin trend ── */}
          <div style={{ display: 'flex', gap: spacing.xl, flexWrap: 'wrap', marginBottom: spacing.xl }}>
            <ProfitStatsChart weeks={weeklyData} />
            <ProfitMarginChart weeks={weeklyData} />
          </div>

          {/* ── Charts row 2: Status donut + Top corridors + Flags ── */}
          <div style={{ display: 'flex', gap: spacing.xl, flexWrap: 'wrap', marginBottom: spacing.xl }}>
            <StatusDonutChart breakdown={dashboard.statusBreakdown} totalLoads={dashboard.totals.loadCount} />
            <div style={{ flex: 1, minWidth: 300, display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
              <TopCorridorsCard corridors={dashboard.topCorridors} />
              <FlagSummaryCard flags={dashboard.flags} totalLoads={dashboard.totals.loadCount} />
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
