'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Action } from '@lol/shared';
import type { SalaryRowDto, SalaryWeekStateDto, SalaryAuditLogDto } from '@lol/shared';
import { useAuth } from '@/lib/auth';
import { usePermissions } from '@/lib/permissions';
import { useWeeks } from '@/lib/use-weeks';
import { apiFetch } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import {
  thStyle,
  tdStyle,
  tdRight,
  smallBtnStyle,
  fmt,
  fmtDate,
  stickyToolbarStyle,
  toolbarGroupStyle,
  badgeStyle,
  tagStyle,
  bannerStyle,
  actionBtnStyle,
  disabledBtnStyle,
  accessDeniedStyle,
  accessDeniedSubtextStyle,
  tableWrapperStyle,
  tableStyle,
  totalRowStyle,
  thAction,
  tdAction,
  zebraRowProps,
  auditPanelStyle,
  auditPanelHeaderStyle,
  auditPanelEmptyStyle,
  auditTableStyle,
  auditThStyle,
  auditTdStyle,
  colors,
  fontSizes,
  spacing,
  inputStyle,
} from '@/lib/styles';
import { ErrorBanner, LoadingBox, EmptyBox } from '@/components/StateBoxes';
import { PageShell } from '@/components/PageShell';
import { WeekSwitcher } from '../loads/WeekSwitcher';
import { AdjustmentModal } from './AdjustmentModal';

type Filter = 'all' | 'with_salary' | 'no_salary';

export default function SalaryPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { can: allowed } = usePermissions();
  const router = useRouter();
  const { weeks, selectedWeek, selectWeek, loading: weeksLoading, error: weeksError } = useWeeks();

  const canMutate = allowed(Action.SalaryGenerate);

  const [rows, setRows] = useState<SalaryRowDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  // Week state
  const [weekState, setWeekState] = useState<SalaryWeekStateDto | null>(null);

  // Audit log
  const [auditLogs, setAuditLogs] = useState<SalaryAuditLogDto[]>([]);
  const [showAudit, setShowAudit] = useState(false);

  // Adjustment modal state
  const [adjustTarget, setAdjustTarget] = useState<SalaryRowDto | null>(null);

  // Generating state (per-dispatcher)
  const [generating, setGenerating] = useState<Set<string>>(new Set());

  // Action-in-progress (freeze, unfreeze, recalculate)
  const [actionLoading, setActionLoading] = useState(false);

  const isFrozen = weekState?.status === 'frozen';

  // ── Auth guard ──
  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  // ── Fetch salary preview + week state ──
  const fetchPreview = useCallback(async (weekId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [data, state] = await Promise.all([
        apiFetch<SalaryRowDto[]>(`/salary/preview?weekId=${weekId}`),
        apiFetch<SalaryWeekStateDto>(`/salary/week-state?weekId=${weekId}`),
      ]);
      setRows(data);
      setWeekState(state);
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedWeek) fetchPreview(selectedWeek.id);
  }, [selectedWeek, fetchPreview]);

  // ── Fetch audit log ──
  const fetchAuditLog = useCallback(async (weekId: string) => {
    try {
      const logs = await apiFetch<SalaryAuditLogDto[]>(`/salary/audit-log?weekId=${weekId}`);
      setAuditLogs(logs);
    } catch {
      setAuditLogs([]);
    }
  }, []);

  useEffect(() => {
    if (showAudit && selectedWeek) fetchAuditLog(selectedWeek.id);
  }, [showAudit, selectedWeek, fetchAuditLog]);

  // ── Filtered & searched rows ──
  const filteredRows = useMemo(() => {
    let result = rows;
    if (filter === 'with_salary') result = result.filter((r) => r.isGenerated);
    if (filter === 'no_salary') result = result.filter((r) => !r.isGenerated);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((r) => r.dispatcherName.toLowerCase().includes(q));
    }
    return result;
  }, [rows, filter, search]);

  // ── Summary totals ──
  const totals = useMemo(() => {
    return filteredRows.reduce(
      (acc, r) => ({
        profit: acc.profit + r.weeklyGrossProfit,
        base: acc.base + r.baseSalary,
        other: acc.other + r.totalOther,
        bonus: acc.bonus + r.totalBonus,
        total: acc.total + r.totalSalary,
      }),
      { profit: 0, base: 0, other: 0, bonus: 0, total: 0 },
    );
  }, [filteredRows]);

  // ── Handlers ──
  const handleGenerate = async (row: SalaryRowDto) => {
    if (generating.has(row.dispatcherId) || isFrozen) return;
    setGenerating((prev) => new Set(prev).add(row.dispatcherId));
    try {
      await apiFetch<SalaryRowDto>('/salary/generate', {
        method: 'POST',
        body: JSON.stringify({
          weekId: row.weekId,
          dispatcherId: row.dispatcherId,
          adjustments: row.adjustments,
        }),
      });
      if (selectedWeek) await fetchPreview(selectedWeek.id);
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setGenerating((prev) => {
        const next = new Set(prev);
        next.delete(row.dispatcherId);
        return next;
      });
    }
  };

  const handleAdjustSave = async (adjustments: { type: 'other' | 'bonus'; amount: number; note: string }[]) => {
    if (!adjustTarget || !selectedWeek) return;
    const targetId = adjustTarget.dispatcherId;
    setAdjustTarget(null);
    setGenerating((prev) => new Set(prev).add(targetId));
    try {
      await apiFetch<SalaryRowDto>('/salary/generate', {
        method: 'POST',
        body: JSON.stringify({
          weekId: selectedWeek.id,
          dispatcherId: targetId,
          adjustments,
        }),
      });
      await fetchPreview(selectedWeek.id);
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setGenerating((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
    }
  };

  const handleRecalculate = async () => {
    if (!selectedWeek || actionLoading || isFrozen) return;
    setActionLoading(true);
    setError(null);
    try {
      await apiFetch('/salary/recalculate', {
        method: 'POST',
        body: JSON.stringify({ weekId: selectedWeek.id }),
      });
      await fetchPreview(selectedWeek.id);
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setActionLoading(false);
    }
  };

  const handleFreeze = async () => {
    if (!selectedWeek || actionLoading) return;
    setActionLoading(true);
    setError(null);
    try {
      const state = await apiFetch<SalaryWeekStateDto>('/salary/freeze', {
        method: 'POST',
        body: JSON.stringify({ weekId: selectedWeek.id }),
      });
      setWeekState(state);
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnfreeze = async () => {
    if (!selectedWeek || actionLoading) return;
    setActionLoading(true);
    setError(null);
    try {
      const state = await apiFetch<SalaryWeekStateDto>('/salary/unfreeze', {
        method: 'POST',
        body: JSON.stringify({ weekId: selectedWeek.id }),
      });
      setWeekState(state);
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading) return <main style={{ padding: '2rem' }}><LoadingBox message="Authenticating..." /></main>;
  if (!user) return null;

  if (!allowed(Action.SalaryPreview)) {
    return (
      <PageShell breadcrumb="/ Salary" user={user} onLogout={logout} nav={[{label:'Home',href:'/'},{label:'Loads',href:'/loads'}]}>
        <div style={accessDeniedStyle}>
          <strong>Access Denied</strong>
          <p style={accessDeniedSubtextStyle}>
            You do not have permission to view salary data. Contact an administrator if you need access.
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      breadcrumb="/ Salary"
      user={user}
      onLogout={logout}
      nav={[
        { label: 'Home', href: '/' },
        { label: 'Loads', href: '/loads' },
        { label: 'Settings', href: '/settings' },
      ]}
      title="Salary Preview"
      subtitle={selectedWeek ? `${selectedWeek.label} — ${selectedWeek.startDate} to ${selectedWeek.endDate}` : undefined}
    >
      {/* ── Sticky Toolbar ── */}
      <div style={stickyToolbarStyle}>
        {weeksLoading ? (
          <span style={{ color: colors.textMuted, fontSize: fontSizes.md }}>Loading weeks...</span>
        ) : weeksError ? (
          <span style={{ color: colors.danger, fontSize: fontSizes.md }}>Week load error: {weeksError}</span>
        ) : (
          <WeekSwitcher weeks={weeks} selectedWeek={selectedWeek} onSelect={selectWeek} />
        )}

        <div style={toolbarGroupStyle}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            style={{ ...inputStyle, width: 180 }}
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}
            style={{ ...inputStyle, width: 'auto' }}
          >
            <option value="all">All</option>
            <option value="with_salary">With Salary</option>
            <option value="no_salary">No Salary</option>
          </select>
        </div>
      </div>

      {/* ── Week state banner ── */}
      {selectedWeek && weekState && (
        <div style={bannerStyle(weekState.status === 'frozen' ? 'info' : weekState.status === 'generated' ? 'success' : 'warning')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg }}>
            <span>
              <strong>{selectedWeek.label}</strong> &mdash; {selectedWeek.startDate} to {selectedWeek.endDate}
            </span>
            <span style={
              weekState.status === 'generated' ? tagStyle('solidSuccess') :
              weekState.status === 'open' ? tagStyle('solidWarning') :
              tagStyle('solidInfo')
            }>
              {weekState.status === 'generated' ? 'Generated' : weekState.status === 'open' ? 'Open' : 'Frozen'}
            </span>
            {weekState.generatedByName && (
              <span style={{ fontSize: fontSizes.sm, color: colors.textSecondary }}>
                Generated by {weekState.generatedByName}
                {weekState.generatedAt && ` on ${fmtDate(weekState.generatedAt)}`}
              </span>
            )}
            {weekState.frozenByName && (
              <span style={{ fontSize: fontSizes.sm, color: colors.textSecondary }}>
                | Frozen by {weekState.frozenByName}
                {weekState.frozenAt && ` on ${fmtDate(weekState.frozenAt)}`}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
            <span style={{ fontSize: fontSizes.base, color: colors.textSecondary, marginRight: spacing.md }}>
              {loading ? 'Loading...' : `${rows.length} dispatcher${rows.length !== 1 ? 's' : ''}`}
            </span>

            {/* Recalculate — only when generated (not frozen, not open), admin/accountant only */}
            {canMutate && weekState.status === 'generated' && (
              <button
                onClick={handleRecalculate}
                disabled={actionLoading}
                style={disabledBtnStyle(
                  { ...actionBtnStyle, background: colors.warning, color: colors.bgWhite, border: 'none' },
                  actionLoading,
                )}
              >
                {actionLoading ? '...' : 'Recalculate'}
              </button>
            )}

            {/* Freeze — only when generated, admin/accountant only */}
            {canMutate && weekState.status === 'generated' && (
              <button
                onClick={handleFreeze}
                disabled={actionLoading}
                style={disabledBtnStyle(
                  { ...actionBtnStyle, background: colors.primaryDark, color: colors.bgWhite, border: 'none' },
                  actionLoading,
                )}
              >
                {actionLoading ? '...' : 'Freeze'}
              </button>
            )}

            {/* Unfreeze — only when frozen, admin/accountant only */}
            {canMutate && weekState.status === 'frozen' && (
              <button
                onClick={handleUnfreeze}
                disabled={actionLoading}
                style={disabledBtnStyle(
                  { ...actionBtnStyle, background: colors.danger, color: colors.bgWhite, border: 'none' },
                  actionLoading,
                )}
              >
                {actionLoading ? '...' : 'Unfreeze'}
              </button>
            )}

            {/* Audit log toggle */}
            <button
              onClick={() => setShowAudit(!showAudit)}
              style={{
                ...actionBtnStyle,
                background: showAudit ? colors.text : colors.bgWhite,
                color: showAudit ? colors.bgWhite : colors.text,
                border: `1px solid ${colors.border}`,
              }}
            >
              Audit Log
            </button>
          </div>
        </div>
      )}

      {/* ── Frozen notice ── */}
      {isFrozen && (
        <div style={bannerStyle('info')}>
          <span style={tagStyle('solidInfo')}>
            READ ONLY
          </span>
          <span>
            This week is frozen. Generate, recalculate, and adjustment actions are disabled. Unfreeze to make changes.
          </span>
        </div>
      )}

      {/* ── Error banner ── */}
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {/* ── Audit log panel ── */}
      {showAudit && (
        <div style={auditPanelStyle}>
          <div style={auditPanelHeaderStyle}>
            Audit Log — {selectedWeek?.label}
          </div>
          {auditLogs.length === 0 ? (
            <div style={auditPanelEmptyStyle}>
              No audit entries for this week.
            </div>
          ) : (
            <table style={auditTableStyle}>
              <thead>
                <tr>
                  <th style={auditThStyle}>Time</th>
                  <th style={auditThStyle}>Action</th>
                  <th style={auditThStyle}>By</th>
                  <th style={auditThStyle}>Detail</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ ...auditTdStyle, whiteSpace: 'nowrap' }}>{fmtDate(log.createdAt)}</td>
                    <td style={auditTdStyle}>
                      <span style={
                        log.action === 'generate' ? badgeStyle('success') :
                        log.action === 'recalculate' ? badgeStyle('warning') :
                        log.action === 'freeze' ? badgeStyle('info') :
                        log.action === 'unfreeze' ? badgeStyle('danger') :
                        log.action === 'adjustment' ? badgeStyle('purple') :
                        badgeStyle('muted')
                      }>
                        {log.action}
                      </span>
                    </td>
                    <td style={auditTdStyle}>{log.performedByName}</td>
                    <td style={{ ...auditTdStyle, color: colors.textSecondary }}>{log.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <LoadingBox message="Loading salary data..." subtitle="Calculating preview for all dispatchers" />
      ) : rows.length === 0 ? (
        <EmptyBox title="No salary data" subtitle="No dispatchers with loads found for this week, or no active salary rule configured." />
      ) : (
        <div style={tableWrapperStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Dispatcher</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Gross Profit</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>%</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Base Salary</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Other</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Bonus</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Loads</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Status</th>
                <th style={thAction}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r, idx) => {
                const zebra = zebraRowProps(idx);
                return (
                <tr key={r.dispatcherId} style={zebra.style} onMouseEnter={zebra.onMouseEnter} onMouseLeave={zebra.onMouseLeave}>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: 500 }}>{r.dispatcherName}</span>
                  </td>
                  <td style={tdRight}>{fmt(r.weeklyGrossProfit)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{r.appliedPercent}%</td>
                  <td style={tdRight}>{fmt(r.baseSalary)}</td>
                  <td style={{ ...tdRight, color: r.totalOther !== 0 ? colors.purple : colors.border }}>
                    {fmt(r.totalOther)}
                  </td>
                  <td style={{ ...tdRight, color: r.totalBonus !== 0 ? colors.success : colors.border }}>
                    {fmt(r.totalBonus)}
                  </td>
                  <td style={{ ...tdRight, fontWeight: 600 }}>
                    {fmt(r.totalSalary)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{r.loadCount}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <span style={r.isGenerated ? badgeStyle('success') : badgeStyle('warning')}>
                      {r.isGenerated ? 'Generated' : 'Pending'}
                    </span>
                  </td>
                  <td style={tdAction}>
                    <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'center' }}>
                      {canMutate && (
                        <button
                          onClick={() => !isFrozen && setAdjustTarget(r)}
                          disabled={isFrozen}
                          style={disabledBtnStyle(smallBtnStyle, isFrozen)}
                        >
                          Adjust
                        </button>
                      )}
                      {canMutate && !r.isGenerated && (
                        <button
                          onClick={() => handleGenerate(r)}
                          disabled={generating.has(r.dispatcherId) || isFrozen}
                          style={disabledBtnStyle(
                            { ...smallBtnStyle, background: colors.primary, color: colors.bgWhite, border: 'none' },
                            generating.has(r.dispatcherId) || isFrozen,
                          )}
                        >
                          {generating.has(r.dispatcherId) ? '...' : 'Generate'}
                        </button>
                      )}
                      {r.isGenerated && r.id && (
                        <button
                          onClick={() => router.push(`/salary/${r.id}`)}
                          style={{ ...smallBtnStyle, color: colors.primary }}
                        >
                          View
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
            {/* ── Totals row ── */}
            <tfoot>
              <tr style={totalRowStyle}>
                <td style={tdStyle}>Totals ({filteredRows.length})</td>
                <td style={tdRight}>{fmt(totals.profit)}</td>
                <td style={tdStyle}></td>
                <td style={tdRight}>{fmt(totals.base)}</td>
                <td style={tdRight}>{fmt(totals.other)}</td>
                <td style={tdRight}>{fmt(totals.bonus)}</td>
                <td style={tdRight}>{fmt(totals.total)}</td>
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ── Adjustment modal ── */}
      {adjustTarget && (
        <AdjustmentModal
          dispatcherName={adjustTarget.dispatcherName}
          existingAdjustments={adjustTarget.adjustments}
          onSave={handleAdjustSave}
          onClose={() => setAdjustTarget(null)}
        />
      )}
    </PageShell>
  );
}
