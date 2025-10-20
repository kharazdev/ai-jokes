// components/Header.tsx
'use client'; // This is a Client Component, which is required to use the usePathname hook.

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// An array of navigation links to make them easy to manage
const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/characters', label: 'Characters' },
  { href: '/jokes', label: 'Jokes' },
  { href: '/swagger', label: 'API' } // <-- added link to Swagger-like tester
];

export function Header() {
  // Get the current URL path
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 shadow-md backdrop-blur-md">
      <nav className="container mx-auto flex items-center justify-between px-6 py-4">
        {/* Site Title / Logo */}
        <Link href="/" className="text-2xl font-bold text-gray-800 hover:text-blue-600 transition-colors">
          Joke Factory 🏭
        </Link>
        
        {/* Navigation Links */}
        <ul className="flex items-center space-x-6">
          {navLinks.map((link) => {
            // Check if the current link is the active one
            const isActive = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  // Conditionally apply styles for the active link
                  className={`
                    text-lg font-medium transition-colors
                    ${isActive
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-blue-600'
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
    </header>
  );
}