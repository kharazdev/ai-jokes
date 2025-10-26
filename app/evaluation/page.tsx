// app/evaluation/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Types to match our new API response
interface JokeToEvaluate {
  id: number;
  content: string;
  character_name: string;
  created_at: string;
  is_visible: boolean;
  is_in_memory: boolean;
}
interface PaginationInfo {
  currentPage: number;
  totalPages: number;
}

export default function EvaluationPage() {
  const [jokes, setJokes] = useState<JokeToEvaluate[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Function to fetch jokes for the current page
  const fetchJokes = async () => {
    setIsLoading(true);
    const response = await fetch(`/api/evaluation?page=${currentPage}`);
    const data = await response.json();
    setJokes(data.jokes);
    setPagination(data.pagination);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchJokes();
  }, [currentPage]);

  // Handler functions to call our new PATCH API
  const handleToggleVisibility = async (jokeId: number) => {
    await fetch(`/api/evaluation/${jokeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle_visibility' }),
    });
    fetchJokes(); // Refresh the data
  };

  const handleAddToMemory = async (joke: JokeToEvaluate) => {
    await fetch(`/api/evaluation/${joke.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add_to_memory',
        jokeContent: joke.content,
        characterName: joke.character_name,
      }),
    });
    fetchJokes(); // Refresh the data
  };
  
  // Pagination handlers
  const handlePrevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNextPage = () => {
    if(pagination) setCurrentPage((p) => Math.min(p + 1, pagination.totalPages));
  };


  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto w-full max-w-4xl px-6">
        <header className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline mb-4 block">&larr; Home</Link>
          <h1 className="text-4xl font-extrabold text-gray-900">Joke Evaluation Queue</h1>
          <p className="mt-2 text-lg text-gray-600">Review AI-generated jokes. Approve good ones to add to memory and hide bad ones from public view.</p>
        </header>

        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <div className="space-y-4">
            {jokes.map((joke) => (
              <div key={joke.id} className="rounded-lg bg-white p-4 shadow-sm border">
                <p className="text-gray-800">{joke.content}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                  <span className="text-sm font-semibold text-indigo-700 bg-indigo-100 px-2 py-1 rounded">{joke.character_name}</span>
                  <div className="flex items-center gap-2">
                    {/* Status Tags */}
                    {joke.is_in_memory ? (
                      <span className="text-xs font-medium text-green-800 bg-green-100 px-2 py-1 rounded-full">In Memory</span>
                    ) : (
                      <span className="text-xs font-medium text-gray-800 bg-gray-100 px-2 py-1 rounded-full">Not In Memory</span>
                    )}
                     {joke.is_visible ? (
                      <span className="text-xs font-medium text-blue-800 bg-blue-100 px-2 py-1 rounded-full">Visible</span>
                    ) : (
                      <span className="text-xs font-medium text-red-800 bg-red-100 px-2 py-1 rounded-full">Hidden</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Action Buttons */}
                    <button
                      onClick={() => handleAddToMemory(joke)}
                      disabled={joke.is_in_memory}
                      className="text-xs bg-green-500 text-white font-semibold py-1 px-3 rounded-md hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      👍 Approve to Memory
                    </button>
                    <button
                      onClick={() => handleToggleVisibility(joke.id)}
                      className={`text-xs font-semibold py-1 px-3 rounded-md ${joke.is_visible ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                    >
                      {joke.is_visible ? '🙈 Hide' : '🙉 Show'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Pagination Controls */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <button onClick={handlePrevPage} disabled={currentPage === 1} className="...">Previous</button>
            <span>Page {pagination.currentPage} of {pagination.totalPages}</span>
            <button onClick={handleNextPage} disabled={currentPage === pagination.totalPages} className="...">Next</button>
          </div>
        )}

      </div>
    </main>
  );
}