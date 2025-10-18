// File: app/page.tsx
import { neon } from '@neondatabase/serverless';
import { revalidatePath } from 'next/cache';

// Define the shape of a comment object for TypeScript
type Comment = {
  id: number;
  comment: string;
};

// Main page component
export default async function Page() {
  // Establish database connection on the server
  const sql = neon(process.env.DATABASE_URL!);

  // --- READ ---
  // Fetch all comments from the database, ordering by the newest first.
  // The 'as Comment[]' part tells TypeScript to expect an array of our Comment type.
  const comments = await sql`SELECT id, comment FROM comments ORDER BY id DESC` as Comment[];

  // --- CREATE ---
  async function createComment(formData: FormData) {
    'use server';
    const comment = formData.get('comment') as string;
    const sql = neon(process.env.DATABASE_URL!);
    
    // Insert the new comment into the database
    if (comment) {
      await sql`INSERT INTO comments (comment) VALUES (${comment})`;
      revalidatePath('/'); // Refresh the page to show the new comment
    }
  }

  // --- DELETE ---
  async function deleteComment(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const sql = neon(process.env.DATABASE_URL!);

    // Delete the comment with the specified ID
    await sql`DELETE FROM comments WHERE id = ${id}`;
    revalidatePath('/'); // Refresh the page
  }

  // --- UPDATE ---
  async function updateComment(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const newComment = formData.get('newComment') as string;
    const sql = neon(process.env.DATABASE_URL!);

    // Update the comment text for the specified ID
    if (newComment) {
      await sql`UPDATE comments SET comment = ${newComment} WHERE id = ${id}`;
      revalidatePath('/'); // Refresh the page
    }
  }

  return (
    <main className="max-w-xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold mb-4">CRUD Comments Demo</h1>

      {/* --- CREATE FORM --- */}
      <form action={createComment} className="mb-8 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Add a New Comment</h2>
        <div className="flex gap-2">
          <input
            type="text"
            name="comment"
            placeholder="Write a comment..."
            className="flex-grow border rounded px-2 py-1 text-black"
            required
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded"
          >
            Submit
          </button>
        </div>
      </form>

      {/* --- READ (Display Comments) --- */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Comments List</h2>
        {comments.map((item) => (
          <div key={item.id} className="p-4 border rounded-lg bg-gray-50">
            <p className="mb-4">{item.comment}</p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {/* --- UPDATE FORM (one for each comment) --- */}
              <form action={updateComment} className="flex-grow flex gap-2">
                <input type="hidden" name="id" value={item.id} />
                <input
                  type="text"
                  name="newComment"
                  defaultValue={item.comment}
                  className="flex-grow border rounded px-2 py-1 text-black"
                  required
                />
                <button
                  type="submit"
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded"
                >
                  Update
                </button>
              </form>

              {/* --- DELETE FORM (one for each comment) --- */}
              <form action={deleteComment}>
                <input type="hidden" name="id" value={item.id} />
                <button
                  type="submit"
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded w-full sm:w-auto"
                >
                  Delete
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}