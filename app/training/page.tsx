// app/training/page.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Define types for our data for type safety
interface Joke {
    id: string;
    english_content: string;
    native_text: string;

    character_name: string;
    created_at: string;
}

interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    totalJokes: number;
}

export default function TrainingJokesPage() {
    const [jokes, setJokes] = useState<Joke[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchJokes() {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/training-jokes?page=${currentPage}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch data');
                }
                const data = await response.json();
                setJokes(data.jokes);
                setPagination(data.pagination);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setIsLoading(false);
            }
        }

        fetchJokes();
    }, [currentPage]); // Re-run this effect whenever currentPage changes

    const handlePrevPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        if (pagination) {
            setCurrentPage((prev) => Math.min(prev + 1, pagination.totalPages));
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 py-12">
            <div className="mx-auto w-full max-w-4xl px-6">
                <header className="mb-8">
                    <Link href="/" className="text-blue-600 hover:underline mb-4 block">
                        &larr; Back to Home
                    </Link>
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
                        Training Joke Archive
                    </h1>
                    <p className="mt-2 text-lg text-gray-600">
                        This page displays the foundational "seed jokes" used to train the AI characters.
                    </p>
                </header>

                {isLoading && <p className="text-center text-gray-500">Loading jokes...</p>}
                {error && <p className="text-center text-red-500">Error: {error}</p>}

                {!isLoading && !error && (
                    <>
                        <div className="space-y-4">
                            {jokes.map((joke) => (
                                <Link
                                    key={joke.id}
                                    href={`/training/${joke.id}`}
                                    className="block rounded-lg bg-white p-4 shadow-sm border border-gray-200 transition hover:shadow-md hover:border-blue-300"
                                >
                                    <p className="text-gray-800">{joke.english_content}</p>
                                    <br />
                                    <p className="text-gray-800">{joke.native_text}</p>

                                    <br />

                                    <div className="mt-3 flex justify-between items-center">
                                        <span className="text-sm font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded">
                                            {joke.character_name}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(joke.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Pagination Controls */}
                        {pagination && pagination.totalPages > 1 && (
                            <div className="mt-8 flex items-center justify-center gap-4">
                                <button
                                    onClick={handlePrevPage}
                                    disabled={currentPage === 1}
                                    className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-gray-600">
                                    Page {pagination.currentPage} of {pagination.totalPages}
                                </span>
                                <button
                                    onClick={handleNextPage}
                                    disabled={currentPage === pagination.totalPages}
                                    className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                        <p className="text-center text-sm text-gray-500 mt-4">
                            Total Foundational Jokes: {pagination?.totalJokes}
                        </p>
                    </>
                )}
            </div>
        </main>
    );
}