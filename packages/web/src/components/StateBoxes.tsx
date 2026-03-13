'use client';

import { colors, fontSizes, radii, spacing, primaryBtnStyle, shadows } from '@/lib/styles';

// ── Error banner ───────────────────────────────────────────────

interface ErrorBannerProps {
  message: string;
  /** Show a dismiss button. Calls onDismiss when clicked. */
  onDismiss?: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div
      style={{
        padding: `${spacing.lg} ${spacing.xl}`,
        background: colors.dangerBg,
        color: colors.danger,
        borderRadius: radii.lg,
        border: `1px solid ${colors.dangerBorder}`,
        marginBottom: '1rem',
        fontSize: fontSizes.md,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: spacing.lg,
      }}
    >
      <div>
        <div style={{ fontWeight: 600, marginBottom: spacing.xs }}>Something went wrong</div>
        <div style={{ fontSize: fontSizes.base, lineHeight: 1.5 }}>{message}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            marginLeft: '1rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: colors.danger,
            fontWeight: 600,
            fontSize: fontSizes.lg,
            flexShrink: 0,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

// ── Loading spinner placeholder ────────────────────────────────

interface LoadingBoxProps {
  message?: string;
  subtitle?: string;
}

export function LoadingBox({ message = 'Loading...', subtitle }: LoadingBoxProps) {
  return (
    <div
      style={{
        padding: '2.5rem 1.5rem',
        textAlign: 'center',
        color: colors.textMuted,
      }}
    >
      <div
        style={{
          width: '2.25rem',
          height: '2.25rem',
          border: `2.5px solid ${colors.borderLight}`,
          borderTop: `2.5px solid ${colors.primary}`,
          borderRadius: '50%',
          margin: '0 auto 1rem',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <div style={{ fontWeight: 600, fontSize: fontSizes.md, color: colors.textSecondary }}>{message}</div>
      {subtitle && (
        <div style={{ marginTop: spacing.sm, fontSize: fontSizes.base, color: colors.textMuted }}>{subtitle}</div>
      )}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────

interface EmptyBoxProps {
  title: string;
  subtitle?: string;
  /** Optional primary action button */
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyBox({ title, subtitle, actionLabel, onAction }: EmptyBoxProps) {
  return (
    <div
      style={{
        padding: '2.5rem 1.5rem',
        textAlign: 'center',
        color: colors.textSecondary,
        background: colors.bgWhite,
        borderRadius: radii.xl,
        border: `1px solid ${colors.borderLight}`,
        boxShadow: shadows.card,
      }}
    >
      <div style={{ fontSize: '2rem', marginBottom: spacing.lg, opacity: 0.4 }}>📋</div>
      <p style={{ margin: 0, fontSize: fontSizes.xl, fontWeight: 600, color: colors.text }}>
        {title}
      </p>
      {subtitle && (
        <p style={{ margin: `${spacing.md} 0 0`, fontSize: fontSizes.md, color: colors.textMuted, lineHeight: 1.5 }}>
          {subtitle}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{ ...primaryBtnStyle, marginTop: spacing.xl }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
