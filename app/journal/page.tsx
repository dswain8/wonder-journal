'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DesktopStage from '@/components/DesktopStage';
import JournalList from '@/components/JournalList';
import { APP_PROFILE_STORAGE_KEY } from '@/lib/appProfile';
import { AppProfile, Story } from '@/lib/types';

export default function JournalPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AppProfile | null>(null);

  useEffect(() => {
    try {
      const rawProfile = window.localStorage.getItem(APP_PROFILE_STORAGE_KEY);
      setProfile(rawProfile ? (JSON.parse(rawProfile) as AppProfile) : null);
    } catch {
      setProfile(null);
    }

    fetch('/api/stories', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => {
        setStories(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DesktopStage
        eyebrow="parent archive"
        title="Every saved answer becomes part of the product loop."
        description="The journal is the parent-facing memory surface. On desktop it should feel like a useful archive, not an afterthought."
      >
        <section className="mx-auto flex min-h-[calc(100svh-2.5rem)] w-full max-w-[420px] items-center lg:max-w-none">
          <div className="wj-screen flex min-h-[760px] items-center justify-center px-6 text-center lg:min-h-[680px] lg:max-w-none lg:rounded-[2.5rem]">
            <div>
              <p className="wj-caveat text-[22px] text-[var(--wj-marigold)]">
                gathering keepsakes…
              </p>
              <p className="mt-3 text-sm text-[var(--wj-muted)]">
                Opening the wonder journal.
              </p>
            </div>
          </div>
        </section>
      </DesktopStage>
    );
  }

  return (
    <DesktopStage
      eyebrow="parent archive"
      title="The journal should be useful on laptop and gentle on phone."
      description="This is where the product starts to earn memory value. Parents need to skim it quickly on desktop and still feel the warmth of the kid-facing product."
      notes={[
        { label: 'Entries', value: `${stories.length} saved question${stories.length === 1 ? '' : 's'}.` },
        { label: 'Child profile', value: `${profile?.childName || 'Little one'}'s keepsake history.` },
      ]}
      checklist={[
        'Can a parent scan the journal quickly on desktop?',
        'Do entries still feel like keepsakes instead of log rows?',
        'Does the journal stay clearly secondary to the child flow?',
      ]}
    >
      <section className="mx-auto min-h-[calc(100svh-2.5rem)] w-full max-w-[420px] lg:max-w-none">
        <div className="wj-screen min-h-[760px] overflow-hidden lg:min-h-[680px] lg:max-w-none lg:rounded-[2.5rem]">
          <div className="sticky top-0 z-10 bg-[linear-gradient(180deg,rgba(26,21,54,0.92),rgba(26,21,54,0.76))] px-4 pb-4 pt-4 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <Link
                href="/"
                className="flex h-[38px] w-[38px] items-center justify-center rounded-[12px] bg-white/5 text-[18px] text-[var(--wj-ivory)]"
                style={{
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.14)',
                }}
                aria-label="Back home"
              >
                ←
              </Link>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">
                Parent view
              </p>
              <div className="w-[38px]" />
            </div>

            <div className="mt-4 px-1">
              <p className="wj-caveat text-[22px] text-[var(--wj-marigold)]">
                a keepsake of
              </p>
              <h1 className="wj-display mt-1 text-[34px] leading-none text-[var(--wj-ivory)]">
                {(profile?.childName || 'Little one')}&rsquo;s wonders
              </h1>
              <p className="mt-2 text-[13.5px] text-[var(--wj-muted)]">
                {stories.length} question{stories.length === 1 ? '' : 's'} saved so far.
              </p>
            </div>

            <div className="wj-hide-scrollbar mt-4 flex gap-2 overflow-x-auto">
              {[`All · ${stories.length}`, 'This week', 'Favourites', 'Sky', 'Nature'].map(
                (item, index) => (
                  <span
                    key={item}
                    className="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold"
                    style={{
                      background: index === 0 ? 'var(--wj-marigold)' : 'rgba(255,255,255,0.06)',
                      color: index === 0 ? '#1b1738' : 'rgba(246,238,221,0.78)',
                      boxShadow:
                        index === 0
                          ? 'none'
                          : 'inset 0 0 0 1px rgba(246,238,221,0.18)',
                    }}
                  >
                    {item}
                  </span>
                ),
              )}
            </div>
          </div>

          <div className="px-4 pb-6 pt-3">
            {stories.length === 0 ? (
              <div
                className="rounded-[24px] bg-white/5 px-6 py-12 text-center"
                style={{
                  boxShadow: 'inset 0 0 0 1px rgba(246,238,221,0.12)',
                }}
              >
                <p className="wj-caveat text-[22px] text-[var(--wj-marigold)]">
                  not yet, but soon
                </p>
                <h2 className="wj-display mt-2 text-[28px] leading-[1.1] text-[var(--wj-ivory)]">
                  No wonders saved yet.
                </h2>
                <p className="mt-3 text-sm leading-6 text-[var(--wj-muted)]">
                  Ask one question from the home screen and the first keepsake will appear
                  here.
                </p>
                <Link href="/" className="wj-primary-btn mt-6">
                  Ask the first question
                </Link>
              </div>
            ) : (
              <JournalList stories={stories} />
            )}
          </div>
        </div>
      </section>
    </DesktopStage>
  );
}
