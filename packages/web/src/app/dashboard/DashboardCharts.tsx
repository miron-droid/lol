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

/* ─────────────────────── Shared bar chart ───────────────────── */

interface BarSeries {
  label: string;
  color: string;
  values: number[];
}

function BarChart({
  title,
  labels,
  series,
}: {
  title: string;
  labels: string[];
  series: BarSeries[];
}) {
  const allValues = series.flatMap((s) => s.values);
  const maxValue = Math.max(...allValues, 1);
  const chartHeight = 220;
  const barGroupWidth = Math.max(40, Math.min(80, 600 / labels.length));
  const barWidth = Math.max(8, (barGroupWidth - 8) / series.length);
  const chartWidth = Math.max(400, labels.length * barGroupWidth + 60);

  return (
    <div style={{ ...cardStyle, flex: 1, minWidth: 380 }}>
      <h3 style={{ margin: `0 0 ${spacing.lg}`, fontSize: fontSizes.lg, fontWeight: 600, color: colors.text }}>
        {title}
      </h3>

      {/* Legend */}
      <div style={{ display: 'flex', gap: spacing.xl, marginBottom: spacing.md, flexWrap: 'wrap' }}>
        {series.map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: fontSizes.sm, color: colors.textSecondary }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, display: 'inline-block' }} />
            {s.label}
          </div>
        ))}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <svg width={chartWidth} height={chartHeight + 40} viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`} style={{ fontFamily }}>
          {/* Y-axis gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
            const y = chartHeight - frac * chartHeight;
            return (
              <g key={frac}>
                <line x1={50} y1={y} x2={chartWidth} y2={y} stroke={colors.borderSubtle} strokeWidth={1} />
                <text x={46} y={y + 4} textAnchor="end" fontSize={10} fill={colors.textMuted}>
                  {formatCompact(maxValue * frac)}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {labels.map((label, i) => {
            const groupX = 55 + i * barGroupWidth;
            return (
              <g key={label}>
                {series.map((s, si) => {
                  const val = s.values[i] || 0;
                  const barHeight = Math.max(0, (val / maxValue) * chartHeight);
                  const x = groupX + si * barWidth + 2;
                  const y = chartHeight - barHeight;
                  return (
                    <g key={s.label}>
                      <rect x={x} y={y} width={barWidth - 2} height={barHeight} fill={s.color} rx={2} opacity={0.85} />
                      <title>{`${s.label}: ${formatCurrency(val)}`}</title>
                    </g>
                  );
                })}
                <text x={groupX + (barGroupWidth - 8) / 2} y={chartHeight + 16} textAnchor="middle" fontSize={10} fill={colors.textSecondary}>
                  {label}
                </text>
              </g>
            );
          })}

          <line x1={50} y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke={colors.border} strokeWidth={1} />
        </svg>
      </div>
    </div>
  );
}

/* ─────────────────── Profit Stats bar chart ─────────────────── */

export function ProfitStatsChart({ weeks }: { weeks: WeeklyAggregation[] }) {
  if (weeks.length === 0) return null;

  return (
    <BarChart
      title="Revenue & Profit by Week"
      labels={weeks.map((w) => w.weekLabel)}
      series={[
        { label: 'Gross', color: colors.primary, values: weeks.map((w) => w.grossAmount) },
        { label: 'Driver Cost', color: colors.orangeLight, values: weeks.map((w) => w.driverCostAmount) },
        { label: 'Profit', color: colors.success, values: weeks.map((w) => w.profitAmount) },
      ]}
    />
  );
}

/* ───────────── Profit Margin trend (line chart) ─────────────── */

export function ProfitMarginChart({ weeks }: { weeks: WeeklyAggregation[] }) {
  if (weeks.length < 2) return null;

  const margins = weeks.map((w) => (w.grossAmount > 0 ? (w.profitAmount / w.grossAmount) * 100 : 0));
  const maxM = Math.max(...margins, 1);
  const minM = Math.min(...margins, 0);
  const range = maxM - minM || 1;

  const chartWidth = Math.max(400, weeks.length * 60 + 80);
  const chartHeight = 180;
  const padLeft = 50;
  const padRight = 20;
  const usableW = chartWidth - padLeft - padRight;
  const stepX = usableW / (weeks.length - 1);

  const points = margins.map((m, i) => {
    const x = padLeft + i * stepX;
    const y = chartHeight - ((m - minM) / range) * (chartHeight - 20) - 10;
    return { x, y, m };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = linePath + ` L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

  return (
    <div style={{ ...cardStyle, flex: 1, minWidth: 380 }}>
      <h3 style={{ margin: `0 0 ${spacing.lg}`, fontSize: fontSizes.lg, fontWeight: 600, color: colors.text }}>
        Profit Margin Trend
      </h3>
      <div style={{ overflowX: 'auto' }}>
        <svg width={chartWidth} height={chartHeight + 30} viewBox={`0 0 ${chartWidth} ${chartHeight + 30}`} style={{ fontFamily }}>
          {/* Gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
            const val = minM + frac * range;
            const y = chartHeight - frac * (chartHeight - 20) - 10;
            return (
              <g key={frac}>
                <line x1={padLeft} y1={y} x2={chartWidth - padRight} y2={y} stroke={colors.borderSubtle} strokeWidth={1} />
                <text x={padLeft - 6} y={y + 4} textAnchor="end" fontSize={10} fill={colors.textMuted}>
                  {val.toFixed(0)}%
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaPath} fill={colors.primary} opacity={0.08} />

          {/* Line */}
          <path d={linePath} fill="none" stroke={colors.primary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

          {/* Dots */}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={4} fill={colors.bgWhite} stroke={colors.primary} strokeWidth={2} />
              <title>{`${weeks[i].weekLabel}: ${p.m.toFixed(1)}%`}</title>
            </g>
          ))}

          {/* X labels */}
          {weeks.map((w, i) => (
            <text key={w.weekId} x={points[i].x} y={chartHeight + 18} textAnchor="middle" fontSize={10} fill={colors.textSecondary}>
              {w.weekLabel}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

/* ──────────────────── Status donut chart ─────────────────────── */

export function StatusDonutChart({
  breakdown,
  totalLoads,
}: {
  breakdown: StatusBreakdown[];
  totalLoads: number;
}) {
  if (breakdown.length === 0) return null;

  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 65;
  const innerR = 42;

  // Build arc segments
  let startAngle = -90; // start from top
  const segments = breakdown.map((item) => {
    const pct = totalLoads > 0 ? item.count / totalLoads : 0;
    const angle = pct * 360;
    const seg = { ...item, startAngle, angle, pct };
    startAngle += angle;
    return seg;
  });

  function polarToXY(angleDeg: number, r: number) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function arcPath(start: number, angle: number, outer: number, inner: number) {
    const a1 = polarToXY(start, outer);
    const a2 = polarToXY(start + angle, outer);
    const a3 = polarToXY(start + angle, inner);
    const a4 = polarToXY(start, inner);
    const largeArc = angle > 180 ? 1 : 0;
    return [
      `M ${a1.x} ${a1.y}`,
      `A ${outer} ${outer} 0 ${largeArc} 1 ${a2.x} ${a2.y}`,
      `L ${a3.x} ${a3.y}`,
      `A ${inner} ${inner} 0 ${largeArc} 0 ${a4.x} ${a4.y}`,
      'Z',
    ].join(' ');
  }

  return (
    <div style={{ ...cardStyle, minWidth: 280 }}>
      <h3 style={{ margin: `0 0 ${spacing.lg}`, fontSize: fontSizes.lg, fontWeight: 600, color: colors.text }}>
        Load Status
      </h3>

      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xl, flexWrap: 'wrap' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {segments.map((seg) => (
            <path
              key={seg.status}
              d={arcPath(seg.startAngle, Math.max(seg.angle - 1.5, 0.5), outerR, innerR)}
              fill={STATUS_COLORS[seg.status] || '#94a3b8'}
            >
              <title>{`${STATUS_LABELS[seg.status] || seg.status}: ${seg.count} (${(seg.pct * 100).toFixed(0)}%)`}</title>
            </path>
          ))}
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize={20} fontWeight={700} fill={colors.text} fontFamily={fontFamily}>
            {totalLoads}
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" fontSize={11} fill={colors.textMuted} fontFamily={fontFamily}>
            loads
          </text>
        </svg>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {segments.map((seg) => (
            <div key={seg.status} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: fontSizes.sm }}>
              <span style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: STATUS_COLORS[seg.status] || '#94a3b8',
                flexShrink: 0,
              }} />
              <span style={{ color: colors.textSecondary, minWidth: 100 }}>
                {STATUS_LABELS[seg.status] || seg.status}
              </span>
              <span style={{ fontWeight: 600, color: colors.text }}>
                {seg.count}
              </span>
              <span style={{ color: colors.textMuted }}>
                ({(seg.pct * 100).toFixed(0)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ──────────────── Top corridors table ────────────────────────── */

export function TopCorridorsCard({ corridors }: { corridors: TopCorridor[] }) {
  if (corridors.length === 0) return null;

  const cellStyle: React.CSSProperties = {
    padding: '8px 12px',
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
              <td style={{ ...cellStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {c.loadCount}
              </td>
              <td style={{ ...cellStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(c.grossAmount)}
              </td>
              <td style={{
                ...cellStyle,
                textAlign: 'right',
                fontVariantNumeric: 'tabular-nums',
                color: c.profitAmount >= 0 ? colors.success : colors.danger,
                fontWeight: 500,
              }}>
                {formatCurrency(c.profitAmount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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

/* ──────────────── Flag summary bar ──────────────────────────── */

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                <div style={{ width: `${pct}%`, height: '100%', background: item.color, borderRadius: radii.sm, transition: 'width 0.3s ease' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
