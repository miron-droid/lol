/**
 * Shared style tokens and CSS constant objects for the LOL vNext web UI.
 * Every page should import from here instead of re-declaring local style objects.
 */

// ── Colour tokens ──────────────────────────────────────────────

export const colors = {
  primary: '#1976d2',
  primaryDark: '#0d47a1',
  primaryLight: '#e3f2fd',
  success: '#2e7d32',
  successBg: '#e8f5e9',
  successBorder: '#81c784',
  warning: '#f57f17',
  warningBg: '#fff8e1',
  warningBorder: '#fff176',
  danger: '#d32f2f',
  dangerBg: '#fff5f5',
  dangerBorder: '#ffcdd2',
  orange: '#e65100',
  orangeBg: '#fff3e0',
  orangeLight: '#ff9800',
  purple: '#7b1fa2',
  purpleBg: '#f3e5f5',
  teal: '#00897b',
  text: '#222',
  textMuted: '#888',
  textSecondary: '#666',
  border: '#ccc',
  borderLight: '#e0e0e0',
  borderSubtle: '#f0f0f0',
  rowBorder: '#e0e0e0',
  bgPage: '#f5f5f5',
  bgMuted: '#fafafa',
  bgWhite: '#fff',
  bgHover: '#f5f9ff',
} as const;

// ── Spacing ────────────────────────────────────────────────────

export const spacing = {
  pageX: '2rem',
  pageY: '1.5rem',
  xs: '0.25rem',
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  xxl: '1.5rem',
} as const;

// ── Typography ─────────────────────────────────────────────────

export const fontSizes = {
  xs: '0.6875rem',
  sm: '0.75rem',
  base: '0.8125rem',
  md: '0.875rem',
  lg: '1rem',
  xl: '1.125rem',
  xxl: '1.25rem',
  title: '1.5rem',
} as const;

// ── Radius ─────────────────────────────────────────────────────

export const radii = {
  sm: 3,
  md: 4,
  lg: 6,
  xl: 8,
  pill: 12,
} as const;

// ── Shadows ────────────────────────────────────────────────────

export const shadows = {
  card: '0 1px 3px rgba(0,0,0,0.08)',
  dropdown: '0 4px 12px rgba(0,0,0,0.12)',
  modal: '0 4px 24px rgba(0,0,0,0.15)',
  login: '0 2px 8px rgba(0,0,0,0.1)',
  stickyBar: '0 2px 8px rgba(0,0,0,0.06)',
} as const;

// ── Transition ─────────────────────────────────────────────────

export const transition = {
  fast: '0.15s ease',
  normal: '0.2s ease',
} as const;

// ══════════════════════════════════════════════════════════════
// BUTTONS
// ══════════════════════════════════════════════════════════════

const btnBase: React.CSSProperties = {
  borderRadius: radii.md,
  cursor: 'pointer',
  fontWeight: 500,
  lineHeight: 1.4,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing.xs,
  transition: `background ${transition.fast}, opacity ${transition.fast}`,
};

/** Standard navigation button (header) */
export const navBtnStyle: React.CSSProperties = {
  ...btnBase,
  padding: `${spacing.sm} ${spacing.lg}`,
  background: colors.bgWhite,
  border: `1px solid ${colors.border}`,
  fontSize: fontSizes.base,
  color: colors.text,
};

/** Primary action button */
export const primaryBtnStyle: React.CSSProperties = {
  ...btnBase,
  padding: `${spacing.md} ${spacing.xl}`,
  background: colors.primary,
  color: colors.bgWhite,
  border: 'none',
  fontSize: fontSizes.md,
  fontWeight: 600,
};

/** Secondary / cancel button */
export const secondaryBtnStyle: React.CSSProperties = {
  ...btnBase,
  padding: `${spacing.md} ${spacing.xl}`,
  background: colors.bgWhite,
  color: colors.text,
  border: `1px solid ${colors.border}`,
  fontSize: fontSizes.md,
};

/** Danger / destructive action button */
export const dangerBtnStyle: React.CSSProperties = {
  ...btnBase,
  padding: `${spacing.md} ${spacing.xl}`,
  background: colors.danger,
  color: colors.bgWhite,
  border: 'none',
  fontSize: fontSizes.md,
  fontWeight: 600,
};

/** Small inline action button (table row) */
export const smallBtnStyle: React.CSSProperties = {
  ...btnBase,
  padding: '0.25rem 0.5rem',
  background: colors.bgWhite,
  border: `1px solid ${colors.border}`,
  fontSize: fontSizes.sm,
  fontWeight: 500,
};

/** Icon-only remove/delete button */
export const iconBtnStyle: React.CSSProperties = {
  ...btnBase,
  padding: '0.125rem 0.5rem',
  background: colors.bgWhite,
  border: `1px solid ${colors.border}`,
  fontSize: fontSizes.lg,
  fontWeight: 600,
  color: colors.danger,
};

/** Toolbar action button (banner actions) */
export const actionBtnStyle: React.CSSProperties = {
  ...btnBase,
  padding: '0.3rem 0.625rem',
  fontSize: fontSizes.sm,
  fontWeight: 600,
};

/** Tab-style toggle button */
export function tabBtnStyle(active: boolean): React.CSSProperties {
  return {
    ...btnBase,
    padding: `${spacing.md} ${spacing.xl}`,
    fontSize: fontSizes.md,
    fontWeight: active ? 600 : 400,
    background: active ? colors.primary : colors.bgWhite,
    color: active ? colors.bgWhite : colors.text,
    border: active ? `1px solid ${colors.primary}` : `1px solid ${colors.border}`,
  };
}

// ══════════════════════════════════════════════════════════════
// TABLES
// ══════════════════════════════════════════════════════════════

/** Table wrapper — horizontal scroll, border, constrained height for sticky header */
export const tableWrapperStyle: React.CSSProperties = {
  overflowX: 'auto',
  overflowY: 'auto',
  border: `1px solid ${colors.borderLight}`,
  borderRadius: radii.lg,
  maxHeight: 'calc(100vh - 280px)',
};

/** Table element itself */
export const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'separate',
  borderSpacing: 0,
};

/** Table header cell — compact, uppercase, sticky */
export const thStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  textAlign: 'left',
  borderBottom: `2px solid ${colors.borderLight}`,
  fontSize: fontSizes.sm,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
  color: colors.textSecondary,
  whiteSpace: 'nowrap',
  position: 'sticky',
  top: 0,
  background: colors.bgWhite,
  zIndex: 2,
};

/** Table body cell */
export const tdStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  borderBottom: `1px solid ${colors.borderSubtle}`,
  fontSize: fontSizes.base,
  whiteSpace: 'nowrap',
};

/** Right-aligned numeric cell */
export const tdRight: React.CSSProperties = {
  ...tdStyle,
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
};

/** Fixed-width action column header */
export const thAction: React.CSSProperties = {
  ...thStyle,
  width: 120,
  textAlign: 'center',
};

/** Fixed-width action column cell */
export const tdAction: React.CSSProperties = {
  ...tdStyle,
  width: 120,
  textAlign: 'center',
};

/** Totals / summary row */
export const totalRowStyle: React.CSSProperties = {
  background: colors.bgMuted,
  fontWeight: 600,
  borderTop: `2px solid ${colors.borderLight}`,
};

/** Zebra-striped row handlers — returns style + hover handlers for a given row index */
export function zebraRowProps(index: number, hoverBg: string = colors.bgHover) {
  const baseBg = index % 2 === 1 ? colors.bgMuted : '';
  return {
    style: { background: baseBg } as React.CSSProperties,
    onMouseEnter: (e: React.MouseEvent<HTMLTableRowElement>) => {
      (e.currentTarget as HTMLTableRowElement).style.background = hoverBg;
    },
    onMouseLeave: (e: React.MouseEvent<HTMLTableRowElement>) => {
      (e.currentTarget as HTMLTableRowElement).style.background = baseBg;
    },
  };
}

// ══════════════════════════════════════════════════════════════
// FORMS
// ══════════════════════════════════════════════════════════════

/** Form label */
export const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 6,
  fontSize: fontSizes.sm,
  fontWeight: 600,
  color: colors.textSecondary,
  letterSpacing: '0.01em',
};

/** Form input / select base */
export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.625rem',
  border: `1px solid ${colors.borderLight}`,
  borderRadius: radii.lg,
  fontSize: fontSizes.md,
  boxSizing: 'border-box',
  background: colors.bgWhite,
  color: colors.text,
  transition: `border-color ${transition.fast}, box-shadow ${transition.fast}`,
  outline: 'none',
};

/** Checkbox label wrapper */
export const checkboxLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: fontSizes.md,
  cursor: 'pointer',
  color: colors.text,
};

/** Form section card — premium white card with subtle border */
export const sectionStyle: React.CSSProperties = {
  marginBottom: spacing.xxl,
  padding: spacing.xxl,
  background: colors.bgWhite,
  borderRadius: radii.xl,
  border: `1px solid ${colors.borderLight}`,
  boxShadow: shadows.card,
};

/** Form section heading */
export const sectionTitleStyle: React.CSSProperties = {
  margin: `0 0 ${spacing.xl}`,
  fontSize: fontSizes.lg,
  fontWeight: 600,
  color: colors.text,
  paddingBottom: spacing.md,
  borderBottom: `1px solid ${colors.borderSubtle}`,
};

/** Validation error container */
export const validationErrorStyle: React.CSSProperties = {
  padding: `${spacing.lg} ${spacing.xl}`,
  marginBottom: spacing.xl,
  background: colors.dangerBg,
  border: `1px solid ${colors.dangerBorder}`,
  borderRadius: radii.lg,
  fontSize: fontSizes.md,
  color: colors.danger,
  lineHeight: 1.6,
};

/** Disabled / read-only input override */
export const inputDisabledStyle: React.CSSProperties = {
  ...inputStyle,
  background: colors.bgPage,
  color: colors.textMuted,
  cursor: 'not-allowed',
};

/** Action bar at the bottom of a form — aligned right */
export const formActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: spacing.lg,
  justifyContent: 'flex-end',
  paddingTop: spacing.xxl,
  borderTop: `1px solid ${colors.borderSubtle}`,
  marginTop: spacing.xl,
};

/** Premium card container — for KPI, info panels, chart wrappers */
export const cardStyle: React.CSSProperties = {
  background: colors.bgWhite,
  borderRadius: radii.xl,
  border: `1px solid ${colors.borderLight}`,
  boxShadow: shadows.card,
  padding: '1rem 1.25rem',
};

// ── Grid helpers ───────────────────────────────────────────────

export const gridTwo: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: spacing.lg,
};

export const gridThree: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: spacing.lg,
};

// ══════════════════════════════════════════════════════════════
// MODALS & OVERLAYS
// ══════════════════════════════════════════════════════════════

/** Modal overlay background */
export const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

/** Modal card */
export const modalStyle: React.CSSProperties = {
  background: colors.bgWhite,
  borderRadius: radii.xl,
  padding: spacing.xxl,
  maxHeight: '80vh',
  overflowY: 'auto',
  boxShadow: shadows.modal,
};

// ══════════════════════════════════════════════════════════════
// BADGES
// ══════════════════════════════════════════════════════════════

interface BadgeTheme {
  bg: string;
  fg: string;
}

const BADGE_THEMES = {
  success: { bg: colors.successBg, fg: colors.success },
  warning: { bg: colors.warningBg, fg: colors.warning },
  danger: { bg: colors.dangerBg, fg: colors.danger },
  info: { bg: colors.primaryLight, fg: colors.primaryDark },
  muted: { bg: colors.bgPage, fg: colors.textMuted },
  purple: { bg: colors.purpleBg, fg: colors.purple },
  orange: { bg: colors.orangeBg, fg: colors.orange },
  teal: { bg: '#e0f2f1', fg: colors.teal },
  solidInfo: { bg: colors.primaryDark, fg: '#fff' },
  solidWarning: { bg: colors.orangeLight, fg: '#fff' },
  solidSuccess: { bg: colors.success, fg: '#fff' },
  solidDanger: { bg: colors.danger, fg: '#fff' },
} as const;

export type BadgeVariant = keyof typeof BADGE_THEMES;

/** Pill badge (status indicators) */
export function badgeStyle(variant: BadgeVariant): React.CSSProperties {
  const theme: BadgeTheme = BADGE_THEMES[variant];
  return {
    display: 'inline-block',
    padding: '0.175rem 0.625rem',
    borderRadius: radii.pill,
    fontSize: fontSizes.sm,
    fontWeight: 600,
    background: theme.bg,
    color: theme.fg,
    lineHeight: 1.4,
    whiteSpace: 'nowrap',
    letterSpacing: '0.01em',
  };
}

/**
 * Semantic status-to-badge-variant mapping.
 * Used across Loads, Salary, Statements to ensure consistent badge colours.
 */
export const STATUS_VARIANT: Record<string, BadgeVariant> = {
  // General
  pending: 'warning',
  generated: 'success',
  frozen: 'info',
  archived: 'muted',
  open: 'orange',
  // Payment
  paid: 'success',
  unpaid: 'danger',
  quick_pay: 'teal',
  direct: 'purple',
  // Load statuses
  not_picked_up: 'muted',
  in_transit: 'info',
  delivered: 'success',
  completed: 'success',
  cancelled: 'danger',
  // Rule status
  active: 'success',
  inactive: 'muted',
};

/** Small solid tag (ARCHIVED, READ ONLY, SNAPSHOT) */
export function tagStyle(variant: BadgeVariant): React.CSSProperties {
  const theme: BadgeTheme = BADGE_THEMES[variant];
  return {
    display: 'inline-block',
    padding: '1px 8px',
    borderRadius: radii.sm,
    fontSize: fontSizes.xs,
    fontWeight: 700,
    background: theme.bg,
    color: theme.fg,
    verticalAlign: 'middle',
    lineHeight: 1.5,
    whiteSpace: 'nowrap',
  };
}

// ══════════════════════════════════════════════════════════════
// BANNERS
// ══════════════════════════════════════════════════════════════

export function bannerStyle(variant: 'info' | 'warning' | 'success' | 'danger'): React.CSSProperties {
  const map = {
    info: { bg: colors.primaryLight, fg: colors.primaryDark, border: '#90caf9' },
    warning: { bg: colors.warningBg, fg: colors.warning, border: colors.warningBorder },
    success: { bg: colors.successBg, fg: colors.success, border: colors.successBorder },
    danger: { bg: colors.dangerBg, fg: colors.danger, border: colors.dangerBorder },
  };
  const t = map[variant];
  return {
    padding: `${spacing.md} ${spacing.lg}`,
    background: t.bg,
    border: `1px solid ${t.border}`,
    borderRadius: radii.md,
    fontSize: fontSizes.base,
    color: t.fg,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  };
}

// ══════════════════════════════════════════════════════════════
// ACCESS DENIED
// ══════════════════════════════════════════════════════════════

export const accessDeniedStyle: React.CSSProperties = {
  padding: '2rem',
  textAlign: 'center',
  color: colors.danger,
  background: colors.dangerBg,
  borderRadius: radii.lg,
  border: `1px solid ${colors.dangerBorder}`,
};

export const accessDeniedSubtextStyle: React.CSSProperties = {
  margin: '0.5rem 0 0',
  color: colors.textSecondary,
  fontSize: fontSizes.md,
};

// ══════════════════════════════════════════════════════════════
// TOOLBAR (STICKY ACTION BAR)
// ══════════════════════════════════════════════════════════════

/** Sticky toolbar — sticks below PageShell header on scroll */
export const stickyToolbarStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 10,
  background: colors.bgWhite,
  borderBottom: `1px solid ${colors.borderSubtle}`,
  boxShadow: shadows.stickyBar,
  padding: `${spacing.lg} 0`,
  marginBottom: spacing.xl,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: spacing.md,
};

/** Non-sticky toolbar (backwards-compatible alias) */
export const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: spacing.xl,
  flexWrap: 'wrap',
  gap: spacing.md,
};

export const toolbarGroupStyle: React.CSSProperties = {
  display: 'flex',
  gap: spacing.md,
  alignItems: 'center',
};

// ══════════════════════════════════════════════════════════════
// PAGE SECTION HIERARCHY
// ══════════════════════════════════════════════════════════════

/** Page title — large, bold heading */
export const pageTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: fontSizes.xxl,
  fontWeight: 700,
  color: colors.text,
  lineHeight: 1.3,
};

/** Page subtitle / breadcrumb line below the title */
export const pageSubtitleStyle: React.CSSProperties = {
  margin: `${spacing.xs} 0 0`,
  fontSize: fontSizes.md,
  color: colors.textMuted,
  fontWeight: 400,
};

/** Section heading (e.g. "Salary Rules", "Archive") within a page */
export const sectionHeadingStyle: React.CSSProperties = {
  margin: `0 0 ${spacing.lg}`,
  fontSize: fontSizes.xl,
  fontWeight: 600,
  color: colors.text,
};

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════

/** Disabled button override */
export function disabledBtnStyle(
  base: React.CSSProperties,
  isDisabled: boolean,
): React.CSSProperties {
  if (!isDisabled) return base;
  return {
    ...base,
    background: '#e0e0e0',
    color: '#999',
    cursor: 'not-allowed',
    opacity: 0.7,
  };
}

/** Loading state for primary button */
export function loadingBtnStyle(
  base: React.CSSProperties,
  isLoading: boolean,
): React.CSSProperties {
  if (!isLoading) return base;
  return {
    ...base,
    background: '#999',
    cursor: 'default',
  };
}

/** Currency formatter */
export function fmt(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Date-time formatter (short) */
export function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** Row hover handlers for tables */
export function rowHoverHandlers(hoverBg: string = colors.bgHover) {
  return {
    onMouseEnter: (e: React.MouseEvent<HTMLTableRowElement>) => {
      (e.currentTarget as HTMLTableRowElement).style.background = hoverBg;
    },
    onMouseLeave: (e: React.MouseEvent<HTMLTableRowElement>) => {
      (e.currentTarget as HTMLTableRowElement).style.background = '';
    },
  };
}
