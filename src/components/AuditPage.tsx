'use client';

import { useAudit } from '@/hooks/use-audit';
import { AuditForm } from './AuditForm';
import { AuditResults } from './AuditResults';

const FEATURE_TAGS = [
  'SEO Analysis',
  'Content Audit',
  'CTA Review',
  'UX Assessment',
  'AI Insights',
];

export function AuditPage() {
  const { state, runAudit, reset } = useAudit();

  const isLoading = state.status === 'loading';
  const isIdle = state.status === 'idle';
  const isSuccess = state.status === 'success';

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E8EBF5' }}>
      {/* ── Header ─────────────────────────────────────────── */}
      <header style={{ backgroundColor: '#1B1F2E' }}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center rounded-lg w-8 h-8"
                style={{ backgroundColor: '#3B5BDB' }}
              >
                <AuditIcon />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-white font-semibold text-base">Website Audit Tool</span>
                <span className="text-xs" style={{ color: '#8B92A5' }}>by EIGHT25MEDIA</span>
              </div>
            </div>
            {!isIdle && (
              <button
                onClick={reset}
                className="text-sm px-3 py-1.5 rounded-md font-medium transition"
                style={{ color: '#A0A8BE', border: '1px solid #2D3347' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = '#A0A8BE')}
              >
                New Audit
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Idle / Hero layout ─────────────────────────────── */}
      {isIdle && (
        <main className="mx-auto max-w-2xl px-4 sm:px-6">
          <div className="flex flex-col items-center text-center pt-16 pb-8">
            <div
              className="flex items-center justify-center rounded-2xl w-16 h-16 mb-6"
              style={{ backgroundColor: '#DDE1EF' }}
            >
              <AuditIconLarge />
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-4" style={{ color: '#1B1F2E' }}>
              Website Audit Tool
            </h1>
            <p className="text-base leading-relaxed max-w-md" style={{ color: '#6B7280' }}>
              Enter any public URL to get AI-grounded insights on SEO structure, messaging clarity,
              CTA usage, content depth, and UX concerns.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 mb-5">
            <p className="text-sm mb-3" style={{ color: '#6B7280' }}>
              Enter a public URL to audit its SEO, content, and UX quality.
            </p>
            <AuditForm onSubmit={runAudit} isLoading={isLoading} />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pb-10">
            {FEATURE_TAGS.map((tag) => (
              <span
                key={tag}
                className="text-xs px-3 py-1 rounded-full font-medium"
                style={
                  tag === 'AI Insights'
                    ? { backgroundColor: '#3B5BDB', color: '#fff' }
                    : { backgroundColor: 'transparent', color: '#6B7280', border: '1px solid #D1D5DB' }
                }
              >
                {tag}
              </span>
            ))}
          </div>
        </main>
      )}

      {/* ── Active / Results layout ────────────────────────── */}
      {!isIdle && (
        <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          {/* Compact form */}
          <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
            <p className="text-sm mb-3" style={{ color: '#6B7280' }}>
              Enter a public URL to audit its SEO, content, and UX quality.
            </p>
            <AuditForm onSubmit={runAudit} isLoading={isLoading} />
          </div>

          {state.status === 'loading' && <LoadingState />}

          {state.status === 'error' && (
            <ErrorState message={state.error} onDismiss={reset} />
          )}

          {isSuccess && <AuditResults result={state.data} />}
        </main>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SVG icons
// ---------------------------------------------------------------------------

function AuditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="3" width="8" height="1.2" rx="0.6" fill="white" />
      <rect x="2" y="6" width="6" height="1.2" rx="0.6" fill="white" />
      <rect x="2" y="9" width="7" height="1.2" rx="0.6" fill="white" />
      <circle cx="12" cy="11" r="2.5" stroke="white" strokeWidth="1.2" />
      <line x1="13.8" y1="12.8" x2="15.2" y2="14.2" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function AuditIconLarge() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="4" y="6" width="16" height="2.4" rx="1.2" fill="#3B5BDB" />
      <rect x="4" y="12" width="12" height="2.4" rx="1.2" fill="#3B5BDB" />
      <rect x="4" y="18" width="14" height="2.4" rx="1.2" fill="#3B5BDB" />
      <circle cx="24" cy="22" r="5" stroke="#3B5BDB" strokeWidth="2.2" />
      <line x1="27.5" y1="25.5" x2="30.5" y2="28.5" stroke="#3B5BDB" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------

function LoadingState() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 py-16 text-center"
      role="status"
      aria-live="polite"
    >
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"
        aria-hidden="true"
      />
      <div>
        <p className="font-medium" style={{ color: '#1B1F2E' }}>Analyzing page…</p>
        <p className="mt-1 text-sm" style={{ color: '#6B7280' }}>
          Fetching metrics and generating AI insights. This may take 10–30 seconds.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

interface ErrorStateProps {
  message: string;
  onDismiss: () => void;
}

function ErrorState({ message, onDismiss }: ErrorStateProps) {
  return (
    <div
      className="rounded-lg border border-red-200 bg-red-50 p-5 mb-6"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-red-800">Audit failed</h2>
          <p className="mt-1 text-sm text-red-700">{message}</p>
        </div>
        <button
          onClick={onDismiss}
          className="shrink-0 rounded border border-red-200 bg-white px-3 py-1 text-sm text-red-600 hover:bg-red-50"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
