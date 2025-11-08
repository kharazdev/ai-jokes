// components/ui/JobRunnerCard.tsx
'use client';

import { useState } from 'react';

interface JobRunnerCardProps {
  title: string;
  description: string;
  apiPath: string; // e.g., '/api/orchestrator/run-daily-job'
  secretKey: string;
  categoryId?: number
    onJokesGenerated: (jokes: any[]) => void; // Add this line

}

export function JobRunnerCard({ title, description, apiPath, secretKey, categoryId, onJokesGenerated }: JobRunnerCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const handleRunJob = async () => {
    if (!secretKey) {
      setStatusMessage('Error: Orchestrator Secret Key is missing.');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setStatusMessage('');
    setMessageType('');

    try {
      const body = categoryId !== undefined ? JSON.stringify({ categoryId }) : null;

      const response = await fetch(apiPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${secretKey}`,
        }, 
        body
      });

      const result = await response.json();
      console.log({result});

      if (result.jokes && Array.isArray(result.jokes)) {
              console.log('in', result.jokes.length);

        onJokesGenerated(result.jokes);
      } else {
                      console.log('not call', result);
                      console.log('not call', result?.jokes?.length);

      }
      
      if (response.ok) {
        setStatusMessage(result.message || 'Job started successfully!');
        setMessageType('success');
      } else {
        throw new Error(result.error || 'An unknown error occurred.');
      }
    } catch (error: any) {
      setStatusMessage(`Error: ${error.message}`);
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-6 bg-gray-50 shadow-sm">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 mb-4 h-24">{description}</p>

      <button
        type='button'
        onClick={handleRunJob}
        disabled={isLoading}
        className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Starting Job...' : 'Run Job'}
      </button>

      {statusMessage && (
        <div
          className={`mt-4 p-3 rounded-md text-sm ${messageType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
        >
          {statusMessage}
        </div>
      )}
    </div>
  );
}