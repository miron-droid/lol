'use client';

import type { WeeklyAggregation, StatusBreakdown, TopCorridor } from '@lol/shared';
import { cardStyle, fontSizes, spacing, colors, fontFamily, radii } from '@/lib/styles';

/* ─────────────────────────── helpers ────────────────────────── */

function formatCurrency(value: number): string {
  return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return '$' + (value / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(value) >= 1_000) return '$' + (value / 1_000).toFixed(1) + 'K';
  return '$' + value.toFixed(0);
}

const STATUS_LABELS: Record<string, string> = {
  not_picked_up: 'Not Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  not_picked_up: '#94a3b8',
  in_transit: '#f59e0b',
  delivered: '#3b82f6',
  completed: '#16a34a',
  cancelled: '#dc2626',
};

/* ─────────── HR Portal-style card with left accent border ───── */

const accentCardStyle = (accentColor: string): React.CSSProperties => ({
  ...cardStyle,
  borderLeft: `4px solid ${accentColor}`,
  borderLeftColor: accentColor,
});

/* ────────────── Ring / Donut progress indicator ─────────────── */

function RingProgress({
  value,
  total,
  color,
  size = 64,
  strokeWidth = 6,
}: {
  value: number;
  total: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}) {
  const pct = total > 0 ? Math.min(value / total, 1) : 0;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={colors.borderSubtle} strokeWidth={strokeWidth} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${circ}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      <text
        x={size / 2}
        y={size / 2 + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size > 50 ? 13 : 10}
        fontWeight={700}
        fill={color}
        fontFamily={fontFamily}
      >
        {(pct * 100).toFixed(0)}%
      </text>
    </svg>
  );
}

/* ───────── Status distribution with ring indicators ─────────── */

export function StatusStatsCards({
  breakdown,
  totalLoads,
  prevBreakdown,
  prevTotal,
}: {
  breakdown: StatusBreakdown[];
  totalLoads: number;
  prevBreakdown?: StatusBreakdown[];
  prevTotal?: number;
}) {
  if (breakdown.length === 0) return null;

  // Build prev map for "% change" labels
  const prevMap = new Map<string, number>();
  if (prevBreakdown) {
    for (const b of prevBreakdown) prevMap.set(b.status, b.count);
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: spacing.lg }}>
      {breakdown.map((item) => {
        const color = STATUS_COLORS[item.status] || '#94a3b8';
        const prevCount = prevMap.get(item.status) ?? 0;
        const pctChange = prevCount > 0 ? Math.round(((item.count - prevCount) / prevCount) * 100) : (item.count > 0 ? 100 : 0);
        const changeLabel = pctChange > 0 ? `${pctChange}% more than prev period` : pctChange < 0 ? `${Math.abs(pctChange)}% less than prev period` : '';

        return (
          <div key={item.status} style={accentCardStyle(color)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: fontSizes.sm, color: colors.textMuted, fontWeight: 500, marginBottom: 4 }}>
                  {STATUS_LABELS[item.status] || item.status}
                </div>
                <div style={{ fontSize: fontSizes.xxl, fontWeight: 700, color: colors.text }}>
                  {item.count}
                </div>
                {changeLabel && (
                  <div style={{ fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 4 }}>
                    {changeLabel}
                  </div>
                )}
              </div>
              <RingProgress value={item.count} total={totalLoads} color={color} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ────────── Profit Statistics bar chart ──────────────────────── */
/* Shows Net Profit, Driver Cost bars + profit margin % line      */

export function ProfitStatsChart({ weeks }: { weeks: WeeklyAggregation[] }) {
  if (weeks.length === 0) return null;

  const chartHeight = 240;
  const barGroupWidth = Math.max(44, Math.min(72, 650 / weeks.length));
  const barWidth = Math.max(10, (barGroupWidth - 12) / 2);
  const padLeft = 56;
  const padRight = 50;
  const chartWidth = Math.max(420, weeks.length * barGroupWidth + padLeft + padRight);

  // Bar values
  const netProfits = weeks.map((w) => w.netProfitAmount);
  const driverCosts = weeks.map((w) => w.driverCostAmount);
  const allBarVals = [...netProfits, ...driverCosts];
  const maxBar = Math.max(...allBarVals, 1);

  // Line: profit margin %
  const margins = weeks.map((w) => (w.grossAmount > 0 ? (w.profitAmount / w.grossAmount) * 100 : 0));
  const maxPct = Math.max(...margins, 1);

  const series = [
    { label: 'Net Profit', color: colors.teal, values: netProfits },
    { label: 'Driver Cost', color: colors.orangeLight, values: driverCosts },
  ];

  return (
    <div style={{ ...cardStyle, flex: 1, minWidth: 400 }}>
      <h3 style={{ margin: `0 0 ${spacing.lg}`, fontSize: fontSizes.lg, fontWeight: 600, color: colors.text }}>
        Profit Statistics
      </h3>

      {/* Legend */}
      <div style={{ display: 'flex', gap: spacing.xl, marginBottom: spacing.md, flexWrap: 'wrap' }}>
        {series.map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: fontSizes.sm, color: colors.textSecondary }}>
            <span style={{ width: 12, height: 12, borderRadius: 2, background: s.color, display: 'inline-block' }} />
            {s.label}
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: fontSizes.sm, color: colors.textSecondary }}>
          <span style={{ width: 12, height: 2, background: colors.primary, display: 'inline-block', borderRadius: 1 }} />
          Margin %
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <svg width={chartWidth} height={chartHeight + 40} viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`} style={{ fontFamily }}>
          {/* Y-axis gridlines (left — dollars) */}
          {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
            const y = chartHeight - frac * chartHeight;
            return (
              <g key={frac}>
                <line x1={padLeft} y1={y} x2={chartWidth - padRight} y2={y} stroke={colors.borderSubtle} strokeWidth={1} />
                <text x={padLeft - 6} y={y + 4} textAnchor="end" fontSize={10} fill={colors.textMuted}>
                  {formatCompact(maxBar * frac)}
                </text>
              </g>
            );
          })}

          {/* Y-axis right — percentage */}
          {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
            const y = chartHeight - frac * chartHeight;
            return (
              <text key={`pct-${frac}`} x={chartWidth - padRight + 6} y={y + 4} textAnchor="start" fontSize={10} fill={colors.primary}>
                {(maxPct * frac).toFixed(0)}%
              </text>
            );
          })}

          {/* Bars */}
          {weeks.map((_, i) => {
            const groupX = padLeft + 4 + i * barGroupWidth;
            return (
              <g key={i}>
                {series.map((s, si) => {
                  const val = s.values[i] || 0;
                  const barH = Math.max(0, (val / maxBar) * chartHeight);
                  const x = groupX + si * (barWidth + 2);
                  const y = chartHeight - barH;
                  return (
                    <g key={s.label}>
                      <rect x={x} y={y} width={barWidth} height={barH} fill={s.color} rx={3} opacity={0.85} />
                      <title>{`${s.label}: ${formatCurrency(val)}`}</title>
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Margin % line */}
          {weeks.length > 1 && (() => {
            const points = margins.map((m, i) => {
              const x = padLeft + 4 + i * barGroupWidth + barWidth;
              const y = chartHeight - (m / maxPct) * chartHeight;
              return { x, y, m };
            });
            const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
            return (
              <>
                <path d={path} fill="none" stroke={colors.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                {points.map((p, i) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r={3.5} fill={colors.bgWhite} stroke={colors.primary} strokeWidth={2} />
                    <title>{`Margin: ${p.m.toFixed(1)}%`}</title>
                  </g>
                ))}
              </>
            );
          })()}

          {/* X labels */}
          {weeks.map((w, i) => (
            <text key={w.weekId} x={padLeft + 4 + i * barGroupWidth + barWidth} y={chartHeight + 16} textAnchor="middle" fontSize={10} fill={colors.textSecondary}>
              {w.weekLabel}
            </text>
          ))}

          <line x1={padLeft} y1={chartHeight} x2={chartWidth - padRight} y2={chartHeight} stroke={colors.border} strokeWidth={1} />
        </svg>
      </div>
    </div>
  );
}

/* ──────────────── Top corridors table ────────────────────────── */

export function TopCorridorsCard({ corridors }: { corridors: TopCorridor[] }) {
  if (corridors.length === 0) return null;

  const cellStyle: React.CSSProperties = {
    padding: '10px 12px',
    borderBottom: `1px solid ${colors.borderSubtle}`,
    fontSize: fontSizes.sm,
    color: colors.text,
  };
  const headerCellStyle: React.CSSProperties = {
    ...cellStyle,
    fontWeight: 600,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    borderBottom: `1px solid ${colors.border}`,
  };

  return (
    <div style={{ ...cardStyle, minWidth: 300 }}>
      <h3 style={{ margin: `0 0 ${spacing.lg}`, fontSize: fontSizes.lg, fontWeight: 600, color: colors.text }}>
        Top Corridors
      </h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={headerCellStyle}>Route</th>
            <th style={{ ...headerCellStyle, textAlign: 'right' }}>Loads</th>
            <th style={{ ...headerCellStyle, textAlign: 'right' }}>Gross</th>
            <th style={{ ...headerCellStyle, textAlign: 'right' }}>Profit</th>
          </tr>
        </thead>
        <tbody>
          {corridors.map((c, i) => (
            <tr key={i} style={{ background: i % 2 === 1 ? colors.bgMuted : 'transparent' }}>
              <td style={cellStyle}>
                <span style={{ fontWeight: 500 }}>{c.fromState}</span>
                <span style={{ color: colors.textMuted, margin: '0 4px' }}>&rarr;</span>
                <span style={{ fontWeight: 500 }}>{c.toState}</span>
              </td>
              <td style={{ ...cellStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{c.loadCount}</td>
              <td style={{ ...cellStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(c.grossAmount)}</td>
              <td style={{
                ...cellStyle,
                textAlign: 'right',
                fontVariantNumeric: 'tabular-nums',
                color: c.profitAmount >= 0 ? colors.success : colors.danger,
                fontWeight: 500,
              }}>{formatCurrency(c.profitAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ──────────────── Flag summary progress bars ────────────────── */

export function FlagSummaryCard({
  flags,
  totalLoads,
}: {
  flags: { quickPay: number; directPayment: number; factoring: number; driverPaid: number };
  totalLoads: number;
}) {
  const items = [
    { label: 'Quick Pay', count: flags.quickPay, color: '#f59e0b' },
    { label: 'Direct Payment', count: flags.directPayment, color: '#3b82f6' },
    { label: 'Factoring', count: flags.factoring, color: '#8b5cf6' },
    { label: 'Driver Paid', count: flags.driverPaid, color: '#16a34a' },
  ];

  return (
    <div style={{ ...cardStyle, minWidth: 260 }}>
      <h3 style={{ margin: `0 0 ${spacing.lg}`, fontSize: fontSizes.lg, fontWeight: 600, color: colors.text }}>
        Payment Flags
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((item) => {
          const pct = totalLoads > 0 ? (item.count / totalLoads) * 100 : 0;
          return (
            <div key={item.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: fontSizes.sm }}>
                <span style={{ color: colors.textSecondary }}>{item.label}</span>
                <span style={{ fontWeight: 600, color: colors.text }}>
                  {item.count} <span style={{ color: colors.textMuted, fontWeight: 400 }}>({pct.toFixed(0)}%)</span>
                </span>
              </div>
              <div style={{ height: 6, background: colors.borderSubtle, borderRadius: radii.sm, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: item.color, borderRadius: radii.sm, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ──────────────── Sparkline (mini line) ──────────────────────── */

export function Sparkline({
  data,
  color = colors.primary,
  width = 80,
  height = 28,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 2;

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (width - 2 * pad);
    const y = height - pad - ((v - min) / range) * (height - 2 * pad);
    return `${x},${y}`;
  });

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
