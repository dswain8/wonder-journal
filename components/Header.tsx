'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { APP_PROFILE_EVENT, APP_PROFILE_STORAGE_KEY } from '@/lib/appProfile';
import { AppProfile } from '@/lib/types';

export default function Header() {
  const [profile, setProfile] = useState<AppProfile | null>(null);

  useEffect(() => {
    const loadProfile = () => {
      try {
        const rawProfile = window.localStorage.getItem(APP_PROFILE_STORAGE_KEY);
        setProfile(rawProfile ? (JSON.parse(rawProfile) as AppProfile) : null);
      } catch {
        setProfile(null);
      }
    };

    loadProfile();
    window.addEventListener('storage', loadProfile);
    window.addEventListener(APP_PROFILE_EVENT, loadProfile as EventListener);

    return () => {
      window.removeEventListener('storage', loadProfile);
      window.removeEventListener(APP_PROFILE_EVENT, loadProfile as EventListener);
    };
  }, []);

  const onboarded = Boolean(profile?.onboardingComplete);

  return (
    <header className="sticky top-0 z-50">
      <div className="mx-auto max-w-5xl px-4 py-3">
        <div className="flex items-center justify-between rounded-full border border-white/12 bg-[rgba(45,18,63,0.78)] px-3 py-2 shadow-[0_18px_45px_rgba(31,11,43,0.22)] backdrop-blur-xl">
          <Link
            href="/"
            className="flex items-center gap-3 font-[family-name:var(--font-fredoka)] text-lg font-semibold tracking-tight text-white sm:text-xl"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--wj-lime)] text-[var(--wj-night)] shadow-[0_10px_22px_rgba(0,0,0,0.18)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 19h16" />
                <path d="M5 19V9l7 4 7-4v10" />
                <path d="m12 4 .7 1.6L14.3 6.3l-1.6.7L12 8.6l-.7-1.6-1.6-.7 1.6-.7L12 4Z" />
              </svg>
            </span>
            <span className="leading-none">
              Wonder Journal
              <span className="mt-1 block font-sans text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[#ffe38d]">
                No little question goes unanswered.
              </span>
            </span>
          </Link>

          {onboarded ? (
            <nav className="flex items-center gap-2 text-sm font-semibold text-white">
              {profile?.childName ? (
                <span className="hidden rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/84 sm:inline-flex">
                  {profile.childName}
                </span>
              ) : null}
              <Link
                href="/journal"
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 transition hover:bg-white/16"
                aria-label="Open stories"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
                </svg>
                <span className="hidden sm:inline">Journal</span>
              </Link>
            </nav>
          ) : null}
        </div>
      </div>
    </header>
  );
}
