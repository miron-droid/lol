'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoadStatus } from '@lol/shared';
import type { WeekDto, CreateLoadRequest } from '@lol/shared';
import { useAuth } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';
import { apiFetch } from '@/lib/api';
import { LoadForm, emptyFormData, type LoadFormData } from '../LoadForm';
import { PageShell } from '@/components/PageShell';
import { ErrorBanner, LoadingBox } from '@/components/StateBoxes';

export function NewLoadContent() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedWeekId = searchParams.get('weekId');

  const [weeks, setWeeks] = useState<WeekDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<LoadFormData | null>(null);

  // ── Auth guard ────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  // ── Load weeks + set defaults ─────────────────────────────
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function init() {
      try {
        const [current, allWeeks] = await Promise.all([
          apiFetch<WeekDto>('/weeks/current'),
          apiFetch<WeekDto[]>('/weeks'),
        ]);
        if (cancelled) return;

        setWeeks(allWeeks);

        const defaultWeekId = preselectedWeekId || current.id;
        const defaultWeek = allWeeks.find((w) => w.id === defaultWeekId) || current;

        setInitialData(
          emptyFormData({
            weekId: defaultWeek.id,
            date: defaultWeek.startDate,
            fromDate: defaultWeek.startDate,
            toDate: defaultWeek.startDate,
            dispatcherId: user!.id,
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
  }, [user, preselectedWeekId]);

  // ── Submit handler ────────────────────────────────────────
  async function handleCreate(data: LoadFormData) {
    const body: CreateLoadRequest = {
      sylNumber: data.sylNumber.trim(),
      weekId: data.weekId,
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
      // optional fields — only send if non-empty
      ...(data.unitId.trim() ? { unitId: data.unitId.trim() } : {}),
      ...(data.driverId.trim() ? { driverId: data.driverId.trim() } : {}),
      ...(data.brokerageId.trim() ? { brokerageId: data.brokerageId.trim() } : {}),
      ...(data.netsuiteRef.trim() ? { netsuiteRef: data.netsuiteRef.trim() } : {}),
      ...(data.comment.trim() ? { comment: data.comment.trim() } : {}),
      quickPayFlag: data.quickPayFlag,
      directPaymentFlag: data.directPaymentFlag,
      factoringFlag: data.factoringFlag,
      driverPaidFlag: data.driverPaidFlag,
      loadStatus: data.loadStatus as LoadStatus,
    };

    await apiFetch('/loads', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    router.push('/loads');
  }

  // ── Render ────────────────────────────────────────────────
  if (authLoading || loading) {
    return <main style={{ padding: '2rem' }}><LoadingBox message="Loading..." /></main>;
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
      breadcrumb="/ New Load"
      user={user}
      onLogout={logout}
      nav={[{ label: 'Home', href: '/' }, { label: 'Loads', href: '/loads' }]}
      title="New Load"
      subtitle="Create a new load entry"
      maxWidth={1000}
    >
      <LoadForm
        initialData={initialData}
        weeks={weeks}
        onSubmit={handleCreate}
        submitLabel="Create Load"
        title="New Load"
      />
    </PageShell>
  );
}
