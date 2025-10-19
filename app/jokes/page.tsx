// app/jokes/page.tsx

import { sql } from "@vercel/postgres";
import { characters, JokeCharacter } from "@/lib/characters";
import Link from "next/link"; // <--- Import the Link component

// Create a map for easy character lookup. This is efficient.
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

// This is a Server Component, so we can make it async and fetch data directly.
export default async function JokesPage() {
  // This tells Next.js not to cache this page.
  // export const dynamic = 'force-dynamic'

  let jokes: Joke[] = [];
  try {
    const { rows } = await sql<Joke>`
      SELECT * FROM jokes
      ORDER BY created_at DESC;
    `;
    jokes = rows;
  } catch (error) {
    console.error("Database Error:", error);
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8 sm:p-12 md:p-24 bg-gray-50">
      <div className="z-10 w-full max-w-4xl text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-800">
          The Joke Archive
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          A complete history of chuckles and groans.
        </p>
      </div>

      <div className="mt-12 grid gap-8 w-full max-w-4xl">
        {jokes.length > 0 ? (
          jokes.map((joke) => {
            const character = characterMap.get(joke.character_name);
            return (
              // STEP 1: Wrap the entire card in a <Link> component
              // Use the joke's ID to create the unique URL.
              // Move the `key` prop to the <Link> component.
              <Link key={joke.id} href={`/jokes/${joke.id}`} className="block">
                {/* 
                  STEP 2: Add hover effects and cursor-pointer for better UX.
                  The `block` class on Link and `w-full h-full` on the div ensures
                  the link area covers the entire card.
                */}
                <div className="bg-white p-6 rounded-xl shadow-md flex items-start space-x-4 w-full h-full transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg cursor-pointer">
                  <div className="text-4xl flex-shrink-0">
                    {character?.avatar || "🎤"}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {character?.name || "A Comedian"}
                    </h2>
                    <p className="mt-2 text-lg text-gray-700">
                      "{joke.content}"
                    </p>
                    <p className="mt-3 text-sm text-gray-400">
                      Told at:{" "}
                      {new Date(joke.created_at).toLocaleString("en-GB", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="text-center p-6 bg-white rounded-xl shadow-md">
            <h2 className="text-xl font-semibold">The archive is empty!</h2>
            <p className="mt-2 text-gray-600">
              Looks like the comedians are just warming up. The first jokes
              should appear soon.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}