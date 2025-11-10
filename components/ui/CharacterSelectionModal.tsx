'use client';

import { useState, useEffect } from 'react';

// Define a type for the character data
interface Character {
  id: number;
  name: string;
}

// Define the shape of the API response
interface ApiResponse {
  characters: Character[];
}

interface CharacterSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (characterId: number) => void;
  title?: string;
}

export function CharacterSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Select a Character'
}: CharacterSelectionModalProps) {
  // State for the component's own data and loading status
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Effect to fetch characters when the modal is opened
  useEffect(() => {
    // Only fetch if the modal is open and we don't already have the data
    if (isOpen && characters.length === 0) {
      const fetchCharacters = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch('/api/characters');
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          // Destructure the `characters` array from the JSON response
          const data: ApiResponse = await response.json();
          setCharacters(data.characters);
          
          // Pre-select the first character by default
          if (data.characters.length > 0) {
            setSelectedCharacterId(data.characters[0].id);
          }

        } catch (err) {
          setError('Failed to load characters. Please try again.');
          console.error('Fetch error:', err);
        } finally {
          setIsLoading(false);
        }
      };

      fetchCharacters();
    }
  }, [isOpen, characters.length]); // Dependency array ensures this runs only when needed

  if (!isOpen) {
    return null;
  }

  const handleConfirm = () => {
    if (selectedCharacterId !== null) {
      onConfirm(selectedCharacterId);
    }
  };
  
  // Helper to render the content based on the current state
  const renderContent = () => {
    if (isLoading) {
      return <div className="text-center p-8">Loading characters...</div>;
    }

    if (error) {
      return <div className="text-center p-8 text-red-600 bg-red-50 rounded-lg">{error}</div>;
    }

    if (characters.length === 0) {
        return <div className="text-center p-8">No characters found.</div>;
    }

    return (
      <>
        <div className="mb-6">
          <label htmlFor="character-select" className="block text-sm font-medium text-gray-700 mb-2">
            Character
          </label>
          <select
            id="character-select"
            value={selectedCharacterId ?? ''}
            onChange={(e) => setSelectedCharacterId(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {characters.map((character) => (
              <option key={character.id} value={character.id}>
                {character.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={selectedCharacterId === null}
            className="px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Confirm & Run Job
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg p-8 bg-white rounded-xl shadow-2xl">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">{title}</h2>
        {renderContent()}
      </div>
    </div>
  );
}