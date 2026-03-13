'use client';

import type { WeekDto } from '@lol/shared';
import { inputStyle, fontSizes, spacing } from '@/lib/styles';

interface WeekSwitcherProps {
  weeks: WeekDto[];
  selectedWeek: WeekDto | null;
  onSelect: (weekId: string) => void;
}

export function WeekSwitcher({ weeks, selectedWeek, onSelect }: WeekSwitcherProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
      <label
        htmlFor="week-select"
        style={{ fontSize: fontSizes.md, fontWeight: 600, whiteSpace: 'nowrap' }}
      >
        Week:
      </label>
      <select
        id="week-select"
        value={selectedWeek?.id ?? ''}
        onChange={(e) => onSelect(e.target.value)}
        style={{ ...inputStyle, width: 'auto', minWidth: 220 }}
      >
        {weeks.map((w) => (
          <option key={w.id} value={w.id}>
            {w.label} ({w.startDate} — {w.endDate})
            {w.isCurrent ? ' (current)' : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
