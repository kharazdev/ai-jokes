import { sql } from "@vercel/postgres";
import { notFound } from "next/navigation";
import { EditCharacterForm } from "@/components/EditCharacterForm";
import Link from "next/link";

interface CharacterData {
  id: number;
  name: string;
  avatar: string;
  bio: string;
  prompt_persona: string;
}

export default async function EditCharacterPage({ params }: { params: { id: string } }) {
  const { id } = params;
  let character: CharacterData | undefined;

  try {
    const { rows } = await sql<CharacterData>`
      SELECT id, name, avatar, bio, prompt_persona
      FROM characters
      WHERE id = ${id};
    `;
    character = rows[0];
  } catch (error) {
    console.error("Database error fetching character for edit:", error);
  }

  if (!character) {
    notFound();
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8 sm:p-12 md:p-24 bg-gray-50">
      <div className="w-full max-w-2xl">
        <h1 className="mb-6 text-center text-3xl font-bold text-gray-800">Edit Character</h1>
        <div className="rounded-xl bg-white p-8 shadow-lg">
          <EditCharacterForm character={character} />
        </div>
        <div className="mt-8 text-center">
          <Link
            href={`/characters/${id}`}
            className="text-gray-600 hover:text-gray-800 hover:underline"
          >
            Cancel
          </Link>
        </div>
      </div>
    </main>
  );
}
