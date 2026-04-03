"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { LinesGradientShader } from "./lines-gradient-shader";

const MotionLink = motion.create(Link);

export default function Hero() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white dark:bg-neutral-950">
      <LinesGradientShader
        className="absolute inset-0 bg-transparent dark:bg-transparent"
        bandSpacing={40}
        bandThickness={100}
        waveAmplitude={0.2}
        speed={1}
      />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-32">
        {/* Badge */}
        <div>
          <MotionLink
            href="/respondents"
            className="ring-none flex w-fit items-center gap-2 rounded-full bg-white px-2 py-1 text-xs text-neutral-700 transition duration-200 hover:bg-neutral-50 active:scale-98 dark:bg-neutral-800 dark:text-neutral-300"
            whileHover="animate"
            initial="initial"
          >
            Audience intelligence, grounded in real data{" "}
            <motion.span
              variants={{
                initial: { x: 0 },
                animate: { x: 2 },
              }}
            >
              →
            </motion.span>
          </MotionLink>
        </div>

        <h1 className="mt-4 max-w-3xl text-4xl font-medium tracking-tight text-neutral-700 md:text-7xl dark:text-neutral-300">
          Less Spreadsheet. More Strategy. Same Survey Data.
        </h1>

        <p className="mt-4 max-w-2xl text-base text-neutral-700 md:text-xl dark:text-neutral-300">
          Station Sierra turns raw survey data into audience segments and
          AI-generated campaign concepts grounded in real genre signals. Stop
          combing through spreadsheets — start building strategies backed by what
          your audience actually cares about.
        </p>

        <div className="mt-8">
          <Link
            href="/respondents"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white shadow-[0_1px_2px_0_rgba(0,0,0,0.1)] transition-colors hover:bg-brand-primary/90 active:scale-[0.98]"
          >
            Get Started <span>→</span>
          </Link>
        </div>

        {/* MacBook Window */}
        <div className="mt-16 md:mt-24">
          <div className="relative mx-auto max-w-full">
            {/* Window Frame */}
            <div className="overflow-hidden rounded-xl border border-neutral-300/50 bg-white/70 backdrop-blur-sm dark:border-neutral-700/50 dark:bg-neutral-900/70">
              {/* Title Bar */}
              <div className="flex items-center gap-2 border-b border-neutral-200/50 px-4 py-3 dark:border-neutral-700/50">
                <div className="flex items-center gap-1.5">
                  <div className="size-3 rounded-full bg-red-500" />
                  <div className="size-3 rounded-full bg-yellow-500" />
                  <div className="size-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 text-center">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    Station Sierra
                  </span>
                </div>
                <div className="w-12" />
              </div>
              {/* Window Content */}
              <div className="relative aspect-16/10 w-full">
                <Image
                  src="/station_sierra_concepts_dashboard.png"
                  alt="Station Sierra app showing saved concepts"
                  fill
                  className="object-cover object-top"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
