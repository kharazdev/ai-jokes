import Link from 'next/link';

// This is your main homepage component.
// It's a Server Component by default in the App Router.
export default async function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-8 sm:p-12 md:p-24 bg-gray-50">
      {/* Hero Section: Title and Subtitle */}
      <div className="z-10 w-full max-w-4xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Welcome to the Joke Factory!
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          Explore our cast of quirky comedians or dive straight into the archive of jokes.
          Your daily dose of humor awaits.
        </p>
      </div>

      {/* Navigation Cards Section */}
      <div className="mt-16 grid w-full max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
        
        {/* Card 1: Link to Characters Page */}
        <Link 
          href="/characters" 
          className="group block"
        >
          <div className="h-full rounded-xl bg-white p-8 shadow-lg transition-transform duration-300 ease-in-out group-hover:-translate-y-2 group-hover:shadow-2xl">
            <div className="text-5xl">👥</div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              Meet the Comedians
            </h2>
            <p className="mt-2 text-gray-600">
              Browse the profiles of our unique performers and see all the jokes they've told.
            </p>
            {/* This "button" is just for visual style; the whole card is clickable */}
            <div className="mt-6 inline-block rounded-full bg-blue-500 px-5 py-2 text-sm font-semibold text-white transition-colors group-hover:bg-blue-600">
              Explore Characters
            </div>
          </div>
        </Link>
        
        {/* Card 2: Link to Jokes Page */}
        <Link 
          href="/jokes" 
          className="group block"
        >
          <div className="h-full rounded-xl bg-white p-8 shadow-lg transition-transform duration-300 ease-in-out group-hover:-translate-y-2 group-hover:shadow-2xl">
            <div className="text-5xl">🤣</div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              The Joke Archive
            </h2>
            <p className="mt-2 text-gray-600">
              Dive into a complete history of chuckles and groans, sorted from newest to oldest.
            </p>
            <div className="mt-6 inline-block rounded-full bg-green-500 px-5 py-2 text-sm font-semibold text-white transition-colors group-hover:bg-green-600">
              View All Jokes
            </div>
          </div>
        </Link>

      </div>
    </main>
  );
}