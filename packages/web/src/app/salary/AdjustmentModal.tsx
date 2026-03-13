'use client';

import { useState } from 'react';
import type { SalaryAdjustment } from '@lol/shared';
import {
  overlayStyle,
  modalStyle,
  thStyle,
  tdStyle,
  tableStyle,
  inputStyle as baseInputStyle,
  smallBtnStyle,
  iconBtnStyle,
  primaryBtnStyle,
  secondaryBtnStyle,
  badgeStyle,
  validationErrorStyle,
  sectionHeadingStyle,
  formActionsStyle,
  colors,
  fontSizes,
  spacing,
} from '@/lib/styles';

/** Input row — no audit fields, those are stamped by the backend. */
interface AdjustmentInput {
  type: 'other' | 'bonus';
  amount: number;
  note: string;
}

interface Props {
  dispatcherName: string;
  existingAdjustments: SalaryAdjustment[];
  onSave: (adjustments: AdjustmentInput[]) => void;
  onClose: () => void;
}

export function AdjustmentModal({ dispatcherName, existingAdjustments, onSave, onClose }: Props) {
  const [adjustments, setAdjustments] = useState<AdjustmentInput[]>(
    existingAdjustments.length > 0
      ? existingAdjustments.map((a) => ({ type: a.type, amount: a.amount, note: a.note }))
      : [],
  );
  const [error, setError] = useState<string | null>(null);

  const addRow = (type: 'other' | 'bonus') => {
    setAdjustments([...adjustments, { type, amount: 0, note: '' }]);
  };

  const updateRow = (index: number, field: keyof AdjustmentInput, value: string | number) => {
    const updated = [...adjustments];
    updated[index] = { ...updated[index], [field]: value };
    setAdjustments(updated);
  };

  const removeRow = (index: number) => {
    setAdjustments(adjustments.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    setError(null);
    for (let i = 0; i < adjustments.length; i++) {
      const a = adjustments[i];
      if (!a.note.trim()) {
        setError(`Row ${i + 1}: a note is required.`);
        return;
      }
      if (a.type === 'bonus' && a.amount < 0) {
        setError(`Row ${i + 1}: bonus must be >= 0.`);
        return;
      }
    }
    onSave(adjustments);
  };

  return (
    <div style={overlayStyle}>
      <div style={{ ...modalStyle, width: '90%', maxWidth: 600 }}>
        <h3 style={{ ...sectionHeadingStyle, fontSize: fontSizes.lg }}>
          Adjustments for {dispatcherName}
        </h3>

        {adjustments.length === 0 ? (
          <p style={{ color: colors.textMuted, fontSize: fontSizes.md, margin: `${spacing.md} 0 ${spacing.xl}` }}>
            No adjustments yet. Add Other or Bonus entries below.
          </p>
        ) : (
          <table style={{ ...tableStyle, marginBottom: spacing.lg }}>
            <thead>
              <tr>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Amount ($)</th>
                <th style={thStyle}>Note</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {adjustments.map((a, i) => (
                <tr key={i}>
                  <td style={tdStyle}>
                    <span style={a.type === 'bonus' ? badgeStyle('success') : badgeStyle('purple')}>
                      {a.type === 'bonus' ? 'Bonus' : 'Other'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <input
                      type="number"
                      value={a.amount}
                      onChange={(e) => updateRow(i, 'amount', parseFloat(e.target.value) || 0)}
                      style={baseInputStyle}
                      step="0.01"
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      type="text"
                      value={a.note}
                      onChange={(e) => updateRow(i, 'note', e.target.value)}
                      placeholder="Required note..."
                      style={{ ...baseInputStyle, width: '100%' }}
                    />
                  </td>
                  <td style={tdStyle}>
                    <button onClick={() => removeRow(i)} style={iconBtnStyle}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Add buttons */}
        <div style={{ display: 'flex', gap: spacing.md, marginBottom: spacing.xl }}>
          <button onClick={() => addRow('other')} style={{ ...smallBtnStyle, borderColor: colors.purple, color: colors.purple }}>+ Other</button>
          <button onClick={() => addRow('bonus')} style={{ ...smallBtnStyle, borderColor: colors.success, color: colors.success }}>+ Bonus</button>
        </div>

        {error && (
          <div style={validationErrorStyle}>{error}</div>
        )}

        {/* Actions */}
        <div style={formActionsStyle}>
          <button onClick={onClose} style={secondaryBtnStyle}>Cancel</button>
          <button onClick={handleSave} style={primaryBtnStyle}>Save Adjustments</button>
        </div>
      </div>
    </div>
  );
}

