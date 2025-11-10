// app/jokes/page.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { characters, JokeCharacter } from '@/lib/characters';
import StarRating from '@/components/StarRating';
import Pagination from '@/components/Pagination'; // 1. Import the new component

// --- TYPES (No Changes) ---
interface Joke {
  id: number;
  content: string;
  character_name: string;
  created_at: Date;
  is_visible: boolean;
  rate: number;
}
interface PaginationInfo {
  currentPage: number;
  totalPages: number;
}

// --- STATIC DATA (No Changes) ---
const characterMap = new Map<string, JokeCharacter>(
  characters.map((char) => [char.name, char]),
);

// --- REUSABLE COMPONENTS (No Changes) ---
function CalendarIcon(props: React.ComponentProps<'svg'>) {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18" />
    </svg>
  );
}
const LoadingSkeleton = () => (
  <div className="space-y-12">
    {[...Array(5)].map((_, i) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
<div key={i} className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 animate-pulse">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
        <div className="h-5 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-5 bg-gray-200 rounded w-3/4"></div>
        <div className="mt-6 flex justify-between items-center">
          <div className="h-6 w-32 bg-gray-200 rounded"></div>
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    ))}
  </div>
);


// --- MAIN PAGE COMPONENT ---
export default function JokesPage() {
  const [jokes, setJokes] = useState<Joke[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchJokesForPage = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/jokes?page=${currentPage}`);
        const data = await response.json();
        if (data.success) {
          setJokes(data.jokes);
          setPagination(data.pagination);
        }
      } catch (error) {
        console.error("Failed to fetch jokes:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchJokesForPage();
  }, [currentPage]);

  // 2. We can remove the old handlers and just use setCurrentPage directly

  return (
    <main className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
        {/* Header (No Changes) */}
        <header className="text-center mb-16">
          <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            &larr; Back to Home
          </Link>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            The Joke Archive
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            A complete history of chuckles and groans from our resident comedians.
          </p>
        </header>

        {/* Conditional rendering of jokes (No Changes) */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <div className="space-y-12">
            {jokes.length > 0 ? (
              jokes.map((joke) => {
                const character = characterMap.get(joke.character_name);
                return (
                  <article key={joke.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className={`h-2 ${character?.color || 'bg-gray-400'}`}></div>
                    <div className="p-6 sm:p-8">
                      <header className="flex items-center gap-4 mb-6">
                        <div className="text-4xl bg-gray-100 rounded-full p-2 flex-shrink-0">{character?.avatar || "🎤"}</div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">{joke?.character_name || "A Comedian"}</h2>
                          <p className="text-sm font-medium text-gray-500">{character?.title || "Master of Mirth"}</p>
                        </div>
                      </header>
                      <blockquote className="border-l-4 border-gray-200 pl-4 py-4">
                        <p className="text-2xl italic text-gray-800 leading-relaxed">"{joke.content}"</p>
                      </blockquote>
                      <footer className="mt-6 flex justify-between items-center text-sm text-gray-400">
                        <StarRating jokeId={joke.id} initialRate={joke.rate} />
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4" />
                          <span>
                            {new Date(joke.created_at).toLocaleString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </footer>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="text-center py-12 px-6 bg-white rounded-xl">
                <span className="text-5xl">🤫</span>
                <h2 className="mt-4 text-2xl font-bold">The archive is quiet!</h2>
              </div>
            )}
          </div>
        )}

        {/* 3. Replace the old pagination with our new component */}
        <div className="mt-16">
          {pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              onPageChange={(page) => setCurrentPage(page)}
              isLoading={isLoading}
            />
          )}
        </div>

      </div>
    </main>
  );
}