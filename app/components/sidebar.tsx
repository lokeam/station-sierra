'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './logo';
import { ThemeToggle } from './theme-toggle';

interface SidebarProps {
  respondentCount: number;
  genreCount: number;
}

const navItems = [
  { href: '/respondents', label: 'Respondents', icon: RespondentsIcon },
  { href: '/audiences', label: 'Audiences', icon: AudiencesIcon },
  { href: '/concepts', label: 'Concepts', icon: ConceptsIcon },
];

export function Sidebar({ respondentCount, genreCount }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-56 shrink-0 border-r border-border bg-muted/50 h-full">
      <div className="flex items-center justify-between px-4 h-14 border-b border-border">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="font-semibold text-sm tracking-tight">Station Sierra</span>
        </div>
        <ThemeToggle />
      </div>

      <nav className="flex flex-col gap-1 p-3 flex-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary/10 text-primary border-l-2 border-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
        <div>{respondentCount} respondents</div>
        <div>{genreCount} genres</div>
      </div>
    </aside>
  );
}

function RespondentsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function AudiencesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function ConceptsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
