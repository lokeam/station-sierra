"use client";

import React, { useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "motion/react";
import Link from "next/link";
import { Logo } from "@/app/components/logo";

export const Navbar = () => {
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  const { scrollY } = useScroll();

  const paddingHorizontal = useTransform(scrollY, [0, 50], [0, 16]);
  const paddingVertical = useTransform(scrollY, [0, 50], [0, 8]);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setHasScrolled(latest > 10);

    const scrollingDown = latest > lastScrollY.current;
    const scrollDelta = Math.abs(latest - lastScrollY.current);

    if (scrollDelta > 5) {
      if (scrollingDown && latest > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      lastScrollY.current = latest;
    }
  });

  return (
    <motion.nav
      initial={{ y: 0 }}
      animate={{
        y: isVisible ? 0 : -100,
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      style={{
        paddingLeft: paddingHorizontal,
        paddingRight: paddingHorizontal,
        paddingTop: paddingVertical,
      }}
      className="fixed inset-x-0 z-50 mx-auto w-full max-w-7xl"
    >
      <motion.div
        animate={{
          borderRadius: hasScrolled ? 24 : 0,
          backdropFilter: hasScrolled ? "blur(12px)" : "blur(0px)",
        }}
        transition={{ duration: 0.3 }}
        className={`flex h-14 items-center justify-between px-4 transition-colors duration-300 sm:h-16 md:px-8 ${
          hasScrolled
            ? "bg-white/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)] dark:bg-neutral-900/80 dark:shadow-[0_1px_3px_0_rgba(0,0,0,0.3),0_1px_2px_-1px_rgba(0,0,0,0.3)]"
            : "bg-transparent shadow-none"
        }`}
        data-scrolled={hasScrolled}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <Logo size={20} color="#1e90ff" />
          <span className="text-base font-semibold text-black sm:text-lg dark:text-white">
            Station Sierra
          </span>
        </Link>

        {/* Get Started button */}
        <Link
          href="/respondents"
          className="inline-flex items-center justify-center rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white shadow-[0_1px_2px_0_rgba(0,0,0,0.1)] transition-colors hover:bg-brand-primary/90 active:scale-[0.98]"
        >
          Get Started
        </Link>
      </motion.div>
    </motion.nav>
  );
};
