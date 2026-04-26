'use client';

import { ReactNode, useEffect, useState } from 'react';

interface StageNote {
  label: string;
  value: string;
}

interface DesktopStageProps {
  eyebrow: string;
  title: string;
  description: string;
  notes?: StageNote[];
  checklist?: string[];
  children: ReactNode;
}

export default function DesktopStage({
  eyebrow,
  title,
  description,
  notes = [],
  checklist = [],
  children,
}: DesktopStageProps) {
  const [origin, setOrigin] = useState('http://127.0.0.1:3000');
  const [reviewMode, setReviewMode] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
      setReviewMode(
        new URLSearchParams(window.location.search).get('review') === '1',
      );
    }
  }, []);

  if (!reviewMode) {
    return <div className="mx-auto w-full max-w-[460px]">{children}</div>;
  }

  return (
    <div className="mx-auto max-w-[1240px] lg:grid lg:grid-cols-[minmax(320px,420px)_minmax(0,460px)] lg:items-center lg:gap-10 xl:gap-16">
      <aside className="hidden lg:block">
        <div className="sticky top-8">
          <p className="wj-caveat text-[28px] text-[var(--wj-marigold)]">
            {eyebrow}
          </p>
          <h1 className="wj-display mt-2 max-w-[12ch] text-[56px] leading-[0.98] text-[var(--wj-ivory)]">
            {title}
          </h1>
          <p className="mt-5 max-w-[34ch] text-[17px] leading-8 text-[var(--wj-muted)]">
            {description}
          </p>

          <div className="mt-8 space-y-4">
            {notes.length > 0 ? (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div
                    key={`${note.label}-${note.value}`}
                    className="rounded-[22px] bg-white/5 px-5 py-4"
                    style={{
                      boxShadow: 'inset 0 0 0 1px rgba(246,238,221,0.12)',
                    }}
                  >
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/45">
                      {note.label}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[var(--wj-ivory)]">
                      {note.value}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            <div
              className="rounded-[26px] px-5 py-5"
              style={{
                background:
                  'linear-gradient(160deg, rgba(31,107,107,0.2) 0%, rgba(91,42,107,0.34) 100%)',
                boxShadow:
                  '0 20px 40px rgba(0,0,0,0.22), inset 0 0 0 1px rgba(246,238,221,0.12)',
              }}
            >
              <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--wj-marigold)]">
                Test this build
              </p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--wj-ivory)]">
                <p>
                  Laptop: <span className="font-semibold">{origin}</span>
                </p>
                <p>
                  Phone: open{' '}
                  <span className="font-semibold">http://&lt;your-mac-ip&gt;:3000</span> on
                  the same Wi-Fi.
                </p>
                <p className="text-[var(--wj-muted)]">
                  Ollama still runs on the laptop. The phone browser uses the same local
                  server through this app.
                </p>
              </div>
            </div>

            {checklist.length > 0 ? (
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/45">
                  What to verify
                </p>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--wj-muted)]">
                  {checklist.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--wj-marigold)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </aside>

      <div>{children}</div>
    </div>
  );
}
