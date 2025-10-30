// app/evaluation/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Archive,
  Loader2,
} from 'lucide-react';

// --- TYPES (No Changes) ---
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

// --- REUSABLE COMPONENTS ---

const StatusPill = ({
  type,
}: {
  type: 'memory' | 'not-memory' | 'visible' | 'hidden';
}) => {
  const styles = {
    memory: 'bg-green-100 text-green-800',
    'not-memory': 'bg-gray-100 text-gray-700',
    visible: 'bg-blue-100 text-blue-800',
    hidden: 'bg-red-100 text-red-800',
  };
  const text = {
    memory: 'In Memory',
    'not-memory': 'Not In Memory',
    visible: 'Visible',
    hidden: 'Hidden',
  };
  return (
    <span
      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${styles[type]}`}
    >
      {text[type]}
    </span>
  );
};

// FINAL VERSION of JokeCard with precise loading state
const JokeCard = ({
  joke,
  onApprove,
  onDisapprove,
  onToggleVisibility,
  processingAction,
}: {
  joke: JokeToEvaluate;
  onApprove: () => void;
  onDisapprove: () => void;
  onToggleVisibility: () => void;
  processingAction: 'approve' | 'visibility' | null; // This prop tells us EXACTLY which button is loading
}) => {
  // A single boolean to disable all buttons while any action is in progress.
  const isAnyActionProcessing = processingAction !== null;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden transition-shadow hover:shadow-lg">
      <div className="p-5">
        <p className="text-gray-800 text-lg mb-4">{joke.content}</p>
      </div>
      <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-indigo-700">
            {joke.character_name}
          </span>
          <div className="flex items-center gap-2">
            <StatusPill type={joke.is_in_memory ? 'memory' : 'not-memory'} />
            <StatusPill type={joke.is_visible ? 'visible' : 'hidden'} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {joke.is_in_memory ? (
            <button
              onClick={onDisapprove}
              disabled={isAnyActionProcessing} // Disable if any action is running
              className="flex items-center gap-1.5 text-sm bg-red-600 text-white font-semibold py-1.5 px-3 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-wait transition-colors"
            >
              {/* Show spinner ONLY if this is the action being processed */}
              {processingAction === 'approve' ? <Loader2 className="animate-spin w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              Disapprove
            </button>
          ) : (
            <button
              onClick={onApprove}
              disabled={isAnyActionProcessing}
              className="flex items-center gap-1.5 text-sm bg-green-600 text-white font-semibold py-1.5 px-3 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-wait transition-colors"
            >
              {processingAction === 'approve' ? <Loader2 className="animate-spin w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
              Approve
            </button>
          )}
          <button
            onClick={onToggleVisibility}
            disabled={isAnyActionProcessing}
            className={`flex items-center gap-1.5 text-sm font-semibold py-1.5 px-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-wait ${
              joke.is_visible
                ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            {/* Show spinner ONLY if this is the action being processed */}
            {processingAction === 'visibility' ? <Loader2 className="animate-spin w-4 h-4" /> : joke.is_visible ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            {joke.is_visible ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>
    </div>
  );
};

const LoadingSkeleton = () => (
    <div className="space-y-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="bg-white rounded-lg shadow-md border border-gray-200 animate-pulse">
        <div className="p-5">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-between">
            <div className="flex items-center gap-3">
              <div className="h-6 w-24 bg-gray-200 rounded"></div>
              <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
            </div>
            <div className="h-8 w-48 bg-gray-200 rounded-md"></div>
        </div>
      </div>
    ))}
  </div>
);

// --- MAIN PAGE COMPONENT ---
export default function EvaluationPage() {
  const [jokes, setJokes] = useState<JokeToEvaluate[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  
  // NEW: State object to track both ID and action type
const [processingState, setProcessingState] = useState<{ id: number | null; type: 'approve' | 'visibility' | null }>({ id: null, type: null });
  useEffect(() => {
    const fetchJokes = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/evaluation?page=${currentPage}`);
        const data = await response.json();
        setJokes(data.jokes);
        setPagination(data.pagination);
      } catch (error) {
        console.error("Failed to fetch jokes:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchJokes();
  }, [currentPage]);

  // UPDATED: Generic handler now accepts a UI 'type'
  const handleApiCall = async (
    joke: JokeToEvaluate,
    action: 'add_to_memory' | 'remove_from_memory' | 'toggle_visibility',
    type: 'approve' | 'visibility'
  ) => {
    setProcessingState({ id: joke.id, type: type });
    try {
      await fetch(`/api/evaluation/${joke.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          jokeContent: joke.content,
          characterName: joke.character_name,
        }),
      });
      setJokes(prevJokes => prevJokes.map(j => {
          if (j.id === joke.id) {
            if (action === 'add_to_memory') return { ...j, is_in_memory: true, is_visible: true };
            if (action === 'remove_from_memory') return { ...j, is_in_memory: false };
            if (action === 'toggle_visibility') return { ...j, is_visible: !j.is_visible };
          }
          return j;
        })
      );
    } catch (error) {
      console.error(`Action ${action} failed for joke ${joke.id}:`, error);
    } finally {
      setProcessingState({ id: null, type: null });
    }
  };
  
  const handlePrevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNextPage = () => {
    if (pagination) setCurrentPage((p) => Math.min(p + 1, pagination.totalPages));
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
        <header className="mb-10">
          <Link href="/" className="text-indigo-600 hover:text-indigo-800 mb-4 block font-semibold">
            &larr; Back to Home
          </Link>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Evaluation Queue
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Review AI-generated jokes. Approve good ones to add to the character's memory and hide bad ones from public view.
          </p>
        </header>

        {isLoading ? (
          <LoadingSkeleton />
        ) : jokes.length > 0 ? (
          <div className="space-y-4">
            {jokes.map((joke) => (
              <JokeCard
                key={joke.id}
                joke={joke}
                processingAction={processingState.id === joke.id ? processingState.type : null}
                onApprove={() => handleApiCall(joke, 'add_to_memory', 'approve')}
                onDisapprove={() => handleApiCall(joke, 'remove_from_memory', 'approve')}
                onToggleVisibility={() => handleApiCall(joke, 'toggle_visibility', 'visibility')}
              />
            ))}
          </div>
        ) : (
          <div className="text-center bg-white border border-dashed border-gray-300 rounded-lg p-12">
            <Archive className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No jokes to evaluate</h3>
            <p className="mt-1 text-sm text-gray-500">The queue is empty. Great job!</p>
          </div>
        )}
        
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-10 flex items-center justify-between">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="flex items-center gap-2 rounded-md bg-white px-3.5 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-5 w-5" />
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === pagination.totalPages}
              className="flex items-center gap-2 rounded-md bg-white px-3.5 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </main>
  );
}