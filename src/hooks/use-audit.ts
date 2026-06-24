'use client';

import { useState, useCallback } from 'react';
import type { AuditResult } from '@/types/audit';
import type { AuditErrorResponse } from '@/types/api';

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

type IdleState = { status: 'idle' };
type LoadingState = { status: 'loading' };
type SuccessState = { status: 'success'; data: AuditResult };
type ErrorState = {
  status: 'error';
  error: string;
  code: AuditErrorResponse['code'];
};

export type AuditState = IdleState | LoadingState | SuccessState | ErrorState;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseAuditReturn {
  state: AuditState;
  runAudit: (url: string) => Promise<void>;
  reset: () => void;
}

const IDLE: IdleState = { status: 'idle' };

export function useAudit(): UseAuditReturn {
  const [state, setState] = useState<AuditState>(IDLE);

  const runAudit = useCallback(async (url: string) => {
    setState({ status: 'loading' });

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const json = await res.json();

      if (!res.ok) {
        // Typed error response from our API
        const errorBody = json as Partial<AuditErrorResponse>;
        setState({
          status: 'error',
          error: errorBody.error ?? 'An unexpected error occurred.',
          code: errorBody.code ?? 'UNKNOWN',
        });
        return;
      }

      setState({ status: 'success', data: json.data as AuditResult });
    } catch {
      // Network-level failure (offline, DNS error, etc.)
      setState({
        status: 'error',
        error: 'Could not connect to the server. Check your network and try again.',
        code: 'UNKNOWN',
      });
    }
  }, []);

  const reset = useCallback(() => setState(IDLE), []);

  return { state, runAudit, reset };
}
