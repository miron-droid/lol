'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { APP_NAME, API_PREFIX, Action, type HealthResponse } from '@lol/shared';
import { useAuth } from '@/lib/auth';
import { usePermissions } from '@/lib/permissions';
import { colors, fontSizes, radii, spacing, shadows, primaryBtnStyle, navBtnStyle, cardStyle, pageTitleStyle, pageSubtitleStyle } from '@/lib/styles';

export default function HomePage() {
  const { user, loading, logout } = useAuth();
  const { can: allowed } = usePermissions();
  const router = useRouter();
  const [health, setHealth] = useState<HealthResponse | null>(null);

  const homeBtn = (bg: string): React.CSSProperties => ({
    ...primaryBtnStyle,
    padding: `${spacing.lg} ${spacing.xxl}`,
    background: bg,
    borderRadius: radii.lg,
    fontSize: fontSizes.lg,
    boxShadow: shadows.card,
    flex: '1 1 auto',
    minWidth: 140,
    justifyContent: 'center',
  });

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    fetch(`${apiUrl}${API_PREFIX}/health`)
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  if (loading) {
    return <main style={{ padding: '2rem' }}>Loading...</main>;
  }

  if (!user) {
    return null; // redirecting to /login
  }

  return (
    <main style={{ padding: spacing.pageX, maxWidth: 700, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xxl }}>
        <div>
          <h1 style={pageTitleStyle}>{APP_NAME}</h1>
          <p style={pageSubtitleStyle}>
            Signed in as <strong>{user.firstName} {user.lastName}</strong> ({user.role})
          </p>
        </div>
        <button
          onClick={logout}
          style={{
            ...navBtnStyle,
            background: colors.bgPage,
          }}
        >
          Logout
        </button>
      </div>

      <div style={{ display: 'flex', gap: spacing.lg, flexWrap: 'wrap', marginBottom: spacing.xxl }}>
        <button
          onClick={() => router.push('/dashboard')}
          style={homeBtn(colors.teal)}
        >
          Dashboard
        </button>
        <button
          onClick={() => router.push('/loads')}
          style={homeBtn(colors.primary)}
        >
          List of Loads
        </button>
        {allowed(Action.SalaryPreview) && (
          <button
            onClick={() => router.push('/salary')}
            style={homeBtn(colors.purple)}
          >
            Salary
          </button>
        )}
        {allowed(Action.SalaryRulesRead) && (
          <button
            onClick={() => router.push('/settings')}
            style={homeBtn(colors.slate)}
          >
            Settings
          </button>
        )}
      </div>

      <div style={cardStyle}>
        <h3 style={{ margin: `0 0 ${spacing.md}`, fontSize: fontSizes.md, fontWeight: 600, color: colors.textSecondary }}>API Health</h3>
        {health ? (
          <pre
            style={{
              background: colors.bgPage,
              padding: spacing.xl,
              borderRadius: radii.lg,
              margin: 0,
              fontSize: fontSizes.sm,
              overflow: 'auto',
            }}
          >
            {JSON.stringify(health, null, 2)}
          </pre>
        ) : (
          <p style={{ color: colors.textMuted, margin: 0, fontSize: fontSizes.md }}>Connecting to API...</p>
        )}
      </div>
    </main>
  );
}
