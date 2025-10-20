// app/jokes/[id]/edit/page.tsx

import { sql } from '@vercel/postgres';
import { notFound } from 'next/navigation';
import { EditJokeForm } from '../../../../components/EditCharacterForm'; // Adjust path if needed
import Link from 'next/link';

interface Joke {
  id: number;
  content: string;
}

// This is a Server Component that fetches the initial data
export default async function EditJokePage({ params }: { params: { id: string } }) {
  const { id } = params;
  let joke: Joke | undefined;

  try {
    const { rows } = await sql<Joke>`
      SELECT id, content FROM jokes WHERE id = ${id};
    `;
    joke = rows[0];
  } catch (error) {
    // Handle database error, maybe show a generic error page
  }
  
  // If no joke is found, show a 404 page
  if (!joke) {
    notFound();
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8 sm:p-12 md:p-24 bg-gray-50">
      <div className="w-full max-w-2xl">
        <h1 className="mb-6 text-center text-3xl font-bold text-gray-800">
          Edit Joke
        </h1>
        <div className="rounded-xl bg-white p-8 shadow-lg">
          {/* Pass the server-fetched joke data to the client form */}
          <EditJokeForm joke={joke} />
        </div>
        <div className="mt-8 text-center">
          <Link 
            href={`/jokes/${id}`}
            className="text-gray-600 hover:text-gray-800 hover:underline"
          >
            Cancel
          </Link>
        </div>
      </div>
    </main>
  );
}