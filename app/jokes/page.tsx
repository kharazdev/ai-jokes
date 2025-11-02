import { sql } from "@vercel/postgres";
import { characters, JokeCharacter } from "@/lib/characters";
import Link from "next/link";

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
  is_visible: boolean;
}

// A simple calendar icon component for our card footer
function CalendarIcon(props: React.ComponentProps<'svg'>) {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18" />
    </svg>
  );
}


export default async function JokesPage() {
  // This tells Next.js not to cache this page if you need fresh data on every visit.
  // export const dynamic = 'force-dynamic';

  let jokes: Joke[] = [];
  try {
    const { rows } = await sql<Joke>`
      SELECT id, content, character_name, created_at, is_visible 
      FROM jokes
      WHERE is_visible = TRUE
      ORDER BY created_at DESC;
    `;
    jokes = rows;
  } catch (error)
  {
    console.error("Database Error:", error);
    // You might want to render an error state on the page
  }

  return (
    <main className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
        <header className="text-center mb-16">
          <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            &larr; Back to Home
          </Link>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            The Joke Archive
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            A complete history of chuckles and groans from our resident comedians.
          </p>
        </header>

        <div className="space-y-12">
          {jokes.length > 0 ? (
            jokes.map((joke) => {
              const character = characterMap.get(joke.character_name);
              // We've moved the visibility check to the SQL query for efficiency,
              // but it's safe to keep here as a fallback.
              if (!joke.is_visible) return null; 

              return (
                <Link
                  key={joke.id}
                  href={`/jokes/${joke.id}`}
                  className="group block" // Add 'group' for advanced hover effects
                >
                  <article className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 group-hover:shadow-2xl group-hover:border-blue-400">
                    {/* The colored bar uses the character's theme color */}
                    <div className={`h-2 ${character?.color || 'bg-gray-400'}`}></div>

                    <div className="p-6 sm:p-8">
                      {/* Card Header: Character Info */}
                      <header className="flex items-center gap-4 mb-6">
                        <div className="text-4xl bg-gray-100 rounded-full p-2 flex-shrink-0">
                          {character?.avatar || "🎤"}
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">
                            {joke?.character_name || "A Comedian"}
                          </h2>
                          <p className="text-sm font-medium text-gray-500">
                            {character?.title || "Master of Mirth"}
                          </p>
                        </div>
                      </header>

                      {/* Card Body: The Joke */}
                      <blockquote className="border-l-4 border-gray-200 pl-4">
                        <p className="text-xl sm:text-2xl italic text-gray-800 leading-relaxed">
                          "{joke.content}"
                        </p>
                      </blockquote>

                      {/* Card Footer: Metadata */}
                      <footer className="mt-6 flex justify-end items-center gap-2 text-sm text-gray-400">
                        <CalendarIcon className="h-4 w-4" />
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
            })
          ) : (
            <div className="text-center py-12 px-6 bg-white rounded-xl shadow-lg border border-gray-200">
              <span className="text-5xl">🤫</span>
              <h2 className="mt-4 text-2xl font-bold">The archive is quiet!</h2>
              <p className="mt-2 text-gray-600">
                Looks like the comedians are just warming up. The first jokes should appear soon.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}