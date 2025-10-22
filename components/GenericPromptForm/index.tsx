'use client';

import React, { useEffect, useState } from 'react';

export function GenericPromptForm() {
  const [prompt, setPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch('/api/generic-prompt');
        const data = await res.json();
        if (!mounted) return;
        setPrompt(data?.prompt ?? '');
      } catch (err: any) {
        setError(String(err?.message ?? err));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  async function handleSave() {
    setError(null);
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch('/api/generic-prompt', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const text = await res.text();
      let parsed: any = null;
      try { parsed = text ? JSON.parse(text) : {}; } catch { parsed = { message: text }; }
      if (!res.ok) throw new Error(parsed?.message || 'Failed to save');
      setMessage('Saved successfully.');
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div>Loading generic prompt…</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Generic AI Prompt</h2>

      <label htmlFor="generic-prompt" className="block text-sm font-medium text-gray-700 mb-2">Prompt</label>
      <textarea
        id="generic-prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={8}
        className="w-full p-2 border rounded font-mono"
      />

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-green-600 px-4 py-2 text-white disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {message && <p className="mt-3 text-green-600">{message}</p>}
      {error && <p className="mt-3 text-red-600">{error}</p>}
    </div>
  );
}
