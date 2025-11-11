'use client';

import { useEffect, useState } from 'react';
import { JobRunnerCard } from '@/components/ui/JobRunnerCard';
import { Character } from '@/components/EditCharacterForm';

// --- UI Components for Different States ---

// Skeleton component to be shown during loading
export const JokeCardSkeleton = () => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="h-2 bg-gray-200 animate-pulse"></div>
      <div className="p-6 sm:p-8">
        <header className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
          <div className="w-full space-y-2">
            <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
          </div>
        </header>
        <div className="space-y-3 pl-4 border-l-4 border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-5/6 animate-pulse"></div>
        </div>
        <footer className="mt-6 flex justify-end">
          <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        </footer>
      </div>
    </div>
  );
};

// A component to display the current status (loading or error)
const StatusDisplay = ({ status, message }: { status: 'loading' | 'error'; message: string }) => {
  const isError = status === 'error';
  const bgColor = isError ? 'bg-red-100 border-red-500' : 'bg-blue-100 border-blue-500';
  const textColor = isError ? 'text-red-800' : 'text-blue-800';
  const icon = isError ? '❗️' : '⏳';

  return (
    <div className={`mt-12 p-6 border-l-4 rounded-r-lg ${bgColor} ${textColor}`}>
      <div className="flex items-center">
        <div className="text-3xl mr-4">{icon}</div>
        <div>
          <p className="font-bold text-lg">
            {isError ? 'An Error Occurred' : 'Generating Jokes...'}
          </p>
          <p>{message}</p>
        </div>
      </div>
    </div>
  );
};


// --- Main Page Component ---

// Define types for our data
interface Category {
  id: number;
  label_arabic: string;
  label: string;
}

interface Joke {
  characterId: number;
  jokeContent: string;
  selectedTopic: string;
}

// Define a unified state for WebSocket status
type WebSocketStatus = 'idle' | 'loading' | 'success' | 'error';
interface WebSocketState {
  status: WebSocketStatus;
  message: string;
}

export default function OrchestratorPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(10);
  const [newJokes, setNewJokes] = useState<Joke[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);

  // Use a single state object to manage the WebSocket connection status
  const [webSocketState, setWebSocketState] = useState<WebSocketState>({
    status: 'idle',
    message: '',
  });

  const secretKey = process.env.ORCHESTRATOR_SECRET_KEY
    || ".jbq>#RVi=L6BvG(JSKnc)b?#&*6e-@%;$s[q#>gmp2I=C!0"
  
  // Fetch initial data on component mount
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error("Failed to load categories:", err));

    fetch('/api/characters')
      .then((res) => res.json())
      .then((data) => setCharacters(data))
      .catch((err) => console.error("Failed to load characters:", err));
  }, []);

  const setupWebSocketListener = (jobId: string) => {
    // Reset state before starting a new job
    setNewJokes([]);
    setWebSocketState({ status: 'loading', message: 'Connecting to the joke generator...' });

    const wsProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    const ws = new WebSocket(`${wsProtocol}${window.location.host}/api/ws`);

    ws.onopen = () => {
      console.log(`WebSocket connected. Registering listener for Job ID: ${jobId}`);
      setWebSocketState({ status: 'loading', message: 'Job has started! Waiting for updates...' });
      ws.send(JSON.stringify({ type: 'REGISTER', jobId }));
    };

    ws.onmessage = (event) => {
      const response = JSON.parse(event.data);
      console.log('WebSocket message received:', { response });

      // Handle different message types from the server
      switch (response.type) {
        // CORRECTED: Listen for 'JOB_PROGRESS' and correctly access the payload message
        case 'JOB_PROGRESS':
          setWebSocketState({ status: 'loading', message: response.payload.message });
          break;

        // CORRECTED: Listen for 'JOB_COMPLETE'
        case 'JOB_COMPLETE':
          console.log('Job complete! Received jokes.');
          setNewJokes(response.payload);
          setWebSocketState({ status: 'success', message: 'Jokes received successfully!' });
          ws.close();
          break;

        // CORRECTED: Listen for 'JOB_ERROR'
        case 'JOB_ERROR':
          console.error('Job failed:', response.payload.message);
          setWebSocketState({ status: 'error', message: response.payload.message });
          ws.close();
          break;
        
        default:
          console.warn('Received unknown WebSocket message type:', response.type);
          break;
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWebSocketState({ status: 'error', message: 'Failed to connect to the results stream. Please check the console and try again.' });
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed.');
      // This logic prevents overwriting a final 'success' or 'error' state.
      // It uses a functional update to safely access the previous state.
      setWebSocketState((prevState) => {
        if (prevState.status === 'loading') {
          return { status: 'error', message: 'Connection was closed unexpectedly. The job may have failed.' };
        }
        return prevState;
      });
    };
  };

  // --- Render Logic ---

  // Helper function to render the results section based on the WebSocket state
  const renderResults = () => {
    switch (webSocketState.status) {
      case 'loading':
        return (
          <div className="mt-12">
            <StatusDisplay status="loading" message={webSocketState.message} />
            <div className="space-y-12 mt-8">
              <JokeCardSkeleton />
              <JokeCardSkeleton />
              <JokeCardSkeleton />
            </div>
          </div>
        );
      case 'error':
        return (
          <div className="mt-12">
            <StatusDisplay status="error" message={webSocketState.message} />
          </div>
        );
      case 'success':
        if (newJokes.length > 0) {
          return (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6 border-b pb-2">Newly Generated Jokes</h2>
              <div className="space-y-12">
                {newJokes.map((joke, i) => (
                  <article key={`${joke.characterId}-${i}`} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-blue-400">
                    <div className="p-6 sm:p-8">
                      <header className="mb-6">
                        <h2 className="text-xl font-bold text-gray-900">
                          Topic: {joke.selectedTopic}
                        </h2>
                      </header>
                      <blockquote className="border-l-4 border-gray-200 pl-4">
                        <p className="text-xl sm:text-2xl italic text-gray-800 leading-relaxed">
                          "{joke?.jokeContent}"
                        </p>
                      </blockquote>
                      <footer className="mt-6 flex justify-end items-center gap-2 text-sm text-gray-400">
                        <span>
                          Generated on: {new Date().toLocaleString("en-US", {
                            month: 'short', day: 'numeric', year: 'numeric'
                          })}
                        </span>
                      </footer>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          );
        }
        return null; // Don't render anything if success but no jokes
      case 'idle':
      default:
        return null; // Do not render anything in the initial state
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Orchestrator Control Panel</h1>
      <p className="text-gray-700 mb-8">
        Use this panel to manually trigger backend autonomous jobs. Please provide the secret key to authorize the requests.
      </p>

      {/* CATEGORY SELECTOR */}
      {categories.length > 0 &&
        <div className="mb-4">
          <label htmlFor="category-select" className="block text-sm font-medium text-gray-700 mb-1">
            Select Category for Smart Job
          </label>
          <select
            id="category-select"
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label_arabic}
              </option>
            ))}
          </select>
        </div>}

      {/* Job Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <JobRunnerCard
          title="Daily Autonomous Job"
          description="Runs the standard daily job for all active characters. Ideal for routine, daily content generation."
          apiPath="/api/orchestrator/run-daily-job"
          secretKey={secretKey}
          onTriggerJob={setupWebSocketListener}
        />
        <JobRunnerCard
          title="Daily Autonomous Job top characters"
          description="Runs the standard daily job for top characters. Ideal for routine, daily content generation."
          apiPath="/api/orchestrator/run-daily-job/top"
          secretKey={secretKey}
          onTriggerJob={setupWebSocketListener}
        />
        <JobRunnerCard
          title="Daily Autonomous simple Job"
          description="Runs the standard daily simple job for all active characters. Ideal for routine, daily content generation."
          apiPath="/api/orchestrator/run-daily-job/simple"
          secretKey={secretKey}
          onTriggerJob={setupWebSocketListener}
        />
        <JobRunnerCard
          title="Daily Autonomous simple Job top characters"
          description="Runs the standard daily simple job for top characters. Ideal for routine, daily content generation."
          apiPath="/api/orchestrator/run-daily-job/top/simple"
          secretKey={secretKey}
          onTriggerJob={setupWebSocketListener}
        />
        <JobRunnerCard
          title="Daily Autonomous simple Job top characters, 10 jokes each"
          description="Runs the standard daily simple job for top characters. Ideal for routine, daily content generation."
          apiPath="/api/orchestrator/run-daily-job/top/simple"
          secretKey={secretKey}
          onTriggerJob={setupWebSocketListener}
          tenEach={true}
        />
        <JobRunnerCard
          title="Smart Autonomous Job"
          description="Runs the advanced, context-aware job for a specific category. Best for high-quality, targeted content."
          apiPath="/api/orchestrator/run-smart-job"
          secretKey={secretKey}
          categoryId={selectedCategoryId}
          onTriggerJob={setupWebSocketListener}
        />
        <JobRunnerCard
          title="Smart Autonomous Job top characters"
          description="Runs the advanced, context-aware job for Job top characters. Best for high-quality, targeted content."
          apiPath="/api/orchestrator/run-smart-job/top"
          secretKey={secretKey}
          categoryId={selectedCategoryId}
          onTriggerJob={setupWebSocketListener}
        />
        <JobRunnerCard
          title="Smart Autonomous simple Job"
          description="Runs the simple, context-aware simple job."
          apiPath="/api/orchestrator/run-smart-job/simple"
          secretKey={secretKey}
          categoryId={selectedCategoryId}
          onTriggerJob={setupWebSocketListener}
        />
        <JobRunnerCard
          title="Smart Autonomous simple Job for top characters 10 jokes each"
          description="Runs the simple, context-aware job for Job top characters."
          apiPath="/api/orchestrator/run-smart-job/top/simple"
          secretKey={secretKey}
          categoryId={selectedCategoryId}
          onTriggerJob={setupWebSocketListener}
          tenEach={true}
        />
        <JobRunnerCard
          title="Smart Autonomous simple for 1 character, 100 jokes"
          description="Runs the simple, context-aware job for 1 character, 100 jokes."
          apiPath="/api/orchestrator/run-smart-job/high-volume-character"
          secretKey={secretKey}
          categoryId={selectedCategoryId}
          onTriggerJob={setupWebSocketListener}
          tenEach={true}
          requiresCharacterSelection={true}
        />
      </div>

      {/* Section to Display Job Results, Loading, or Errors */}
      {renderResults()}
    </div>
  );
}