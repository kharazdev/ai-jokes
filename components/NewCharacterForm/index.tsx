'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export function NewCharacterForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🧑');
  const [bio, setBio] = useState('');
  const [promptPersona, setPromptPersona] = useState('A witty comedian.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, text/plain, */*' },
        body: JSON.stringify({
          name,
          avatar,
          bio,
          prompt_persona: promptPersona,
        }),
      });

      const text = await res.text();
      let parsed: any = null;
      try { parsed = text ? JSON.parse(text) : {}; } catch { parsed = { message: text }; }

      if (!res.ok) {
        throw new Error(parsed?.message || `Request failed with status ${res.status}`);
      }

      // Expect created character in parsed.character
      const created = parsed?.character;
      if (created?.id) {
        router.push(`/characters/${created.id}`);
        router.refresh();
      } else {
        // fallback: go to characters list
        router.push('/characters');
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-4">
      <div>
        <label htmlFor="new-name" className="block text-sm font-medium text-gray-700">Name</label>
        <input id="new-name" value={name} onChange={(e) => setName(e.target.value)} required className="w-full p-2 border rounded" />
      </div>

      <div>
        <label htmlFor="new-avatar" className="block text-sm font-medium text-gray-700">Avatar (emoji or text)</label>
        <input id="new-avatar" value={avatar} onChange={(e) => setAvatar(e.target.value)} required className="w-full p-2 border rounded" />
      </div>

      <div>
        <label htmlFor="new-bio" className="block text-sm font-medium text-gray-700">Bio</label>
        <textarea id="new-bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} required className="w-full p-2 border rounded" />
      </div>

      <div>
        <label htmlFor="new-prompt" className="block text-sm font-medium text-gray-700">AI Prompt Persona</label>
        <textarea id="new-prompt" value={promptPersona} onChange={(e) => setPromptPersona(e.target.value)} rows={6} required className="w-full p-2 border rounded font-mono text-sm" />
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={isSubmitting} className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-60">
          {isSubmitting ? 'Creating…' : 'Create Character'}
        </button>
        <button type="button" onClick={() => router.push('/characters')} className="rounded-md bg-gray-200 px-4 py-2">
          Cancel
        </button>
      </div>

      {error && <p className="mt-2 text-red-600">{error}</p>}
    </form>
  );
}
