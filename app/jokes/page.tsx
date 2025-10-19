import { sql } from "@vercel/postgres";
import { characters, JokeCharacter } from "@/lib/characters";

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
  // This tells Next.js not to cache this page. We always want the latest jokes.
  // Alternatively, you can use 'force-dynamic' for the same effect.
  // Or set a revalidate time e.g., export const revalidate = 60; (seconds)
  // For now, no-store is simplest to guarantee freshness.
  // export const dynamic = 'force-dynamic'

  let jokes: Joke[] = [];
  try {
    // Fetch all jokes from the database, ordering them by newest first
    const { rows } = await sql<Joke>`
      SELECT * FROM jokes
      ORDER BY created_at DESC;
    `;
    jokes = rows;
  } catch (error) {
    console.error("Database Error:", error);
    // If the database fails, we'll just show an empty list.
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
            // Find the character details using our efficient map
            const character = characterMap.get(joke.character_name);
            return (
              // This is our reusable "Joke Card" component
              <div
                key={joke.id}
                className="bg-white p-6 rounded-xl shadow-md flex items-start space-x-4"
              >
                <div className="text-4xl flex-shrink-0">
                  {character?.avatar || "🎤"}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {character?.name || "A Comedian"}
                  </h2>
                  <p className="mt-2 text-lg text-gray-700">"{joke.content}"</p>
                  <p className="mt-3 text-sm text-gray-400">
                    Told at:{" "}
                    {/* {joke.created_at.toString()} */}
                    {new Date(joke.created_at).toLocaleString("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}{" "}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          // This message is shown if the database is empty or fails to connect
          <div className="text-center p-6 bg-white rounded-xl shadow-md">
            <h2 className="text-xl font-semibold">The archive is empty!</h2>
            <p className="mt-2 text-gray-600">
              Looks like the comedians are just warming up. The first jokes
              should appear soon.
            </p>
          </div>
        )}
        ``
      </div>
    </main>
  );
}
