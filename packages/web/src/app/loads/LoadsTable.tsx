'use client';

import type { LoadDto } from '@lol/shared';
import { LoadStatus } from '@lol/shared';
import { thStyle, tdStyle, tdRight, smallBtnStyle, tableWrapperStyle, tableStyle, badgeStyle, tagStyle, thAction, tdAction, colors, spacing, zebraRowProps, fmt } from '@/lib/styles';

interface LoadsTableProps {
  loads: LoadDto[];
  onEdit: (loadId: string) => void;
  onArchive?: (loadId: string) => void;
  onUnarchive?: (loadId: string) => void;
}

const STATUS_LABEL: Record<LoadStatus, string> = {
  [LoadStatus.NotPickedUp]: 'Not Picked Up',
  [LoadStatus.InTransit]: 'In Transit',
  [LoadStatus.Delivered]: 'Delivered',
  [LoadStatus.Completed]: 'Completed',
  [LoadStatus.Cancelled]: 'Cancelled',
};

const STATUS_BADGE_VARIANT: Record<LoadStatus, 'muted' | 'info' | 'success' | 'danger'> = {
  [LoadStatus.NotPickedUp]: 'muted',
  [LoadStatus.InTransit]: 'info',
  [LoadStatus.Delivered]: 'success',
  [LoadStatus.Completed]: 'success',
  [LoadStatus.Cancelled]: 'danger',
};

function FlagCell({ value }: { value: boolean }) {
  return (
    <span style={{ color: value ? colors.success : colors.flagInactive, fontWeight: value ? 600 : 400 }}>
      {value ? 'Y' : '-'}
    </span>
  );
}

export function LoadsTable({ loads, onEdit, onArchive, onUnarchive }: LoadsTableProps) {
  return (
    <div style={tableWrapperStyle}>
      <table style={{ ...tableStyle, minWidth: 1300 }}>
        <thead>
          <tr>
            <th style={thStyle}>SYL #</th>
            <th style={thStyle}>Date</th>
            <th style={thStyle}>Business</th>
            <th style={thStyle}>From</th>
            <th style={thStyle}>To</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Gross</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Driver Cost</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Profit</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Profit %</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>OTR</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Net Profit</th>
            <th style={thStyle}>Status</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>QP</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>DP</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>Fact</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>Paid</th>
            <th style={thAction}></th>
          </tr>
        </thead>
        <tbody>
          {loads.map((load, idx) => {
            const isArchived = !!load.archivedAt;
            const zebra = zebraRowProps(idx, isArchived ? colors.warningBg : undefined);
            return (
            <tr
              key={load.id}
              style={{ ...zebra.style, cursor: 'pointer', opacity: isArchived ? 0.6 : 1 }}
              onClick={() => onEdit(load.id)}
              onMouseEnter={zebra.onMouseEnter}
              onMouseLeave={zebra.onMouseLeave}
            >
              <td style={{ ...tdStyle, fontWeight: 600 }}>
                {load.sylNumber}
                {isArchived && (
                  <span style={{ marginLeft: 6, display: 'inline-block', verticalAlign: 'middle', ...tagStyle('solidWarning') }}>
                    ARCHIVED
                  </span>
                )}
              </td>
              <td style={tdStyle}>{load.date}</td>
              <td style={{ ...tdStyle, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {load.businessName}
              </td>
              <td style={{ ...tdStyle, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {load.fromAddress}
              </td>
              <td style={{ ...tdStyle, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {load.toAddress}
              </td>
              <td style={tdRight}>{fmt(load.grossAmount)}</td>
              <td style={tdRight}>{fmt(load.driverCostAmount)}</td>
              <td style={{ ...tdRight, color: load.profitAmount >= 0 ? colors.success : colors.danger }}>
                {fmt(load.profitAmount)}
              </td>
              <td style={{ ...tdRight, color: load.profitPercent >= 0 ? colors.success : colors.danger }}>
                {Number(load.profitPercent).toFixed(1)}%
              </td>
              <td style={tdRight}>{fmt(load.otrAmount)}</td>
              <td style={{ ...tdRight, color: load.netProfitAmount >= 0 ? colors.success : colors.danger }}>
                {fmt(load.netProfitAmount)}
              </td>
              <td style={tdStyle}>
                <span style={badgeStyle(STATUS_BADGE_VARIANT[load.loadStatus])}>
                  {STATUS_LABEL[load.loadStatus] || load.loadStatus}
                </span>
              </td>
              <td style={{ ...tdStyle, textAlign: 'center' }}><FlagCell value={load.quickPayFlag} /></td>
              <td style={{ ...tdStyle, textAlign: 'center' }}><FlagCell value={load.directPaymentFlag} /></td>
              <td style={{ ...tdStyle, textAlign: 'center' }}><FlagCell value={load.factoringFlag} /></td>
              <td style={{ ...tdStyle, textAlign: 'center' }}><FlagCell value={load.driverPaidFlag} /></td>
              <td style={tdAction}>
                <div style={{ display: 'flex', gap: spacing.xs, justifyContent: 'center' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(load.id);
                    }}
                    style={smallBtnStyle}
                  >
                    {isArchived ? 'View' : 'Edit'}
                  </button>
                  {!isArchived && onArchive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onArchive(load.id);
                      }}
                      style={{
                        ...smallBtnStyle,
                        background: colors.warningBg,
                        borderColor: colors.warningBorder,
                        color: colors.orange,
                      }}
                    >
                      Archive
                    </button>
                  )}
                  {isArchived && onUnarchive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnarchive(load.id);
                      }}
                      style={{
                        ...smallBtnStyle,
                        background: colors.successBg,
                        borderColor: colors.successBorder,
                        color: colors.success,
                      }}
                    >
                      Unarchive
                    </button>
                  )}
                </div>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
