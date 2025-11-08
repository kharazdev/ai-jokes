'use client';

import { JobRunnerCard } from '@/components/ui/JobRunnerCard';
import { useEffect, useState } from 'react';
import Link from 'next/link';
// import { CalendarIcon } from '@heroicons/react/24/outline'; // Make sure you have heroicons installed

// Define a type for our category data
interface Category {
  id: number;
  label_arabic: string;
  label: string;
}

// Define a type for a Joke object, matching your data structure
interface Joke {
  id: number;
  character_name: string;
  is_visible: boolean;
  content: string;
  created_at: string;
}

// A simplified Character type for the UI
interface Character {
  avatar: string;
  title: string;
  color: string;
}

export default function OrchestratorPage() {
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        setCategories(data);
      })
      .catch(err => console.error("Failed to load categories:", err));
  }, []);

  const secretKey = process.env.ORCHESTRATOR_SECRET_KEY
   || ".jbq>#RVi=L6BvG(JSKnc)b?#&*6e-@%;\$s[q#>gmp2I=C!0"
 
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(10);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newJokes, setNewJokes] = useState<Joke[]>([]); // State to hold newly generated jokes
  const [isLoading, setIsLoading] = useState<boolean>(false); // State to track loading


    // Handler to call when a job is initiated
  const handleJobStart = () => {
    setIsLoading(true);
    setNewJokes([]); // Clear old results
  };
  
  // This function will be called by JobRunnerCard on a successful API call
  const handleJokesGenerated = (jokes: Joke[]) => {
    setNewJokes(jokes);
 
  };
  
  // Dummy map to get character details for styling.
  // In a real app, this might come from a context or a data store.
  const characterMap = new Map<string, Character>();
  // Add some default styling for any character
  characterMap.set('Default', { avatar: '🎤', title: 'Master of Mirth', color: 'bg-gray-400' });


  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Orchestrator Control Panel</h1>
      <p className="text-gray-700 mb-8">
        Use this panel to manually trigger backend autonomous jobs. Please provide the secret key to authorize the requests.
      </p>

      {/* CATEGORY SELECTOR */}
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
      </div>


      {/* Job Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <JobRunnerCard
          title="Daily Autonomous Job"
          description="Runs the standard daily job for all active characters. Ideal for routine, daily content generation."
          apiPath="/api/orchestrator/run-daily-job"
          secretKey={secretKey}
          onJokesGenerated={handleJokesGenerated} // Pass the handler function
        />
        <JobRunnerCard
          title="Smart Autonomous Job"
          description="Runs the advanced, context-aware job for a specific category. Best for high-quality, targeted content."
          apiPath="/api/orchestrator/run-smart-job"
          secretKey={secretKey}
          categoryId={selectedCategoryId} // Use the selected category
          onJokesGenerated={handleJokesGenerated} // Pass the handler function
        />
      </div>

      {/* Section to Display Newly Generated Jokes */}
      {newJokes.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6 border-b pb-2">Newly Generated Jokes</h2>
          <div className="space-y-12">
            {newJokes.map((joke) => {
              // Use a default character if the specific one isn't in the map
              const character = characterMap.get(joke.character_name) || characterMap.get('Default');
              if (!joke.is_visible) return null;

              return (
                <Link
                  key={joke.id}
                  href={`/jokes/${joke.id}`}
                  className="group block"
                >
                  <article className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 group-hover:shadow-2xl group-hover:border-blue-400">
                    <div className={`h-2 ${character?.color}`}></div>
                    <div className="p-6 sm:p-8">
                      <header className="flex items-center gap-4 mb-6">
                        <div className="text-4xl bg-gray-100 rounded-full p-2 flex-shrink-0">
                          {character?.avatar}
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">
                            {joke.character_name}
                          </h2>
                          <p className="text-sm font-medium text-gray-500">
                            {character?.title}
                          </p>
                        </div>
                      </header>
                      <blockquote className="border-l-4 border-gray-200 pl-4">
                        <p className="text-xl sm:text-2xl italic text-gray-800 leading-relaxed">
                          "{joke.content}"
                        </p>
                      </blockquote>
                      <footer className="mt-6 flex justify-end items-center gap-2 text-sm text-gray-400">
                        {/* <CalendarIcon className="h-4 w-4" /> */}
                        <span>
                          {new Date(joke.created_at).toLocaleString("en-US", {
                            month: 'short', day: 'numeric', year: 'numeric'
                          })}
                        </span>
                      </footer>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}