'use client';

import { useRouter, usePathname } from 'next/navigation';
import { APP_NAME } from '@lol/shared';
import type { UserProfile } from '@lol/shared';
import { navBtnStyle, fontSizes, colors, spacing, pageTitleStyle, pageSubtitleStyle, shadows } from '@/lib/styles';

interface NavItem {
  label: string;
  href: string;
}

interface PageShellProps {
  /** Breadcrumb text shown after the app name, e.g. "/ Loads" */
  breadcrumb: string;
  /** Currently logged-in user (for name display) */
  user: UserProfile;
  /** Callback to log out */
  onLogout: () => void;
  /** Navigation links to show in the header (besides Logout) */
  nav?: NavItem[];
  /** Max width of the content area (default: 1400) */
  maxWidth?: number;
  /** Optional page title for section hierarchy */
  title?: string;
  /** Optional subtitle below the title */
  subtitle?: string;
  children: React.ReactNode;
}

const DEFAULT_NAV: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Loads', href: '/loads' },
  { label: 'Salary', href: '/salary' },
  { label: 'Settings', href: '/settings' },
];

export function PageShell({
  breadcrumb,
  user,
  onLogout,
  nav = DEFAULT_NAV,
  maxWidth = 1400,
  title,
  subtitle,
  children,
}: PageShellProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <main style={{ maxWidth, margin: '0 auto' }}>
      {/* ── Sticky Header ── */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: colors.bgWhite,
          boxShadow: shadows.stickyBar,
          padding: `${spacing.lg} ${spacing.pageX}`,
          marginLeft: `-${spacing.pageX}`,
          marginRight: `-${spacing.pageX}`,
          marginBottom: spacing.xxl,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            maxWidth,
            margin: '0 auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
            <h1 style={{ margin: 0, fontSize: fontSizes.title, fontWeight: 700 }}>{APP_NAME}</h1>
            <span style={{ color: colors.textMuted, fontSize: fontSizes.md }}>
              {breadcrumb}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: fontSizes.base, color: colors.textSecondary, marginRight: spacing.md }}>
              {user.firstName} {user.lastName}
            </span>
            {nav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  style={
                    isActive
                      ? {
                          ...navBtnStyle,
                          background: colors.primaryLight,
                          color: colors.primaryDark,
                          borderColor: colors.primaryDark,
                        }
                      : navBtnStyle
                  }
                >
                  {item.label}
                </button>
              );
            })}
            <button
              onClick={onLogout}
              style={{ ...navBtnStyle, background: colors.bgPage }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* ── Page content with padding ── */}
      <div style={{ padding: `0 ${spacing.pageX}` }}>
        {/* ── Section Hierarchy: Title + Subtitle ── */}
        {title && (
          <div style={{ marginBottom: spacing.xl }}>
            <h2 style={pageTitleStyle}>{title}</h2>
            {subtitle && <p style={pageSubtitleStyle}>{subtitle}</p>}
          </div>
        )}

        {children}
      </div>
    </main>
  );
}
