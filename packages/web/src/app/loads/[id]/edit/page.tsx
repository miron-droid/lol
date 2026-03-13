'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { LoadStatus } from '@lol/shared';
import type { WeekDto, LoadDto, UpdateLoadRequest } from '@lol/shared';
import { useAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { LoadForm, emptyFormData, type LoadFormData } from '../../LoadForm';
import { PageShell } from '@/components/PageShell';
import { ErrorBanner, LoadingBox } from '@/components/StateBoxes';
import { bannerStyle, tagStyle } from '@/lib/styles';

export default function EditLoadPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const loadId = params.id;

  const [weeks, setWeeks] = useState<WeekDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<LoadFormData | null>(null);
  const [isArchived, setIsArchived] = useState(false);
  const [archivedAt, setArchivedAt] = useState<string | null>(null);

  // ── Auth guard ────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  // ── Fetch existing load + weeks ───────────────────────────
  useEffect(() => {
    if (!user || !loadId) return;

    let cancelled = false;

    async function init() {
      try {
        const [load, allWeeks] = await Promise.all([
          apiFetch<LoadDto>(`/loads/${loadId}`),
          apiFetch<WeekDto[]>('/weeks'),
        ]);
        if (cancelled) return;

        setWeeks(allWeeks);
        setIsArchived(!!load.archivedAt);
        setArchivedAt(load.archivedAt);
        setInitialData(
          emptyFormData({
            sylNumber: load.sylNumber,
            weekId: load.weekId,
            date: load.date,
            dispatcherId: load.dispatcherId,
            businessName: load.businessName,
            fromAddress: load.fromAddress,
            fromState: load.fromState,
            fromDate: load.fromDate,
            toAddress: load.toAddress,
            toState: load.toState,
            toDate: load.toDate,
            miles: String(load.miles),
            grossAmount: String(load.grossAmount),
            driverCostAmount: String(load.driverCostAmount),
            unitId: load.unitId || '',
            driverId: load.driverId || '',
            brokerageId: load.brokerageId || '',
            netsuiteRef: load.netsuiteRef || '',
            comment: load.comment || '',
            quickPayFlag: load.quickPayFlag,
            directPaymentFlag: load.directPaymentFlag,
            factoringFlag: load.factoringFlag,
            driverPaidFlag: load.driverPaidFlag,
            loadStatus: load.loadStatus,
          }),
        );
      } catch (err: unknown) {
        if (!cancelled) setInitError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [user, loadId]);

  // ── Submit handler ────────────────────────────────────────
  async function handleUpdate(data: LoadFormData) {
    const body: UpdateLoadRequest = {
      date: data.date,
      dispatcherId: data.dispatcherId.trim(),
      businessName: data.businessName.trim(),
      fromAddress: data.fromAddress.trim(),
      fromState: data.fromState.trim(),
      fromDate: data.fromDate,
      toAddress: data.toAddress.trim(),
      toState: data.toState.trim(),
      toDate: data.toDate,
      miles: parseFloat(data.miles) || 0,
      grossAmount: parseFloat(data.grossAmount) || 0,
      driverCostAmount: parseFloat(data.driverCostAmount) || 0,
      unitId: data.unitId.trim() || null,
      driverId: data.driverId.trim() || null,
      brokerageId: data.brokerageId.trim() || null,
      netsuiteRef: data.netsuiteRef.trim() || null,
      comment: data.comment.trim() || null,
      quickPayFlag: data.quickPayFlag,
      directPaymentFlag: data.directPaymentFlag,
      factoringFlag: data.factoringFlag,
      driverPaidFlag: data.driverPaidFlag,
      loadStatus: data.loadStatus as LoadStatus,
    };

    await apiFetch(`/loads/${loadId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });

    router.push('/loads');
  }

  // ── Render ────────────────────────────────────────────────
  if (authLoading || loading) {
    return <main style={{ padding: '2rem' }}><LoadingBox message="Loading load..." /></main>;
  }

  if (!user) return null;

  if (initError) {
    return (
      <main style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
        <ErrorBanner message={initError} />
      </main>
    );
  }

  if (!initialData) return null;

  return (
    <PageShell
      breadcrumb={isArchived ? '/ View Load (Archived)' : '/ Edit Load'}
      user={user}
      onLogout={logout}
      nav={[{ label: 'Home', href: '/' }, { label: 'Loads', href: '/loads' }]}
      title={isArchived ? `View Load — ${initialData.sylNumber}` : `Edit Load — ${initialData.sylNumber}`}
      subtitle={isArchived ? 'This load is archived and read-only' : 'Update load details'}
      maxWidth={1000}
    >
      {/* ── Archived banner ── */}
      {isArchived && (
        <div style={{ ...bannerStyle('warning'), justifyContent: 'space-between' }}>
          <span>
            This load is archived{archivedAt ? ` (since ${new Date(archivedAt).toLocaleDateString()})` : ''} and is read-only. Unarchive it from the Loads list to make changes.
          </span>
          <span style={tagStyle('solidWarning')}>ARCHIVED</span>
        </div>
      )}

      {isArchived ? (
        <LoadForm
          initialData={initialData}
          weeks={weeks}
          onSubmit={handleUpdate}
          submitLabel="Save Changes"
          title={`View Load — ${initialData.sylNumber}`}
          isEdit
          readOnly
        />
      ) : (
        <LoadForm
          initialData={initialData}
          weeks={weeks}
          onSubmit={handleUpdate}
          submitLabel="Save Changes"
          title={`Edit Load — ${initialData.sylNumber}`}
          isEdit
        />
      )}
    </PageShell>
  );
}
