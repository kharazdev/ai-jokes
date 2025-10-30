'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

// --- Helper: A simple spinner component ---
function Spinner() {
    return (
        <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
        </svg>
    );
}

// --- Type Definitions ---
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

interface FilterProgress {
    loaded: number;
    total: number;
}

interface CachedJokes {
    jokes: Joke[];
    timestamp: number;
    totalJokes: number; // For quick validation
    firstJokeId: string; // For quick validation
}

// --- Constants ---
const JOKES_PER_PAGE = 10;
const CACHE_KEY = 'allTrainingJokes';

export default function TrainingJokesPage() {
    // State for the complete dataset (filled from cache or background fetch)
    const [allJokes, setAllJokes] = useState<Joke[]>([]);
    // State for initially displayed jokes (used ONLY before allJokes is ready)
    const [pageJokes, setPageJokes] = useState<Joke[]>([]);
    const [apiPagination, setApiPagination] = useState<PaginationInfo | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedCharacter, setSelectedCharacter] = useState<string>('All');

    const [isPageLoading, setIsPageLoading] = useState(true);
    const [filterProgress, setFilterProgress] = useState<FilterProgress | null>(null);
    const [error, setError] = useState<string | null>(null);

    const isFilterReady = useMemo(() => allJokes.length > 0, [allJokes]);

    // This effect runs only once on component mount to orchestrate loading
    useEffect(() => {
        async function initialLoad() {
            // 1. Try to load from cache and validate it
            try {
                const cachedItem = localStorage.getItem(CACHE_KEY);
                if (cachedItem) {
                    const cachedData: CachedJokes = JSON.parse(cachedItem);
                    
                    // QUICK VALIDATION: Fetch page 1 and compare key metrics
                    const validationResponse = await fetch(`/api/training-jokes?page=1`);
                    const freshPage1 = await validationResponse.json();

                    if (
                        freshPage1.pagination.totalJokes === cachedData.totalJokes &&
                        freshPage1.jokes[0]?.id === cachedData.firstJokeId
                    ) {
                        console.log("Cache is valid. Loading all jokes from localStorage.");
                        setAllJokes(cachedData.jokes);
                        setIsPageLoading(false);
                        return; // Cache is good, we are done!
                    } else {
                        console.warn("Cache is stale. Clearing and re-fetching.");
                        localStorage.removeItem(CACHE_KEY);
                    }
                }
            } catch (e) {
                console.error("Failed to read or validate cache:", e);
                localStorage.removeItem(CACHE_KEY);
            }

            // 2. If no valid cache, fetch page 1 to show something immediately
            setIsPageLoading(true);
            try {
                const response = await fetch(`/api/training-jokes?page=1`);
                if (!response.ok) throw new Error('Failed to fetch data');
                
                const data = await response.json();
                setPageJokes(data.jokes);
                setApiPagination(data.pagination);
                
                // 3. Trigger the full background fetch to enable filtering
                fetchAllJokesForFilter(data.jokes, data.pagination);

            } catch (err) {
                setError((err as Error).message);
            } finally {
                setIsPageLoading(false);
            }
        }

        initialLoad();
    }, []); // Empty dependency array ensures this runs only once

    async function fetchAllJokesForFilter(firstPageJokes: Joke[], pagination: PaginationInfo) {
        const totalPages = pagination.totalPages;
        if (totalPages <= 1) {
            setAllJokes(firstPageJokes);
            return;
        }

        setFilterProgress({ loaded: 1, total: totalPages });
        let allFetchedJokes = [...firstPageJokes];
        
        const batchSize = 6; // To be kind to the browser's connection limit
        for (let i = 2; i <= totalPages; i += batchSize) {
            const batchPromises = [];
            for (let j = i; j < i + batchSize && j <= totalPages; j++) {
                batchPromises.push(
                    fetch(`/api/training-jokes?page=${j}`).then(res => res.json())
                );
            }
            const batchResults = await Promise.all(batchPromises);
            const batchJokes = batchResults.flatMap(data => data.jokes);
            allFetchedJokes.push(...batchJokes);
            
            setFilterProgress(prev => ({ ...prev!, loaded: Math.min(prev!.loaded + batchSize, totalPages) }));
        }
        
        setAllJokes(allFetchedJokes);

        // Save the complete data to cache with validation info
        try {
            const cachePayload: CachedJokes = {
                jokes: allFetchedJokes,
                timestamp: Date.now(),
                totalJokes: pagination.totalJokes,
                firstJokeId: firstPageJokes[0]?.id
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cachePayload));
            console.log("Saved all jokes to cache.");
        } catch (e) {
            console.error("Failed to save to cache", e);
        }
    }
    
    // Handles API-based pagination ONLY while filter is preparing
    useEffect(() => {
        if (isFilterReady || currentPage === 1) return;

        async function fetchPage() {
            setIsPageLoading(true);
            try {
                const res = await fetch(`/api/training-jokes?page=${currentPage}`);
                const data = await res.json();
                setPageJokes(data.jokes);
                setApiPagination(data.pagination);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setIsPageLoading(false);
            }
        }
        fetchPage();
    }, [currentPage, isFilterReady]);


    // Derived state for what to display. Switches seamlessly from API-based to client-based.
    const characterNames = useMemo(() => {
        const sourceJokes = isFilterReady ? allJokes : pageJokes;
        const names = new Set(sourceJokes.map(joke => joke.character_name));
        return ['All', ...Array.from(names).sort()];
    }, [allJokes, pageJokes, isFilterReady]);

    const { finalJokesToDisplay, finalPagination } = useMemo(() => {
        if (!isFilterReady) {
            return {
                finalJokesToDisplay: pageJokes,
                finalPagination: apiPagination,
            };
        }

        const filtered = selectedCharacter === 'All'
            ? allJokes
            : allJokes.filter(j => j.character_name === selectedCharacter);
        
        const totalPages = Math.ceil(filtered.length / JOKES_PER_PAGE);
        const validCurrentPage = Math.max(1, Math.min(currentPage, totalPages));

        const startIndex = (validCurrentPage - 1) * JOKES_PER_PAGE;
        const endIndex = startIndex + JOKES_PER_PAGE;

        return {
            finalJokesToDisplay: filtered.slice(startIndex, endIndex),
            finalPagination: {
                currentPage: validCurrentPage,
                totalPages: totalPages,
                totalJokes: filtered.length,
            },
        };
    }, [isFilterReady, allJokes, pageJokes, apiPagination, currentPage, selectedCharacter]);

    useEffect(() => {
        if (finalPagination && currentPage !== finalPagination.currentPage) {
            setCurrentPage(finalPagination.currentPage);
        }
    }, [finalPagination, currentPage]);

    const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedCharacter(event.target.value);
        setCurrentPage(1);
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

                <div className="my-6">
                    <div className="flex items-center gap-4">
                        <label htmlFor="character-filter" className="font-semibold text-gray-700">Filter by Character:</label>
                        <select
                            id="character-filter"
                            value={selectedCharacter}
                            onChange={handleFilterChange}
                            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            disabled={!isFilterReady}
                        >
                            {characterNames.map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>
                    {filterProgress && !isFilterReady && (
                         <div className="mt-2">
                             <p className="text-sm text-gray-500">
                                 Preparing filter: {filterProgress.loaded} of {filterProgress.total} pages loaded...
                             </p>
                             <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                <div 
                                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-500 ease-in-out" 
                                    style={{ width: `${(filterProgress.loaded / filterProgress.total) * 100}%` }}>
                                </div>
                             </div>
                         </div>
                    )}
                </div>

                {isPageLoading && !finalJokesToDisplay.length && <p className="text-center text-gray-500">Loading jokes...</p>}
                {error && <p className="text-center text-red-500">Error: {error}</p>}

                {!isPageLoading && !error && (
                    <>
                        <div className="space-y-4">
                            {finalJokesToDisplay.length > 0 ? (
                                finalJokesToDisplay.map((joke) => (
                                    <Link key={joke.id} href={`/training/${joke.id}`} className="block rounded-lg bg-white p-4 shadow-sm border border-gray-200 transition hover:shadow-md hover:border-blue-300">
                                        <p className="text-gray-800">{joke.english_content}</p>
                                        <br/>
                                        <p className="text-gray-800">{joke.native_text}</p>
                                        <br/>
                                        <div className="mt-3 flex justify-between items-center">
                                            <span className="text-sm font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded">
                                                {joke.character_name}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {new Date(joke.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 bg-white p-6 rounded-lg shadow-sm">
                                    No jokes found.
                                </p>
                            )}
                        </div>

                        {finalPagination && finalPagination.totalPages > 1 && (
                            <div className="mt-8 flex items-center justify-center gap-4">
                                <button onClick={() => setCurrentPage(p => p - 1)} disabled={finalPagination.currentPage === 1} className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
                                    Previous
                                </button>
                                <span className="text-sm text-gray-600">
                                    Page {finalPagination.currentPage} of {finalPagination.totalPages}
                                </span>
                                <button onClick={() => setCurrentPage(p => p + 1)} disabled={finalPagination.currentPage === finalPagination.totalPages} className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
                                    Next
                                </button>
                            </div>
                        )}
                        <p className="text-center text-sm text-gray-500 mt-4">
                            Total Jokes Found: {finalPagination?.totalJokes ?? 0}
                        </p>
                    </>
                )}
            </div>
        </main>
    );
}