// app/training/[id]/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

// Define the type for a single, detailed joke object
interface JokeDetail {
    id: string;
    english_content: string;
    native_text: string;
    created_at: string;
    character_id: number;
    character_name: string;
    character_avatar: string;
}

export default function SingleTrainingJokePage() {
    const params = useParams();
    const id = params.id as string; // Get the ID from the URL

    const [joke, setJoke] = useState<JokeDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return; // Don't fetch if the ID isn't available yet

        async function fetchJoke() {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/training-jokes/${id}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch joke');
                }
                const data = await response.json();
                setJoke(data.joke);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setIsLoading(false);
            }
        }

        fetchJoke();
    }, [id]); // Re-run the effect if the ID changes

    return (
        <main className="min-h-screen bg-gray-50 py-12">
            <div className="mx-auto w-full max-w-2xl px-6">
                <header className="mb-8">
                    <Link href="/training" className="text-blue-600 hover:underline mb-4 block">
                        &larr; Back to Training Archive
                    </Link>
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
                        Training Joke Details
                    </h1>
                </header>

                {isLoading && <p className="text-center text-gray-500">Loading joke...</p>}
                {error && <p className="text-center text-red-500">Error: {error}</p>}

                {!isLoading && joke && (
                    <div className="rounded-xl bg-white p-6 shadow-lg border border-gray-200">
                        {/* Character Header */}
                        <div className="flex items-center gap-4 mb-4 border-b pb-4">
                            <div className="text-5xl">{joke.character_avatar}</div>
                            <div>
                                <p className="text-sm text-gray-500">Character</p>
                                <h2 className="text-2xl font-bold text-gray-800">{joke.character_name}</h2>
                            </div>
                        </div>

                        {/* Joke Content */}
                        <div className="prose prose-lg max-w-none">
                            <p className="text-gray-800">{joke.english_content}</p>
                        </div>
                        <br />
                        <div className="prose prose-lg max-w-none">
                            <p className="text-gray-800">{joke.native_text}</p>
                        </div>

                        {/* Metadata Footer */}
                        <div className="mt-6 border-t pt-4 text-xs text-gray-400">
                            <p>Joke ID: {joke.id}</p>
                            <p>Created: {new Date(joke.created_at).toLocaleString()}</p>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}