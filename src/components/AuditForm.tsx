'use client';

import { useState, type FormEvent } from 'react';

interface AuditFormProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export function AuditForm({ onSubmit, isLoading }: AuditFormProps) {
  const [value, setValue] = useState('');
  const [validationError, setValidationError] = useState('');

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setValidationError('Please enter a URL.');
      return;
    }
    setValidationError('');
    onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label htmlFor="audit-url" className="sr-only">
            Website URL
          </label>
          <input
            id="audit-url"
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (validationError) setValidationError('');
            }}
            placeholder="https://example.com"
            disabled={isLoading}
            autoComplete="url"
            spellCheck={false}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          />
          {validationError && (
            <p className="mt-1.5 text-sm text-red-600" role="alert">
              {validationError}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="shrink-0 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? 'Analyzing…' : 'Run Audit'}
        </button>
      </div>
    </form>
  );
}
