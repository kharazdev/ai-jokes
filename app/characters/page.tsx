// app/characters/page.tsx

import { JokeCharacter } from "@/lib/characters";
import { sql } from "@vercel/postgres";
import Link from "next/link";

export default async function CharactersPage() {
  let characters: JokeCharacter[] = [];
  try {
    const { rows } = await sql<JokeCharacter>`
      SELECT * FROM characters
      ORDER BY created_at DESC;
    `;
    characters = rows;
  } catch (error) {
    console.error("Database Error:", error);
  }

  // NEW: safe date formatter that handles undefined values
  const formatDate = (d?: string | Date | undefined) => {
    if (!d) return "Unknown";
    try {
      return new Date(d as string | number | Date).toLocaleDateString();
    } catch {
      return "Unknown";
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 py-12">
      <div className="mx-auto w-full max-w-6xl px-6">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
              Meet the Comedians
            </h1>
            <p className="mt-2 text-lg text-gray-600 max-w-2xl">
              Browse the cast of distinct comedic personas — click a card to open
              the character page and see their jokes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/settings/generic-prompt"
              className="hidden rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm hover:shadow-md sm:inline-flex"
            >
              ⚙️ Prompt settings
            </Link>

            <Link
              href="/characters/new"
              className="inline-flex items-center gap-3 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-white">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
              New Character
            </Link>
          </div>
        </header>

        {/* Grid */}
        {characters.length > 0 ? (
          <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {characters.map((character) => (
              <Link
                key={character.id}
                href={`/characters/${character.id}`}
                className="group block transform rounded-2xl bg-white/80 p-6 shadow-sm transition will-change-transform hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-indigo-50 via-white to-indigo-100 text-6xl shadow-inner">
                    <span className="select-none text-5xl">
                      {character.avatar}
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 transition-colors group-hover:text-indigo-600">
                    {character.name}
                  </h3>

                  <p className="mt-3 text-sm text-gray-600 line-clamp-3">
                    {character.bio || "No bio provided."}
                  </p>

                  <div className="mt-4 flex items-center gap-3">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                      Profile
                    </span>
                    <span className="text-xs text-gray-400">
                      Joined{" "}
                      {formatDate(character.created_at ?? character.createdAt)}
                    </span>
                     {character.country && (
                      <span className="text-xs text-gray-400">
                     
                      {character.country}
                    </span>)}
                  </div>
                </div>
              </Link>
            ))}
          </section>
        ) : (
          <div className="rounded-2xl bg-white p-8 shadow-sm text-center">
            <h2 className="text-2xl font-semibold text-gray-900">
              No characters yet
            </h2>
            <p className="mt-2 text-gray-600">
              Create your first comedian and give them a personality.
            </p>
            <div className="mt-6 flex justify-center">
              <Link
                href="/characters/new"
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Create character
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}