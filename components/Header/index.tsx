// components/Header.tsx
'use client'; // This is a Client Component, which is required to use the usePathname hook.

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// An array of navigation links to make them easy to manage
const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/characters', label: 'Characters' },
  { href: '/jokes', label: 'Jokes' },
  { href: '/swagger', label: 'API' },
  { href: '/settings/generic-prompt', label: 'Settings' } // <-- added
];

export function Header() {
  // Get the current URL path
  const pathname = usePathname();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white">
            {/* decorative icon */}
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M3 12h18M12 3v18" />
            </svg>
          </div>
          <span className="text-xl font-semibold text-gray-900">Joke Factory</span>
        </Link>

        <nav>
          <ul className="flex items-center gap-6">
            {navLinks.map((link) => {
              // Check if the current link is the active one
              const isActive = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    // Conditionally apply styles for the active link
                    className={`
                      text-sm font-medium transition-colors
                      ${isActive
                        ? 'text-indigo-600'
                        : 'text-gray-600 hover:text-indigo-600'
                      }
                    `}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}