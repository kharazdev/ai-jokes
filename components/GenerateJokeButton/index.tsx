'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GenerateJokeButton({ characterId, characterName }: { characterId: number; characterName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmGenerate() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/generate-joke/no-limit/${characterId}`, {
        method: 'POST',
        headers: { 'Accept': 'application/json, text/plain, */*' }
      });

      const raw = await res.text();
      let parsed: any = {};
      try { parsed = raw ? JSON.parse(raw) : {}; } catch { parsed = { message: raw }; }

      if (!res.ok) throw new Error(parsed?.message || `Request failed: ${res.status}`);

      // Expect returned joke object in parsed.joke with id
      const created = parsed?.joke;
      setOpen(false);

      if (created?.id) {
        // Navigate to the newly created joke
        router.push(`/jokes/${created.id}`);
      } else {
        // fallback: refresh page to show new data
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        aria-haspopup="dialog"
        aria-label={`Generate a new joke for ${characterName}`}
      >
        {/* Decorative icon: aria-hidden, rely on button aria-label for assistive tech */}
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        Generate Joke
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* make backdrop keyboard-accessible by using a native button element (semantic interactive) */}
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close dialog"
            disabled={loading}
            onClick={() => !loading && setOpen(false)}
            onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => {
              if (loading) return;
              if (e.key === 'Escape') {
                e.preventDefault();
                setOpen(false);
              }
            }}
          />

          <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900">Generate a new joke</h3>
            <p className="mt-2 text-sm text-gray-600">
              Generate a brand new joke for <strong>{characterName}</strong>. This will call the API and create a new entry.
            </p>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmGenerate}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                aria-label={`Confirm generate joke for ${characterName}`}
                aria-live="polite"
              >
                {loading ? (
                  <>
                    {/* Spinner decorative */}
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Generating…
                  </>
                ) : (
                  <>
                    {/* Decorative confirm icon */}
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Yes, generate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
