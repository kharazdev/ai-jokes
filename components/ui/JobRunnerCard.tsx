// components/ui/JobRunnerCard.tsx
'use client';

import { useState } from 'react';
import { v4 as uuid } from 'uuid'; // Import uuid here

interface JobRunnerCardProps {
  title: string;
  description: string;
  apiPath: string;
  secretKey: string;
  categoryId?: number
  onTriggerJob: (jobId: string) => void;
}

export function JobRunnerCard({ title, description, apiPath, secretKey, categoryId, onTriggerJob }: JobRunnerCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  // --- REMOVE THESE LINES FROM THE RENDER BODY ---
  // const newJobId = uuid(); 
  // onTriggerJob(newJobId);

  const handleRunJob = async () => {
    if (!secretKey) {
      setStatusMessage('Error: Orchestrator Secret Key is missing.');
      setMessageType('error');
      return;
    }
    
    // --- MOVE THE LOGIC INSIDE THE CLICK HANDLER ---

    // 1. Generate a new, stable ID only when the user clicks the button.
    const newJobId = uuid();
    
    // 2. Immediately tell the parent to start listening on this new ID.
    //    This will set the loading state on the main page.
    onTriggerJob(newJobId);

    setIsLoading(true); // Set loading state for the card button itself
    setStatusMessage('');
    setMessageType('');

    try {
      const response = await fetch(apiPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${secretKey}`,
        },
        body: JSON.stringify({ categoryId, jobId: newJobId }), // Use the stable ID
      });

      const result = await response.json();

      if (response.ok) {
        setStatusMessage(result.message || 'Job acknowledged by server.');
        setMessageType('success');
      } else {
        throw new Error(result.error || 'An unknown error occurred.');
      }
    } catch (error: any) {
      console.error('Error job runner catch:', error);
      setStatusMessage(`Error: ${error.message}`);
      setMessageType('error');
    } finally {
      // The button can stop its "loading" state once the API call is acknowledged.
      // The parent page will continue to show its own loading message until the WebSocket receives data.
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
        {isLoading ? 'Acknowledging...' : 'Run Job'}
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