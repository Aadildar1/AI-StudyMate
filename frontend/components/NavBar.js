"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

const links = [
  { href: "/", label: "Learn", icon: "🚀" },
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/library", label: "Library", icon: "📚" },
];

/**
 * Top navigation shared by every page. Collapses to icons on narrow screens
 * so it never forces horizontal scrolling on a phone.
 */
export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 w-full bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 px-4 sm:px-8 py-3 sm:py-4">
        <Link href="/" className="text-xl sm:text-2xl font-bold text-white whitespace-nowrap">
          AI StudyMate
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-label={link.label}
                className={`px-3 sm:px-4 py-2 rounded-xl border text-sm sm:text-base transition whitespace-nowrap ${
                  active
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-zinc-200"
                }`}
              >
                <span aria-hidden="true">{link.icon}</span>
                <span className="hidden sm:inline ml-1">{link.label}</span>
              </Link>
            );
          })}

          <Show when="signed-out">
            <SignInButton>
              <button className="px-3 sm:px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-sm sm:text-base whitespace-nowrap">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton>
              <button className="hidden sm:inline-block px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 whitespace-nowrap">
                Register
              </button>
            </SignUpButton>
          </Show>

          <Show when="signed-in">
            <div className="flex items-center gap-2 pl-1">
              <span className="hidden md:inline text-gray-300 font-medium">My Account</span>
              <UserButton />
            </div>
          </Show>
        </div>
      </div>
    </nav>
  );
}
