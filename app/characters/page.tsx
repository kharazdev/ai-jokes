// app/characters/page.tsx

// import { characters } from "@/lib/characters";
import { sql } from "@vercel/postgres";
import { JokeCharacter } from "@/lib/characters";
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
  return (
    <main className="flex min-h-screen flex-col items-center p-8 sm:p-12 md:p-24 bg-gray-50">
      <div className="z-10 w-full max-w-4xl text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-800">
          Meet the Comedians
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          The brilliant minds behind the jokes.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-5xl">
        {characters.map((character) => (
          // We use `encodeURIComponent` to make sure names with spaces (like "Cosmo Kramer")
          // are safe to use in a URL.
          <Link
            key={character.name}
            href={`/characters/${(character.id)}`}
            className="block"
          >
            <div className="bg-white p-6 rounded-xl shadow-md text-center w-full h-full transition-transform duration-200 hover:scale-105 hover:shadow-lg cursor-pointer flex flex-col items-center">
              <div className="text-7xl mb-4">{character.avatar}</div>
              <h2 className="text-2xl font-bold text-gray-900">
                {character.name}
              </h2>
              <p className="mt-2 text-gray-600">{character.bio}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}