'use client';

import { useEffect, useState } from 'react';
import { WonderGuideId } from '@/lib/types';
import { FireflyDot, Lamp } from './WonderDecor';
import WonderGuideAvatar from './WonderGuideAvatar';

interface StoryLoadingProps {
  childName: string;
  guide: WonderGuideId;
  question?: string;
}

const CLUE_FRAGMENTS = [
  'a moon peeks over a tree',
  'fireflies gather',
  'a little page turns',
  'a lamp is lit',
  'a star winks',
];

export default function StoryLoading({
  childName,
  guide,
  question,
}: StoryLoadingProps) {
  const [fragmentIndex, setFragmentIndex] = useState(0);
  const accent = guide === 'nachi' ? '#F3C056' : '#5BC9C2';

  useEffect(() => {
    setFragmentIndex(0);
  }, [question]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFragmentIndex((current) => (current + 1) % CLUE_FRAGMENTS.length);
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="mx-auto min-h-[calc(100svh-2.5rem)] w-full max-w-[420px] lg:max-w-none">
      <div className="wj-screen relative min-h-[760px] overflow-hidden lg:min-h-[680px] lg:max-w-none lg:rounded-[2.5rem]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(500px_500px_at_50%_45%,rgba(91,42,107,0.42),transparent_60%)]" />

          {[
            { left: '11%', top: '33%' },
            { left: '79%', top: '37%' },
            { left: '18%', top: '59%' },
            { left: '73%', top: '56%' },
            { left: '49%', top: '22%' },
          ].map((point, index) => (
            <div
              key={`${point.left}-${point.top}`}
              className="absolute"
              style={{
                left: point.left,
                top: point.top,
                animation: `${index % 2 === 0 ? 'wj-drift' : 'wj-drift2'} ${
                  6 + index * 0.6
                }s linear infinite ${index * 0.28}s`,
              }}
            >
              {index % 3 === 0 ? (
                <Lamp size={34} lit />
              ) : index % 3 === 1 ? (
                <FireflyDot size={8} hue={accent} />
              ) : (
                <div className="h-7 w-5 rounded-[4px] border border-black/10 bg-[linear-gradient(180deg,#f6eedd,#e8d8b0)] shadow-[0_4px_10px_rgba(0,0,0,0.3)]" />
              )}
            </div>
          ))}
        </div>

        <div className="relative flex min-h-[760px] flex-col items-center px-6 pb-10 pt-20 text-center lg:min-h-[680px] lg:px-12">
          <div className="relative">
            <div
              className="pointer-events-none absolute inset-[-1.8rem] rounded-full border-2 border-dashed"
              style={{
                borderColor: `${accent}55`,
                animation: 'wj-spin 8s linear infinite',
              }}
            />
            <WonderGuideAvatar
              guide={guide}
              size="lg"
              expression="calm"
              floating
              glow
            />
          </div>

          <p className="wj-caveat mt-12 text-[22px]" style={{ color: accent }}>
            finding the answer…
          </p>
          <p className="wj-display mt-3 max-w-[17rem] text-[22px] leading-[1.25] text-[var(--wj-ivory)]">
            &ldquo;{question || `What is ${childName} wondering?`}&rdquo;
          </p>

          <div className="mt-auto flex w-full flex-col items-center">
            <p className="wj-overline">Gathering</p>
            <p className="mt-3 wj-display min-h-[3.8rem] max-w-[16rem] text-[22px] leading-[1.25] text-[var(--wj-ivory)]">
              {CLUE_FRAGMENTS[fragmentIndex]}
            </p>
            <p className="mt-3 max-w-[16rem] text-sm leading-6 text-[var(--wj-muted)]">
              Stay close. The answer is coming in simple words.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
