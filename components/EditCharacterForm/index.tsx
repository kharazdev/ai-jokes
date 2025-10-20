// components/EditJokeForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Define the shape of the joke prop we expect
interface Joke {
  id: number;
  content: string;
}

export function EditJokeForm({ joke }: { joke: Joke }) {
  const router = useRouter();
  // Initialize form state with the joke's current content
  const [content, setContent] = useState(joke.content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/jokes/${joke.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*'
        },
        body: JSON.stringify({ content }),
      });

      // Parse as text first to avoid JSON parse errors when server returns HTML.
      const raw = await res.text();
      let parsed: any = null;
      try {
        parsed = raw ? JSON.parse(raw) : null;
      } catch {
        parsed = { message: raw };
      }

      if (!res.ok) {
        throw new Error(parsed?.message || 'Failed to update the joke.');
      }

      // On success, navigate and refresh
      router.push(`/jokes/${joke.id}`);
      router.refresh();

    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={5}
        className="w-full rounded-md border-gray-300 p-3 text-lg text-gray-800 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        required
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-blue-600 px-4 py-3 text-lg font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {isSubmitting ? 'Saving...' : 'Save Changes'}
      </button>

      {error && <p className="mt-2 text-red-600">{error}</p>}
    </form>
  );
}

// NEW: EditCharacterForm
export interface Character {
  id: number;
  name: string;
  avatar: string;
  bio: string;
  prompt_persona: string;
}

export function EditCharacterForm({ character }: { character: Character }) {
  const router = useRouter();
  const [name, setName] = useState(character.name);
  const [avatar, setAvatar] = useState(character.avatar);
  const [bio, setBio] = useState(character.bio);
  const [promptPersona, setPromptPersona] = useState(character.prompt_persona);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/characters?id=${encodeURIComponent(character.id)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*'
        },
        body: JSON.stringify({
          id: character.id,
          name,
          avatar,
          bio,
          prompt_persona: promptPersona,
        }),
      });

      const raw = await res.text();
      let parsed: any = null;
      try {
        parsed = raw ? JSON.parse(raw) : null;
      } catch {
        parsed = { message: raw };
      }

      if (!res.ok) {
        throw new Error(parsed?.message || 'Failed to update the character.');
      }

      // On success, navigate back to the character page
      router.push(`/characters/${character.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <div>
        <label htmlFor="char-name" className="block text-sm font-medium text-gray-700">Name</label>
        <input
          id="char-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      <div>
        <label htmlFor="char-avatar" className="block text-sm font-medium text-gray-700">Avatar (emoji or text)</label>
        <input
          id="char-avatar"
          value={avatar}
          onChange={(e) => setAvatar(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      <div>
        <label htmlFor="char-bio" className="block text-sm font-medium text-gray-700">Bio</label>
        <textarea
          id="char-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      <div>
        <label htmlFor="char-prompt" className="block text-sm font-medium text-gray-700">AI Prompt Persona</label>
        <textarea
          id="char-prompt"
          value={promptPersona}
          onChange={(e) => setPromptPersona(e.target.value)}
          rows={6}
          className="w-full p-2 border rounded font-mono text-sm"
          required
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-green-600 px-4 py-2 text-white disabled:opacity-60"
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => { router.push(`/characters/${character.id}`); }}
          className="rounded-md bg-gray-200 px-4 py-2"
        >
          Cancel
        </button>
      </div>

      {error && <p className="mt-2 text-red-600">{error}</p>}
    </form>
  );
}