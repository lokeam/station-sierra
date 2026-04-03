"use client";

import Link from "next/link";
import React from "react";
import { Logo } from "@/app/components/logo";

export function Footer() {

  const socials = [
    { title: "Twitter", href: "https://twitter.com/lokeam" },
    { title: "LinkedIn", href: "https://www.linkedin.com/in/ahnmingloke/" },
    { title: "GitHub", href: "https://github.com/lokeam/station-sierra" },
    { title: "Medium", href: "https://medium.com/@lokeahnming" },
  ];

  const signups = [
    { title: "Free Trial", href: "/respondents" },
    { title: "Documentation", href: "https://github.com/lokeam/station-sierra" },
  ];

  return (
    <div className="relative w-full overflow-hidden border-t border-neutral-100 bg-white px-8 pt-20 dark:border-white/10 dark:bg-neutral-950">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between text-sm text-neutral-500 sm:flex-row md:px-8">
        <div>
          <div className="mr-0 mb-4 md:mr-4 md:flex">
            <Link
              href="/"
              className="relative z-20 mr-4 flex items-center space-x-2 px-2 py-1 text-sm font-normal"
            >
              <Logo size={30} color="#1e90ff" />
              <span className="font-medium text-black dark:text-white">
                Station Sierra
              </span>
            </Link>
          </div>

          <div className="mt-4 ml-2 flex items-center gap-4">
            <Link
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
              aria-label="Twitter"
            >
              <TwitterIcon className="size-5" />
            </Link>
            <Link
              href="https://www.linkedin.com/in/ahnmingloke/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
              aria-label="LinkedIn"
            >
              <LinkedInIcon className="size-5" />
            </Link>
            <Link
              href="https://github.com/lokeam/station-sierra"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
              aria-label="GitHub"
            >
              <GithubIcon className="size-5" />
            </Link>
          </div>

          <div className="mt-4 ml-2 text-neutral-500 dark:text-neutral-400">
            &copy; {new Date().getFullYear()} Station Sierra. Made with ♥ by Ahn Ming Loke
          </div>
        </div>
        <div className="mt-10 grid grid-cols-2 items-start gap-10 sm:mt-0 md:mt-0 lg:grid-cols-4">

          <div className="flex flex-col justify-center gap-4">
            <p className="font-bold text-neutral-600 transition-colors hover:text-neutral-800 dark:text-neutral-300 dark:hover:text-white">
              Socials
            </p>
            <ul className="flex list-none flex-col gap-4 text-neutral-600 transition-colors dark:text-neutral-300">
              {socials.map((social, idx) => (
                <li key={"social" + idx} className="list-none">
                  <Link
                    className="transition-colors hover:text-neutral-800 dark:hover:text-white"
                    href={social.href}
                  >
                    {social.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col justify-center gap-4">
            <p className="font-bold text-neutral-600 transition-colors hover:text-neutral-800 dark:text-neutral-300 dark:hover:text-white">
              Get Started
            </p>
            <ul className="flex list-none flex-col gap-4 text-neutral-600 transition-colors dark:text-neutral-300">
              {signups.map((auth, idx) => (
                <li key={"auth" + idx} className="list-none">
                  <Link
                    className="transition-colors hover:text-neutral-800 dark:hover:text-white"
                    href={auth.href}
                  >
                    {auth.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="relative mt-20 h-[calc(clamp(3rem,18vw,20rem)*0.75)] w-full overflow-hidden">
        <p
          className="absolute inset-x-0 top-0 w-full text-center leading-none font-bold text-transparent"
          style={{
            fontSize: "clamp(3rem, 18vw, 20rem)",
            letterSpacing: "-0.02em",
          }}
        >
          <span
            className="dark:hidden"
            style={{ WebkitTextStroke: "1px var(--color-neutral-200)" }}
          >
            Station Sierra
          </span>
          <span
            className="hidden dark:inline"
            style={{ WebkitTextStroke: "1px var(--color-neutral-700)" }}
          >
            Station Sierra
          </span>
        </p>
      </div>
    </div>
  );
}

const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedInIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
);