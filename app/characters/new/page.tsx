import { NewCharacterForm } from '@/components/NewCharacterForm';

export default function NewCharacterPage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-8 sm:p-12 md:p-24 bg-gray-50">
      <div className="w-full max-w-2xl">
        <h1 className="mb-6 text-center text-3xl font-bold text-gray-800">Create New Character</h1>
        <div className="rounded-xl bg-white p-8 shadow-lg">
          {/* Client form */}
          <NewCharacterForm />
        </div>
      </div>
    </main>
  );
}
