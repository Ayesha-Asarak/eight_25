'use client';

import { useAudit } from '@/hooks/use-audit';
import { AuditForm } from './AuditForm';
import { AuditResults } from './AuditResults';

export function AuditPage() {
  const { state, runAudit, reset } = useAudit();

  const isLoading = state.status === 'loading';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Website Audit Tool
              </h1>
              <p className="text-sm text-gray-500">
                Powered by EIGHT25MEDIA · AI insights grounded in real metrics
              </p>
            </div>
            {state.status !== 'idle' && (
              <button
                onClick={reset}
                className="shrink-0 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                New Audit
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* ── Form ───────────────────────────────────────────── */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="mb-4 text-sm font-medium text-gray-700">
            Enter a public URL to audit its SEO, content, and UX quality.
          </p>
          <AuditForm onSubmit={runAudit} isLoading={isLoading} />
        </div>

        {/* ── States ─────────────────────────────────────────── */}
        {state.status === 'loading' && <LoadingState />}

        {state.status === 'error' && (
          <ErrorState message={state.error} onDismiss={reset} />
        )}

        {state.status === 'success' && <AuditResults result={state.data} />}
      </main>
    </div>
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
        <p className="font-medium text-gray-800">Analyzing page…</p>
        <p className="mt-1 text-sm text-gray-500">
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
      className="rounded-lg border border-red-200 bg-red-50 p-5"
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
