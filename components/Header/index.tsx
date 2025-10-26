// components/Header.tsx
'use client'; // This is a Client Component, which is required to use the usePathname hook.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
const mainLink = { href: '/jokes', label: 'Jokes' }
const dropdownLinks = [
  { href: '/jokes', label: 'Jokes' },

  { href: '/characters', label: 'Characters' }, { href: '/evaluation', label: 'evaluation' }

  ,
  { href: '/training', label: 'Training Data' },
  { href: '/settings/generic-prompt', label: 'Settings' },
  // You can add more links here in the future
  { href: '/swagger', label: 'API Docs' },
];
// An array of navigation links to make them easy to manage
const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/characters', label: 'Characters' },
  { href: '/jokes', label: 'Jokes' },
  { href: '/swagger', label: 'API' },
  { href: '/settings/generic-prompt', label: 'Settings' } // <-- added
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        {/* Your logo/title remains the same */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M3 12h18M12 3v18" />
            </svg>
          </div>
          <span className="text-xl font-semibold text-gray-900">AI Joke Factory</span>
        </Link>

        {/* --- NEW DROPDOWN NAVIGATION --- */}
        <nav>
          <ul className="flex items-center gap-6">
            {/* Main Character Link */}
            <li>
              <Link
                href={mainLink.href}
                className={`
                  text-sm font-medium transition-colors
                  ${pathname.startsWith(mainLink.href)
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                  }
                `}
              >
                {mainLink.label}
              </Link>
            </li>

            {/* Dropdown Menu Item */}
            <li className="relative group"> {/* 'group' is the key for Tailwind hover magic */}
              <button
                className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-blue-600 focus:outline-none"
              >
                <span>More Pages</span>
                <svg className="h-4 w-4 transition-transform group-hover:rotate-180" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </button>

              {/* The Dropdown Panel */}
              {/* It's hidden by default and becomes visible on 'group-hover' */}
              <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  {dropdownLinks.map((link) => {
                    const isActive = pathname.startsWith(link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`block px-4 py-2 text-sm ${isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        role="menuitem"
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}