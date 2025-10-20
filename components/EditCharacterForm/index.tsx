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
      const response = await fetch(`/api/jokes/${joke.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update the joke.');
      }

      // On success, redirect back to the joke's view page.
      // The router.refresh() is crucial! It tells Next.js to re-fetch
      // the data for the page, so the user sees the updated joke.
      router.push(`/jokes/${joke.id}`);
      router.refresh();

    } catch (err: any) {
      setError(err.message);
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