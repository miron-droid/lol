'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { APP_NAME } from '@lol/shared';
import { useAuth } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';
import { colors, fontSizes, radii, shadows, spacing, inputStyle, labelStyle, primaryBtnStyle, loadingBtnStyle, validationErrorStyle } from '@/lib/styles';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/');
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${colors.bgPage} 0%, ${colors.primaryLight} 100%)`,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: colors.bgWhite,
          padding: '2.5rem 2rem',
          borderRadius: radii.xl,
          boxShadow: shadows.modal,
          width: 380,
          border: `1px solid ${colors.borderLight}`,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: spacing.xxl }}>
          <h1 style={{ margin: 0, fontSize: fontSizes.title, fontWeight: 700, color: colors.text }}>{APP_NAME}</h1>
          <p style={{ margin: `${spacing.sm} 0 0`, fontSize: fontSizes.md, color: colors.textMuted }}>
            Sign in to your account
          </p>
        </div>

        {error && (
          <div style={validationErrorStyle}>{error}</div>
        )}

        <div style={{ marginBottom: spacing.xl }}>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@company.com"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: spacing.xxl }}>
          <label style={labelStyle}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Enter your password"
            style={inputStyle}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ ...loadingBtnStyle(primaryBtnStyle, loading), width: '100%', padding: `${spacing.lg} ${spacing.xl}`, fontSize: fontSizes.md }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </main>
  );
}
