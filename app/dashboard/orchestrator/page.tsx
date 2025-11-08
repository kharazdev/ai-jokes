// app/dashboard/orchestrator/page.tsx
'use client';

import { JobRunnerCard } from '@/components/ui/JobRunnerCard';
import { useEffect, useState } from 'react';

// Define a type for our category data
interface Category {
  id: number;
  label_arabic: string;
  label: string;
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

  const secretKey = process.env.ORCHESTRATOR_SECRET_KEY || ".jbq>#RVi=L6BvG(JSKnc)b?#&*6e-@%;\$s[q#>gmp2I=C!0"

  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(10); // Default to 6
  const [categories, setCategories] = useState<Category[]>([]);



  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Orchestrator Control Panel</h1>
      <p className="text-gray-700 mb-8">
        Use this panel to manually trigger backend autonomous jobs. Please provide the secret key to authorize the requests.
      </p>

         {/* CATEGORY SELECTOR */}
          <div className="mb-4">
            <label htmlFor="category-select" className="block text-sm font-medium text-gray-700 mb-1">
              Select Category
            </label>
            <select
              id="category-select"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {/* The dropdown options are created from the fetched categories */}
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
          description="Runs the standard daily job. It uses pre-cached trends to select topics for all active characters and generates jokes in a batch process. Ideal for routine, daily content generation."
          apiPath="/api/orchestrator/run-daily-job"
          secretKey={secretKey}
        />
        <JobRunnerCard
          title="Smart Autonomous Job"
          description="Runs the advanced, context-aware job. It fetches characters from a specific category and uses a single, powerful AI call to dynamically research topics and generate persona-driven jokes. Best for high-quality, targeted content."
          apiPath="/api/orchestrator/run-smart-job"
          secretKey={secretKey}
          categoryId={6}
        />
      </div>
    </div>
  );
}