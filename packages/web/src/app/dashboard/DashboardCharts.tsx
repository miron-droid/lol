'use client';

import type { WeeklyAggregation } from '@lol/shared';
import { cardStyle, fontSizes, spacing, colors } from '@/lib/styles';

interface ChartsProps {
  weeks: WeeklyAggregation[];
}

function formatCurrency(value: number): string {
  return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ── Shared bar chart renderer ────────────────────────────────
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
  const maxValue = Math.max(...allValues, 1); // avoid division by zero
  const chartHeight = 220;
  const barGroupWidth = Math.max(40, Math.min(80, 600 / labels.length));
  const barWidth = Math.max(8, (barGroupWidth - 8) / series.length);
  const chartWidth = Math.max(400, labels.length * barGroupWidth + 60);

  return (
    <div
      style={{
        ...cardStyle,
        flex: 1,
        minWidth: 380,
      }}
    >
      <h3 style={{ margin: `0 0 ${spacing.lg}`, fontSize: fontSizes.lg, color: colors.text }}>{title}</h3>

      {/* Legend */}
      <div style={{ display: 'flex', gap: spacing.xl, marginBottom: spacing.md, flexWrap: 'wrap' }}>
        {series.map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: fontSizes.sm }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, display: 'inline-block' }} />
            {s.label}
          </div>
        ))}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <svg width={chartWidth} height={chartHeight + 40} viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`}>
          {/* Y-axis gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
            const y = chartHeight - frac * chartHeight;
            return (
              <g key={frac}>
                <line x1={50} y1={y} x2={chartWidth} y2={y} stroke={colors.borderSubtle} strokeWidth={1} />
                <text x={46} y={y + 4} textAnchor="end" fontSize={10} fill={colors.textMuted}>
                  {formatCurrency(maxValue * frac)}
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
                      <rect
                        x={x}
                        y={y}
                        width={barWidth - 2}
                        height={barHeight}
                        fill={s.color}
                        rx={2}
                      />
                      {/* Tooltip-like value on hover area */}
                      <title>{`${s.label}: ${formatCurrency(val)}`}</title>
                    </g>
                  );
                })}
                {/* X-axis label */}
                <text
                  x={groupX + (barGroupWidth - 8) / 2}
                  y={chartHeight + 16}
                  textAnchor="middle"
                  fontSize={10}
                  fill={colors.textSecondary}
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* X-axis line */}
          <line x1={50} y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke={colors.border} strokeWidth={1} />
        </svg>
      </div>
    </div>
  );
}

// ── Exported chart components ────────────────────────────────

/**
 * Profit Statistics: Gross, Driver Cost, Profit per week.
 */
export function ProfitStatsChart({ weeks }: ChartsProps) {
  if (weeks.length === 0) return null;

  return (
    <BarChart
      title="Profit Statistics"
      labels={weeks.map((w) => w.weekLabel)}
      series={[
        { label: 'Gross', color: colors.primary, values: weeks.map((w) => w.grossAmount) },
        { label: 'Driver Cost', color: colors.orangeLight, values: weeks.map((w) => w.driverCostAmount) },
        { label: 'Profit', color: colors.success, values: weeks.map((w) => w.profitAmount) },
      ]}
    />
  );
}

/**
 * Special Profit Statistics: OTR, Net Profit per week.
 */
export function SpecialProfitStatsChart({ weeks }: ChartsProps) {
  if (weeks.length === 0) return null;

  return (
    <BarChart
      title="Special Profit Statistics"
      labels={weeks.map((w) => w.weekLabel)}
      series={[
        { label: 'OTR', color: colors.purple, values: weeks.map((w) => w.otrAmount) },
        { label: 'Net Profit', color: colors.teal, values: weeks.map((w) => w.netProfitAmount) },
      ]}
    />
  );
}
