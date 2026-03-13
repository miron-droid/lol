'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Action } from '@lol/shared';
import type { WeekDto, StatementDto, StatementArchiveItem, GenerateStatementRequest, StatementType } from '@lol/shared';
import { useAuth } from '@/lib/auth';
import { usePermissions } from '@/lib/permissions';
import { useMasterData } from '@/lib/use-master-data';
import { apiFetch } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { labelStyle, inputStyle, checkboxLabelStyle, fmt, tabBtnStyle, thStyle, tdStyle, tdRight, tableWrapperStyle, tableStyle, smallBtnStyle, primaryBtnStyle, loadingBtnStyle, accessDeniedStyle, accessDeniedSubtextStyle, badgeStyle, zebraRowProps, thAction, tdAction, colors, spacing } from '@/lib/styles';
import { ErrorBanner, LoadingBox, EmptyBox } from '@/components/StateBoxes';
import { EntityPicker } from '@/components/EntityPicker';
import { PageShell } from '@/components/PageShell';
import { StatementPreview } from './StatementPreview';

// ── Types ─────────────────────────────────────────────────────
type PaymentFilter = 'all' | 'quick_pay' | 'direct';
const PAYMENT_OPTIONS: { value: PaymentFilter; label: string }[] = [
  { value: 'all', label: 'All Loads' },
  { value: 'quick_pay', label: 'Quick Pay Only' },
  { value: 'direct', label: 'Direct Payment Only' },
];

type ViewMode = 'form' | 'preview' | 'archive';

export default function StatementsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { can: allowed } = usePermissions();
  const router = useRouter();

  // ── State ───────────────────────────────────────────────────
  const [view, setView] = useState<ViewMode>('form');
  const [weeks, setWeeks] = useState<WeekDto[]>([]);
  const [weekId, setWeekId] = useState('');
  const [statementType, setStatementType] = useState<StatementType>('driver');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [onlyUnpaid, setOnlyUnpaid] = useState(false);
  const [unitId, setUnitId] = useState('');

  const { items: unitItems, loading: unitsLoading } = useMasterData('units');

  const [preview, setPreview] = useState<StatementDto | null>(null);
  const [archive, setArchive] = useState<StatementArchiveItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ── Auth guard ──────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  // ── Fetch weeks once ────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    apiFetch<WeekDto[]>('/weeks').then((wks) => {
      setWeeks(wks);
      const current = wks.find((w) => w.isCurrent);
      if (current) setWeekId(current.id);
      else if (wks.length > 0) setWeekId(wks[0].id);
    });
  }, [user]);

  // ── Fetch archive when switching to archive view ────────────
  useEffect(() => {
    if (view !== 'archive' || !user) return;
    setLoading(true);
    setError(null);
    apiFetch<StatementArchiveItem[]>('/statements')
      .then((items) => { setArchive(items); setLoading(false); })
      .catch((err: unknown) => { setError(getErrorMessage(err)); setLoading(false); });
  }, [view, user]);

  // ── Preview handler ─────────────────────────────────────────
  async function handlePreview() {
    setError(null);
    setLoading(true);
    try {
      const body: GenerateStatementRequest = {
        statementType,
        weekId,
        paymentFilter,
        onlyUnpaid,
        ...(unitId.trim() ? { unitId: unitId.trim() } : {}),
      };
      const result = await apiFetch<StatementDto>('/statements/preview', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setPreview(result);
      setView('preview');
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  // ── Save handler ────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const body: GenerateStatementRequest = {
        statementType,
        weekId,
        paymentFilter,
        onlyUnpaid,
        ...(unitId.trim() ? { unitId: unitId.trim() } : {}),
      };
      await apiFetch<StatementDto>('/statements', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setView('archive');
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  // ── View a single archived statement ────────────────────────
  async function handleViewArchived(id: string) {
    setLoading(true);
    setError(null);
    try {
      const stmt = await apiFetch<StatementDto>(`/statements/${id}`);
      setPreview(stmt);
      setView('preview');
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  // ── Render guards ───────────────────────────────────────────
  if (authLoading) return <main style={{ padding: '2rem' }}><LoadingBox message="Authenticating..." /></main>;
  if (!user) return null;

  if (!allowed(Action.StatementsRead)) {
    return (
      <PageShell breadcrumb="/ Statements" user={user} onLogout={logout} nav={[{label:'Loads',href:'/loads'},{label:'Home',href:'/'}]}>
        <div style={accessDeniedStyle}>
          <strong>Access Denied</strong>
          <p style={accessDeniedSubtextStyle}>
            You do not have permission to view statements. Contact an administrator if you need access.
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      breadcrumb="/ Statements"
      user={user}
      onLogout={logout}
      nav={[{label:'Loads',href:'/loads'},{label:'Home',href:'/'}]}
      title="Statements"
      subtitle="Generate and manage driver/owner statements"
    >
      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: spacing.md, marginBottom: spacing.xl }}>
        <button onClick={() => setView('form')} style={tabBtnStyle(view === 'form')}>Generate</button>
        <button onClick={() => setView('archive')} style={tabBtnStyle(view === 'archive')}>Archive</button>
      </div>

      {/* ── Error ── */}
      {error && <ErrorBanner message={error} />}

      {/* ── Form view ── */}
      {view === 'form' && (
        <div style={{ maxWidth: 500 }}>
          <div style={{ marginBottom: spacing.xl }}>
            <label style={labelStyle}>Statement Type</label>
            <select style={inputStyle} value={statementType} onChange={(e) => setStatementType(e.target.value as StatementType)}>
              <option value="driver">Driver</option>
              <option value="owner">Owner</option>
            </select>
          </div>
          <div style={{ marginBottom: spacing.xl }}>
            <label style={labelStyle}>Week</label>
            <select style={inputStyle} value={weekId} onChange={(e) => setWeekId(e.target.value)}>
              {weeks.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.label} ({w.startDate} — {w.endDate}){w.isCurrent ? ' (current)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: spacing.xl }}>
            <label style={labelStyle}>Payment Filter</label>
            <select style={inputStyle} value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)}>
              {PAYMENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: spacing.xl }}>
            <label style={checkboxLabelStyle}>
              <input type="checkbox" checked={onlyUnpaid} onChange={(e) => setOnlyUnpaid(e.target.checked)} />
              Only Unpaid (driver not paid)
            </label>
          </div>
          <div style={{ marginBottom: spacing.xxl }}>
            <EntityPicker
              label="Unit"
              value={unitId}
              onChange={setUnitId}
              items={unitItems}
              loading={unitsLoading}
              placeholder="Select unit (optional)..."
            />
          </div>
          <button
            onClick={handlePreview}
            disabled={loading || !weekId}
            style={loadingBtnStyle(primaryBtnStyle, loading)}
          >
            {loading ? 'Loading...' : 'Preview Statement'}
          </button>
        </div>
      )}

      {/* ── Preview view ── */}
      {view === 'preview' && preview && (
        <StatementPreview
          statement={preview}
          onSave={handleSave}
          onClose={() => {
            setView(preview.id ? 'archive' : 'form');
            setPreview(null);
          }}
          saving={saving}
        />
      )}

      {/* ── Archive view ── */}
      {view === 'archive' && (
        <>
          {loading ? (
            <LoadingBox message="Loading archive..." subtitle="Fetching saved statements" />
          ) : archive.length === 0 ? (
            <EmptyBox
              title="No statements generated yet"
              subtitle="Use the Generate tab to create your first statement."
              actionLabel="Generate"
              onAction={() => setView('form')}
            />
          ) : (
            <div style={tableWrapperStyle}>
              <table style={{ ...tableStyle, minWidth: 800 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Type</th>
                    <th style={thStyle}>Week</th>
                    <th style={thStyle}>Unit</th>
                    <th style={thStyle}>Loads</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Gross</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Net Profit</th>
                    <th style={thStyle}>Generated</th>
                    <th style={thStyle}>By</th>
                    <th style={thAction}></th>
                  </tr>
                </thead>
                <tbody>
                  {archive.map((s, idx) => {
                    const zebra = zebraRowProps(idx);
                    return (
                    <tr key={s.id} style={{ ...zebra.style, cursor: 'pointer' }} onClick={() => handleViewArchived(s.id)}
                      onMouseEnter={zebra.onMouseEnter} onMouseLeave={zebra.onMouseLeave}
                    >
                      <td style={tdStyle}>
                        <span style={badgeStyle(s.statementType === 'driver' ? 'info' : 'purple')}>
                          {s.statementType}
                        </span>
                      </td>
                      <td style={tdStyle}>{s.weekLabel}</td>
                      <td style={tdStyle}>{s.unitId ? s.unitId.substring(0, 8) + '...' : '—'}</td>
                      <td style={tdStyle}>{s.loadCount}</td>
                      <td style={tdRight}>{fmt(s.totalGross)}</td>
                      <td style={{ ...tdRight, color: s.totalNetProfit >= 0 ? colors.teal : colors.danger }}>{fmt(s.totalNetProfit)}</td>
                      <td style={tdStyle}>{new Date(s.generatedAt).toLocaleString()}</td>
                      <td style={tdStyle}>{s.generatedByName}</td>
                      <td style={tdAction}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleViewArchived(s.id); }}
                          style={smallBtnStyle}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}
