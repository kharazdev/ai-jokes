export const JokeCardSkeleton = () => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="h-2 bg-gray-200 animate-pulse"></div>
      <div className="p-6 sm:p-8">
        <header className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
          <div className="w-full space-y-2">
            <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
          </div>
        </header>
        <div className="space-y-3 pl-4 border-l-4 border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-5/6 animate-pulse"></div>
        </div>
        <footer className="mt-6 flex justify-end">
          <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        </footer>
      </div>
    </div>
  );
};