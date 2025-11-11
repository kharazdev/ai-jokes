'use client';

import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { CharacterSelectionModal } from './CharacterSelectionModal';

// Define the Character type here as well for prop validation
interface Character {
  id: number;
  name: string;
}

interface JobRunnerCardProps {
  title: string;
  description: string;
  apiPath: string;
  secretKey: string;
  categoryId?: number;
  tenEach?: boolean;
  onTriggerJob: (jobId: string) => void;
  onSelectCharacterId?: (characterId: number) => void;
  // --- NEW PROPS ---
  /** If true, a modal will open to select a character before running the job. */
  requiresCharacterSelection?: boolean;
  /** An array of characters to be displayed in the modal. */
 }

export function JobRunnerCard({
  title,
  description,
  apiPath,
  secretKey,
  categoryId,
  tenEach,
  onTriggerJob,
  requiresCharacterSelection = false, // Default to false
 }: JobRunnerCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [isModalOpen, setIsModalOpen] = useState(false); // State for modal visibility

  const executeJob = async (characterId?: number) => {
    if (!secretKey) {
      setStatusMessage('Error: Orchestrator Secret Key is missing.');
      setMessageType('error');
      return;
    }

    const newJobId = uuid();
    onTriggerJob(newJobId); // Notify parent to start listening

    setIsLoading(true);
    setStatusMessage('');
    setMessageType('');

    // If a characterId is provided, append it to the API path
    // const finalApiPath = characterId ? `${apiPath}/${characterId}` : apiPath;

    try {
      const response = await fetch(apiPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${secretKey}`,
        },
        body: JSON.stringify({
          categoryId,
          jobId: newJobId,
          tenEach: tenEach,
          characterId
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setStatusMessage(result.message || 'Job acknowledged by server.');
        setMessageType('success');
      } else {
        throw new Error(result.error || 'An unknown error occurred.');
      }
    } catch (error: any) {
      console.error('Error in job runner:', error);
      setStatusMessage(`Error: ${error.message}`);
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  // This function decides whether to open the modal or run the job directly
  const handleButtonClick = () => {
    if (requiresCharacterSelection) {
      setIsModalOpen(true);
    } else {
      executeJob();
    }
  };

  // This function is called by the modal upon confirmation
  const handleCharacterSelectAndRun = (characterId: number) => {
    setIsModalOpen(false);
    executeJob(characterId);
  };


  return (
    <>
      <div className="border rounded-lg p-6 bg-gray-50 shadow-sm flex flex-col">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 mb-4 flex-grow">{description}</p>

        <button
          type="button"
          onClick={handleButtonClick}
          disabled={isLoading}
          className="w-full mt-auto px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Acknowledging...' : 'Run Job'}
        </button>

        {statusMessage && (
          <div
            className={`mt-4 p-3 rounded-md text-sm ${messageType === 'success'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
              }`}
          >
            {statusMessage}
          </div>
        )}
      </div>

      {/* Conditionally render the modal */}
      {requiresCharacterSelection && (
       <CharacterSelectionModal
          isOpen={isModalOpen}
           onClose={() => setIsModalOpen(false)}
          onConfirm={handleCharacterSelectAndRun}
        />
      )}
    </>
  );
}