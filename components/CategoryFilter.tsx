// components/CategoryFilter.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';

// Define the shape of a Category object
interface Category {
  id: number;
  label: string;
  label_arabic?: string;
}

interface CategoryFilterProps {
  categories: Category[];
}

export function CategoryFilter({ categories }: CategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get the current category from the URL, or default to 'all'
  const currentCategory = searchParams.get('category') || 'all';

  const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = event.target.value;
    
    // Create a new URLSearchParams object to preserve other potential filters
    const params = new URLSearchParams(searchParams.toString());

    if (newCategory === 'all') {
      // If 'All' is selected, remove the category parameter from the URL
      params.delete('category');
    } else {
      // Otherwise, set the category parameter to the selected ID
      params.set('category', newCategory);
    }
    
    // Push the new URL to the router to trigger a re-render of the page
    router.push(`/characters?${params.toString()}`);
  };

  return (
    <div className="max-w-xs w-full">
      <label htmlFor="category-select" className="block text-sm font-medium text-gray-700">
        Filter by Category
      </label>
      <select
        id="category-select"
        value={currentCategory}
        onChange={handleFilterChange}
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
      >
        <option value="all">All Categories</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.label_arabic || category.label}
          </option>
        ))}
      </select>
    </div>
  );
}