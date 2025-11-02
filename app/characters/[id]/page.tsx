// app/characters/[id]/page.tsx

import { sql } from "@vercel/postgres";
import { JokeCharacter } from "@/lib/characters";
import { notFound } from "next/navigation";
import Link from "next/link";
import GenerateJokeButton from "@/components/GenerateJokeButton"; // <-- added

// Define the structure of a Joke object from the database
interface Joke {
  id: number;
  content: string;
  character_name: string;
  created_at: Date;
}

// RENAMED for clarity: This page shows a single character, not a single joke.
export default async function SingleCharacterPage({
  params,
}: {
  params: { id: string };
}) {
  // RENAMED for clarity: This ID from the URL is for a character.
  const characterId = params.id;
  
  let character: JokeCharacter | undefined;
  let jokes: Joke[] = []; // <-- ADDED: Initialize an empty array for jokes

  try {
    // --- Step 1: Fetch the character's details (your existing code) ---
    const { rows: characterRows } = await sql<JokeCharacter>`
      SELECT * FROM characters WHERE id = ${characterId};
    `;
    character = characterRows[0];

    // If no character was found, we can stop here.
    if (!character) {
      notFound();
    }

    // --- Step 2: ADDED - Fetch all jokes by this character ---
    // We can now safely use character.name in our next query.
    const { rows: jokeRows } = await sql<Joke>`
      SELECT * FROM jokes
      WHERE character_name = ${character.name}
      ORDER BY created_at DESC;
    `;
    jokes = jokeRows;

  } catch (error) {
    console.error("Database Error:", error);
    // If anything fails, we'll fall through to the notFound() check.
    // This is a simple but effective way to handle DB errors.
    if (!character) notFound();
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8 sm:p-12 md:p-24 bg-gray-50">
      <div className="w-full max-w-3xl">
        {/* Character Bio Section */}
        <div className="relative bg-white p-8 rounded-xl shadow-lg text-center">
          <Link 
            href={`/characters/${character.id}/edit`}
            className="absolute top-4 right-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            title="Edit Character"
          >
            {/* <h1>Edut</h1> */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" role="img" aria-labelledby="editIconTitle" focusable="false">
              <title id="editIconTitle">Edit character</title>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
            </svg>
          </Link>

          <div className="text-8xl mb-4 mx-auto w-fit">{character.avatar}</div>
          <h1 className="text-4xl font-bold text-gray-900">{character.name}</h1>
          <p className="mt-2 text-lg text-gray-600">{character.bio}</p>
          <p className="mt-2 text-lg text-gray-600">{character.country}</p>
        </div>

        {/* Action row: Generate button + Back link */}
        <div className="mt-6 flex items-center justify-center gap-6">
          <GenerateJokeButton characterId={character.id} characterName={character.name} />
          <Link
            href="/characters"
            className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
          >
            &larr; Back to All Characters
          </Link>
        </div>

        {/* --- ADDED: Jokes List Section --- */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
            Jokes by {character.name}
          </h2>
          <div className="grid gap-6">
            {jokes.length > 0 ? (
              jokes.map((joke) => (
                <Link
                  key={joke.id}
                  href={`/jokes/${joke.id}`}
                  className="block bg-white p-5 rounded-lg shadow-md transition-shadow hover:shadow-lg"
                >
                  <p className="text-lg text-gray-700">"{joke.content}"</p>
                  <p className="mt-3 text-xs text-gray-400">
                    {new Date(joke.created_at).toLocaleDateString("en-GB", {
                      year: "numeric", month: "long", day: "numeric",
                    })}
                  </p>
                </Link>
              ))
            ) : (
              // This message is shown if the character has no jokes yet
              <div className="text-center p-6 bg-white rounded-xl shadow-md">
                <p className="text-gray-600">
                  {character.name} is a bit quiet right now. No jokes in the archive yet!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}