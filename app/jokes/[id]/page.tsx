// app/jokes/[id]/page.tsx

import { sql } from "@vercel/postgres";
import { characters, JokeCharacter } from "@/lib/characters";
import { notFound } from "next/navigation";
import Link from "next/link";

// Create the same character map for efficient lookup
const characterMap = new Map<string, JokeCharacter>(
  characters.map((char) => [char.name, char]),
);

// Define the structure of the data we expect from our database query
interface Joke {
  id: number;
  content: string;
  character_name: string;
  created_at: Date;
}

// This page component receives `params` which contains the dynamic route segments.
// In our case, it will be { id: '...' } from the URL /jokes/...
export default async function SingleJokePage({
  params,
}: {
  params: { id: string };
}) {
  const jokeId = params?.id;
  let joke: Joke | undefined;

  try {
    // Fetch only the specific joke from the database using its ID
    const { rows } = await sql<Joke>`
      SELECT * FROM jokes WHERE id = ${jokeId};
    `;
    joke = rows[0]; // Get the first (and only) result
  } catch (error) {
    console.error("Database Error:", error);
    // In case of a database error, we can treat it as not found.
    // Or you could render a specific error message.
  }

  // If no joke was found for the given ID, show a 404 page.
  if (!joke) {
    notFound();
  }

  // Find the character details using our efficient map
  const character = characterMap.get(joke.character_name);

  return (
    <main className="flex min-h-screen flex-col items-center p-8 sm:p-12 md:p-24 bg-gray-50">
      <div className="w-full max-w-2xl">
        {/* The Joke Card - we can reuse the same styling */}
        <div className="bg-white p-6 rounded-xl shadow-lg flex items-start space-x-4">
          <div className="text-5xl flex-shrink-0">{character?.avatar || "🎤"}</div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {character?.name || "A Comedian"}
            </h1>
            <p className="mt-4 text-xl text-gray-700">"{joke.content}"</p>
            <p className="mt-4 text-sm text-gray-500">
              Told at:{" "}
              {new Date(joke.created_at).toLocaleString("en-GB", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>
        </div>

        {/* Add a link to go back to the main list */}
        <div className="mt-8 text-center">
          <Link
            href="/jokes"
            className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
          >
            &larr; Back to All Jokes
          </Link>
        </div>
      </div>
    </main>
  );
}