'use client';

import React, { useEffect, useState } from 'react';

/**
 * Simple Swagger-like interactive tester for this app's APIs.
 * - Adjust endpoints array below to add/remove endpoints shown in the UI.
 * - The tester uses window.location.origin as the base so it works both locally and in production.
 */

type Endpoint = {
  id: string;
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string; // use :id for path params
  description?: string;
  hasBody?: boolean;
  notes?: string;
};

const endpoints: Endpoint[] = [
  { id: 'get-jokes', method: 'GET', path: '/api/jokes', description: 'List all jokes' },
  { id: 'get-joke', method: 'GET', path: '/api/jokes/joke/:id', description: 'Get a single joke by id' },
  { id: 'patch-joke', method: 'PATCH', path: '/api/jokes/joke/:id', description: 'Update joke content', hasBody: true },
  { id: 'get-characters', method: 'GET', path: '/api/characters', description: 'List all characters' },
  { id: 'get-character', method: 'GET', path: '/api/characters/character/:id', description: 'Get a character by id' },
  { id: 'patch-character', method: 'PATCH', path: '/api/characters/:id', description: 'Update character (name/avatar/bio/prompt_persona)', hasBody: true },
  { id: 'generate-joke', method: 'GET', path: '/api/generate-joke/:id', description: 'Generate one joke for character id (rate-limited)' , notes: 'Provide id path param' },
  { id: 'generate-jokes', method: 'GET', path: '/api/generate-jokes', description: 'Generate jokes for all characters (cron endpoint, requires cron_secret)', notes: 'Set cron_secret query param when calling' },
  { id: 'comments-crud', method: 'GET', path: '/api/comments (via app)', description: 'Comments demo (use the page /comments to test forms)' },
];

export default function SwaggerPage() {
  const [selected, setSelected] = useState<string>(endpoints[0].id);
  const [pathParam, setPathParam] = useState<string>('1');
  const [cronSecret, setCronSecret] = useState<string>('');
  const [bodyText, setBodyText] = useState<string>('{}');
  const [response, setResponse] = useState<any>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // NEW: origin is only set on the client to avoid `window` access during SSR/prerender
  const [origin, setOrigin] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const endpoint = endpoints.find((e) => e.id === selected)!;

  // UPDATED: buildUrl no longer uses `window` directly so it is safe during prerender
  function buildUrl(): string {
    let path = endpoint.path;
    if (path.includes(':id')) {
      path = path.replace(':id', encodeURIComponent(pathParam || ''));
    }

    // handle cron_secret query param when needed
    if (endpoint.id === 'generate-jokes' && cronSecret) {
      const separator = path.includes('?') ? '&' : '?';
      path = `${path}${separator}cron_secret=${encodeURIComponent(cronSecret)}`;
    }

    // If origin is known (client), return absolute URL; otherwise return relative path (safe for SSR)
    return origin ? origin + path : path;
  }

  async function callEndpoint() {
    setErrorText(null);
    setResponse(null);
    setStatus(null);
    setLoading(true);
    try {
      const url = buildUrl();
      const opts: RequestInit = {
        method: endpoint.method,
        headers: {},
      };

      if (endpoint.hasBody) {
        try {
          const parsed = JSON.parse(bodyText);
          opts.headers = { 'Content-Type': 'application/json' };
          opts.body = JSON.stringify(parsed);
        } catch (err) {
          setErrorText('Invalid JSON body. Fix before sending.');
          setLoading(false);
          return;
        }
      }

      const res = await fetch(url, opts);
      setStatus(res.status);
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        setResponse(json);
      } else {
        const text = await res.text();
        setResponse({ text });
      }
    } catch (err: any) {
      setErrorText(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">API Tester (Swagger-like)</h1>
        <p className="mb-6 text-gray-600">
          Select an endpoint, fill path/query/body as needed, then click Test. Results are shown below.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            {/* Endpoint select */}
            <label htmlFor="endpoint-select" className="block text-sm font-medium text-gray-700 mb-2">Endpoint</label>
            <select
              id="endpoint-select"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full p-2 border rounded"
            >
              {endpoints.map((ep) => (
                <option key={ep.id} value={ep.id}>
                  [{ep.method}] {ep.path} {ep.description ? `— ${ep.description}` : ''}
                </option>
              ))}
            </select>

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="path-param" className="block text-sm font-medium text-gray-700">Path param (id)</label>
                <input
                  id="path-param"
                  value={pathParam}
                  onChange={(e) => setPathParam(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="1"
                />
              </div>

              {endpoint.id === 'generate-jokes' && (
                <div>
                  <label htmlFor="cron-secret" className="block text-sm font-medium text-gray-700">cron_secret (query)</label>
                  <input
                    id="cron-secret"
                    value={cronSecret}
                    onChange={(e) => setCronSecret(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Paste your cron_secret (for testing only)"
                  />
                </div>
              )}

              {endpoint.hasBody && (
                <div>
                  <label htmlFor="request-body" className="block text-sm font-medium text-gray-700">Request body (JSON)</label>
                  <textarea
                    id="request-body"
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    rows={8}
                    className="w-full p-2 border rounded font-mono text-sm"
                  />
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={callEndpoint}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
                >
                  {loading ? 'Calling…' : 'Test Endpoint'}
                </button>
                <a
                  href={origin ? buildUrl() : '#'}
                  target="_blank"
                  rel="noreferrer"
                  className={`text-sm text-gray-600 underline ${!origin ? 'pointer-events-none opacity-60' : ''}`}
                  aria-disabled={!origin}
                  title={!origin ? 'Open in new tab is available in the browser' : undefined}
                >
                  Open in new tab
                </a>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white rounded shadow">
            <h3 className="font-semibold mb-2">Metadata</h3>
            <p className="text-sm text-gray-700"><strong>Method:</strong> {endpoint.method}</p>
            <p className="text-sm text-gray-700"><strong>Path:</strong> {endpoint.path}</p>
            {endpoint.notes && <p className="text-sm text-gray-600 mt-2">{endpoint.notes}</p>}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-3">Response</h2>
          <div className="bg-white p-4 rounded shadow">
            <div className="mb-3">
              <span className="font-mono px-2 py-1 bg-gray-100 rounded">Status:</span>{' '}
              <span className="ml-2">{status ?? '-'}</span>
            </div>

            {errorText && (
              <div className="mb-3 text-red-600">
                Error: {errorText}
              </div>
            )}

            <pre className="overflow-auto max-h-[400px] bg-black text-white p-3 rounded text-sm">
              {response ? JSON.stringify(response, null, 2) : 'No response yet.'}
            </pre>
          </div>
        </div>

        <div className="mt-6 text-sm text-gray-500">
          Note: This tool performs real requests to your API. Be careful with secrets and destructive endpoints.
        </div>
      </div>
    </main>
  );
}
