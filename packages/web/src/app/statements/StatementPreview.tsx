'use client';

import type { StatementDto } from '@lol/shared';
import { thStyle, tdStyle, tdRight, tableWrapperStyle, tableStyle, primaryBtnStyle, secondaryBtnStyle, loadingBtnStyle, bannerStyle, tagStyle, cardStyle, colors, fontSizes, spacing, zebraRowProps, formActionsStyle, fmt as fmtMoney } from '@/lib/styles';

interface PreviewProps {
  statement: StatementDto;
  onSave: () => void;
  onClose: () => void;
  saving: boolean;
}

function FlagCell({ value }: { value: boolean }) {
  return (
    <span style={{ color: value ? colors.success : '#bdbdbd', fontWeight: value ? 600 : 400 }}>
      {value ? 'Y' : '-'}
    </span>
  );
}

export function StatementPreview({ statement, onSave, onClose, saving }: PreviewProps) {
  const { snapshot } = statement;
  const isSaved = !!statement.id;

  return (
    <div>
      {/* Read-only indicator for saved statements */}
      {isSaved && (
        <div style={bannerStyle('info')}>
          <span style={tagStyle('solidInfo')}>
            SNAPSHOT
          </span>
          <span>
            This statement is a read-only snapshot generated on {new Date(statement.generatedAt).toLocaleString()}.
          </span>
        </div>
      )}

      {/* Header info */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.lg,
          flexWrap: 'wrap',
          gap: spacing.md,
        }}
      >
        <div>
          <span style={{ fontWeight: 600, fontSize: fontSizes.lg }}>
            {statement.statementType === 'driver' ? 'Driver' : 'Owner'} Statement
          </span>
          <span style={{ color: colors.textMuted, fontSize: fontSizes.base, marginLeft: spacing.md }}>
            {statement.weekLabel}
          </span>
          {statement.unitId && (
            <span style={{ color: colors.textMuted, fontSize: fontSizes.sm, marginLeft: spacing.md }}>
              Unit: {statement.unitId.substring(0, 8)}...
            </span>
          )}
        </div>
        <div style={{ fontSize: fontSizes.sm, color: colors.textSecondary }}>
          By: {statement.generatedByName}
        </div>
      </div>

      {/* Totals bar */}
      <div
        style={{
          ...cardStyle,
          display: 'flex',
          gap: spacing.xl,
          flexWrap: 'wrap',
          background: colors.primaryLight,
          marginBottom: spacing.lg,
          fontSize: fontSizes.base,
        }}
      >
        <span><strong>Loads:</strong> {snapshot.totals.loadCount}</span>
        <span><strong>Gross:</strong> {fmtMoney(snapshot.totals.grossAmount)}</span>
        <span><strong>Driver:</strong> {fmtMoney(snapshot.totals.driverCostAmount)}</span>
        <span style={{ color: snapshot.totals.profitAmount >= 0 ? colors.success : colors.danger }}>
          <strong>Profit:</strong> {fmtMoney(snapshot.totals.profitAmount)}
        </span>
        <span><strong>OTR:</strong> {fmtMoney(snapshot.totals.otrAmount)}</span>
        <span style={{ color: snapshot.totals.netProfitAmount >= 0 ? colors.teal : colors.danger }}>
          <strong>Net Profit:</strong> {fmtMoney(snapshot.totals.netProfitAmount)}
        </span>
      </div>

      {/* Loads table */}
      {snapshot.loads.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: colors.textMuted }}>
          No loads match the selected filters.
        </div>
      ) : (
        <div style={{ ...tableWrapperStyle, marginBottom: spacing.xl }}>
          <table style={{ ...tableStyle, minWidth: 900 }}>
            <thead>
              <tr>
                <th style={thStyle}>SYL #</th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>From</th>
                <th style={thStyle}>To</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Miles</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Gross</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Driver</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Profit</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>OTR</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Net Profit</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>QP</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>DP</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Fact</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Paid</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.loads.map((l, i) => {
                const zebra = zebraRowProps(i);
                return (
                <tr key={i} style={zebra.style} onMouseEnter={zebra.onMouseEnter} onMouseLeave={zebra.onMouseLeave}>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{l.sylNumber}</td>
                  <td style={tdStyle}>{l.date}</td>
                  <td style={{ ...tdStyle, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.fromAddress}</td>
                  <td style={{ ...tdStyle, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.toAddress}</td>
                  <td style={tdRight}>{l.miles}</td>
                  <td style={tdRight}>{fmtMoney(l.grossAmount)}</td>
                  <td style={tdRight}>{fmtMoney(l.driverCostAmount)}</td>
                  <td style={{ ...tdRight, color: l.profitAmount >= 0 ? colors.success : colors.danger }}>{fmtMoney(l.profitAmount)}</td>
                  <td style={tdRight}>{fmtMoney(l.otrAmount)}</td>
                  <td style={{ ...tdRight, color: l.netProfitAmount >= 0 ? colors.teal : colors.danger }}>{fmtMoney(l.netProfitAmount)}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}><FlagCell value={l.quickPayFlag} /></td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}><FlagCell value={l.directPaymentFlag} /></td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}><FlagCell value={l.factoringFlag} /></td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}><FlagCell value={l.driverPaidFlag} /></td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Action buttons */}
      <div style={formActionsStyle}>
        <button
          type="button"
          onClick={onClose}
          style={secondaryBtnStyle}
        >
          {isSaved ? 'Back to Archive' : 'Back'}
        </button>
        {snapshot.loads.length > 0 && !isSaved && (
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            style={loadingBtnStyle(primaryBtnStyle, saving)}
          >
            {saving ? 'Saving...' : 'Save Statement'}
          </button>
        )}
      </div>
    </div>
  );
}
