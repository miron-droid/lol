'use client';

import { useState } from 'react';
import type { SalaryRuleDto, SalaryRuleTier } from '@lol/shared';
import {
  labelStyle,
  inputStyle,
  inputDisabledStyle,
  thStyle,
  tdStyle,
  smallBtnStyle,
  iconBtnStyle,
  primaryBtnStyle,
  secondaryBtnStyle,
  bannerStyle,
  validationErrorStyle,
  formActionsStyle,
  sectionHeadingStyle,
  gridTwo,
  tableStyle,
  colors,
  fontSizes,
  spacing,
} from '@/lib/styles';

interface Props {
  initial: SalaryRuleDto | null; // null = create mode
  onSave: (data: { name: string; effectiveFrom: string; tiers: SalaryRuleTier[] }) => void;
  onCancel: () => void;
}

interface TierDraft {
  tierOrder: number;
  minProfit: string;
  maxProfit: string; // '' for null (unbounded)
  percent: string;
}

function toTierDrafts(tiers: SalaryRuleTier[]): TierDraft[] {
  return tiers.map((t) => ({
    tierOrder: t.tierOrder,
    minProfit: String(t.minProfit),
    maxProfit: t.maxProfit === null ? '' : String(t.maxProfit),
    percent: String(t.percent),
  }));
}

const defaultTier = (): TierDraft => ({
  tierOrder: 1,
  minProfit: '0',
  maxProfit: '',
  percent: '',
});

export function SalaryRuleEditor({ initial, onSave, onCancel }: Props) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name || '');
  const [effectiveFrom, setEffectiveFrom] = useState(initial?.effectiveFrom || '');
  const [tiers, setTiers] = useState<TierDraft[]>(
    initial ? toTierDrafts(initial.tiers) : [defaultTier()],
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  // ── Tier row manipulation ──

  const addTier = () => {
    const last = tiers[tiers.length - 1];
    const newMin = last.maxProfit || '0';
    setTiers([
      // Set the current last tier to have a maxProfit if it doesn't
      ...tiers.slice(0, -1),
      { ...last, maxProfit: last.maxProfit || newMin },
      { tierOrder: tiers.length + 1, minProfit: last.maxProfit || newMin, maxProfit: '', percent: '' },
    ]);
  };

  const removeTier = (index: number) => {
    if (tiers.length <= 1) return;
    const updated = tiers.filter((_, i) => i !== index);
    // Re-number and fix continuity
    const renumbered = updated.map((t, i) => ({ ...t, tierOrder: i + 1 }));
    // Fix minProfit continuity
    for (let i = 1; i < renumbered.length; i++) {
      renumbered[i].minProfit = renumbered[i - 1].maxProfit;
    }
    setTiers(renumbered);
  };

  const updateTier = (index: number, field: keyof TierDraft, value: string) => {
    const updated = [...tiers];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-chain: when maxProfit changes, update next tier's minProfit
    if (field === 'maxProfit' && index < updated.length - 1) {
      updated[index + 1] = { ...updated[index + 1], minProfit: value };
    }

    setTiers(updated);
  };

  // ── Validate and submit ──

  const handleSave = () => {
    setValidationError(null);

    if (!name.trim()) {
      setValidationError('Rule set name is required.');
      return;
    }
    if (!effectiveFrom) {
      setValidationError('Effective from date is required.');
      return;
    }
    if (tiers.length === 0) {
      setValidationError('At least one tier is required.');
      return;
    }

    // Convert drafts to proper tiers
    const parsedTiers: SalaryRuleTier[] = [];
    for (let i = 0; i < tiers.length; i++) {
      const t = tiers[i];
      const minProfit = parseFloat(t.minProfit);
      const maxProfit = t.maxProfit === '' ? null : parseFloat(t.maxProfit);
      const percent = parseFloat(t.percent);

      if (isNaN(minProfit)) {
        setValidationError(`Tier ${i + 1}: invalid min profit.`);
        return;
      }
      if (t.maxProfit !== '' && isNaN(maxProfit as number)) {
        setValidationError(`Tier ${i + 1}: invalid max profit.`);
        return;
      }
      if (isNaN(percent) || percent < 0 || percent > 100) {
        setValidationError(`Tier ${i + 1}: percent must be between 0 and 100.`);
        return;
      }

      parsedTiers.push({
        tierOrder: i + 1,
        minProfit,
        maxProfit,
        percent,
      });
    }

    // Validate first tier starts at 0
    if (parsedTiers[0].minProfit !== 0) {
      setValidationError('First tier must start at min profit = $0.');
      return;
    }

    // Validate last tier is unbounded
    if (parsedTiers[parsedTiers.length - 1].maxProfit !== null) {
      setValidationError('Last tier must have empty max profit (unbounded).');
      return;
    }

    // Validate contiguity
    for (let i = 0; i < parsedTiers.length - 1; i++) {
      if (parsedTiers[i].maxProfit === null) {
        setValidationError(`Only the last tier can have unbounded max profit.`);
        return;
      }
      if ((parsedTiers[i].maxProfit as number) <= parsedTiers[i].minProfit) {
        setValidationError(`Tier ${i + 1}: max profit must be greater than min profit.`);
        return;
      }
      if (parsedTiers[i + 1].minProfit !== parsedTiers[i].maxProfit) {
        setValidationError(`Gap between tier ${i + 1} and tier ${i + 2}. Boundaries must be contiguous.`);
        return;
      }
    }

    onSave({ name: name.trim(), effectiveFrom, tiers: parsedTiers });
  };

  return (
    <div>
      <h2 style={sectionHeadingStyle}>
        {isEdit ? `Edit Rule Set: ${initial!.name} (v${initial!.version})` : 'Create New Rule Set'}
      </h2>

      {isEdit && (
        <div style={bannerStyle('warning')}>
          Editing creates a new version (v{initial!.version + 1}). The previous version is preserved for audit.
        </div>
      )}

      {/* ── Form fields ── */}
      <div style={{ ...gridTwo, marginBottom: spacing.xxl }}>
        <div>
          <label style={labelStyle}>Rule Set Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Standard Dispatcher Tiers Q1 2026"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Effective From</label>
          <input
            type="date"
            value={effectiveFrom}
            onChange={(e) => setEffectiveFrom(e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      {/* ── Read-only fields ── */}
      <div style={{ ...gridTwo, marginBottom: spacing.xxl }}>
        <div>
          <label style={labelStyle}>Application Mode</label>
          <input type="text" value="Flat Rate" disabled style={inputDisabledStyle} />
        </div>
        <div>
          <label style={labelStyle}>Salary Base</label>
          <input type="text" value="Gross Profit (Gross - Driver Cost)" disabled style={inputDisabledStyle} />
        </div>
      </div>

      {/* ── Tier rows editor ── */}
      <div style={{ marginBottom: spacing.xxl }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>Tier Brackets</label>
          <button onClick={addTier} style={{ ...smallBtnStyle, borderColor: colors.primary, color: colors.primary }}>+ Add Tier</button>
        </div>

        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>#</th>
              <th style={thStyle}>Min Profit ($)</th>
              <th style={thStyle}>Max Profit ($)</th>
              <th style={thStyle}>Percent (%)</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((t, i) => (
              <tr key={i}>
                <td style={tdStyle}>{i + 1}</td>
                <td style={tdStyle}>
                  <input
                    type="number"
                    value={t.minProfit}
                    onChange={(e) => updateTier(i, 'minProfit', e.target.value)}
                    disabled={i > 0} // auto-chained from previous tier
                    style={i > 0 ? inputDisabledStyle : inputStyle}
                    step="0.01"
                    min="0"
                  />
                </td>
                <td style={tdStyle}>
                  <input
                    type="number"
                    value={t.maxProfit}
                    onChange={(e) => updateTier(i, 'maxProfit', e.target.value)}
                    placeholder={i === tiers.length - 1 ? '∞ (leave empty)' : ''}
                    style={inputStyle}
                    step="0.01"
                    min="0"
                  />
                </td>
                <td style={tdStyle}>
                  <input
                    type="number"
                    value={t.percent}
                    onChange={(e) => updateTier(i, 'percent', e.target.value)}
                    placeholder="e.g., 10"
                    style={inputStyle}
                    step="0.01"
                    min="0"
                    max="100"
                  />
                </td>
                <td style={tdStyle}>
                  {tiers.length > 1 && (
                    <button onClick={() => removeTier(i)} style={{ ...iconBtnStyle, color: colors.danger }}>×</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: spacing.md, fontSize: fontSizes.sm, color: colors.textMuted }}>
          Boundaries use [min, max) semantics. Last tier must have empty max profit (unbounded). Min profit of each tier auto-chains from the previous tier.
        </div>
      </div>

      {/* ── Validation error ── */}
      {validationError && (
        <div style={validationErrorStyle}>{validationError}</div>
      )}

      {/* ── Actions ── */}
      <div style={formActionsStyle}>
        <button onClick={handleSave} style={primaryBtnStyle}>
          {isEdit ? `Save as v${initial!.version + 1}` : 'Create Rule Set'}
        </button>
        <button onClick={onCancel} style={secondaryBtnStyle}>Cancel</button>
      </div>
    </div>
  );
}

