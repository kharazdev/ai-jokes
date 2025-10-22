import Link from "next/link";

export default function HomePage() {
  return (
    <main className="py-12">
      <div className="mx-auto max-w-6xl px-6">
        {/* Hero */}
        <section className="grid gap-8 lg:grid-cols-2 items-center rounded-2xl bg-white p-10 shadow-sm">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
              Welcome to Joke Factory
            </h1>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl">
              Create charming personas, generate AI-powered jokes, and curate a delightful archive.
              Use the quick actions below to get started — or explore characters and the joke archive.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/characters"
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Browse Characters
              </Link>

              <Link
                href="/jokes"
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:shadow-sm"
              >
                View Jokes
              </Link>

              <Link
                href="/characters/new"
                className="inline-flex items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-green-700"
              >
                Create Character
              </Link>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="text-sm text-gray-500">Quick actions:</div>
              <div className="flex gap-3">
                <Link
                  href="/characters/new"
                  className="rounded-md bg-white px-3 py-2 text-sm border border-gray-200 hover:shadow-sm"
                >
                  + New Character
                </Link>
                <Link
                  href="/api/generate-jokes?cron_secret=MySuperSecretStringForCronJobs1231244!235&force=true&v=1"
                  className="rounded-md bg-white px-3 py-2 text-sm border border-gray-200 hover:shadow-sm"
                >
                  🔁 Generate All (cron)
                </Link>
                <Link
                  href="/settings/generic-prompt"
                  className="rounded-md bg-white px-3 py-2 text-sm border border-gray-200 hover:shadow-sm"
                >
                  ⚙️ Prompt Settings
                </Link>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center justify-center">
            <div className="flex h-56 w-56 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 shadow-inner">
              <svg className="h-28 w-28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M3 12h18M12 3v18" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </section>

        {/* Feature cards */}
        <section className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/characters"
            className="group block transform rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <div className="flex flex-col items-start">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <span className="text-2xl" aria-hidden="true">👥</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600">Characters</h3>
              <p className="mt-2 text-sm text-gray-600">Create, edit and explore the comedians who tell the jokes.</p>
              <div className="mt-4 text-sm font-medium text-indigo-600">Open →</div>
            </div>
          </Link>

          <Link
            href="/jokes"
            className="group block transform rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
          >
            <div className="flex flex-col items-start">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <span className="text-2xl" aria-hidden="true">🤣</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600">Joke Archive</h3>
              <p className="mt-2 text-sm text-gray-600">Browse all stored jokes and view details for each one.</p>
              <div className="mt-4 text-sm font-medium text-green-600">Open →</div>
            </div>
          </Link>

          <Link
            href="/settings/generic-prompt"
            className="group block transform rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
          >
            <div className="flex flex-col items-start">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-50 text-yellow-600">
                <span className="text-2xl" aria-hidden="true">⚙️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-yellow-600">Prompt Settings</h3>
              <p className="mt-2 text-sm text-gray-600">Edit the global AI prompt that influences all generated jokes.</p>
              <div className="mt-4 text-sm font-medium text-yellow-600">Open →</div>
            </div>
          </Link>
        </section>

        {/* Small footer note */}
        <div className="mt-10 rounded-lg bg-white/80 p-4 text-sm text-gray-600 shadow-sm">
          Tip: Use the Settings page to tweak the global AI persona. Generated jokes are stored in the archive for later review.
        </div>
      </div>
    </main>
  );
}