'use client';

import { useEffect, useMemo, useState } from 'react';
import { KidProfile } from '@/lib/types';
import { WONDER_GUIDES } from '@/lib/wonderGuides';

interface StoryMomentsProps {
  profile: KidProfile;
}

const STAGE_LABELS = ['Ask', 'Spark', 'Reveal'] as const;

export default function StoryMoments({ profile }: StoryMomentsProps) {
  const [selectedId, setSelectedId] = useState('moon');
  const [stage, setStage] = useState(0);

  const previews = useMemo(
    () => [
      {
        id: 'moon',
        question: 'Why does the moon follow our car?',
        palette: 'from-[#231539] via-[#5b2e8b] to-[#8d55c8]',
        spark: 'Silver dots drift upward and the wand glows like moonlight.',
        title: `${profile.childName || 'Your child'} and the Moon Ribbon`,
        snippet: `${profile.childName || 'Your child'} follows a silver ribbon through the night and learns that the moon only looks like it is following because both are moving together.`,
        wonder: 'I wonder why the moon changes shape in the sky?',
      },
      {
        id: 'peacock',
        question: 'Why do peacocks dance in the rain?',
        palette: 'from-[#1d4850] via-[#1f7c7a] to-[#6bd3bd]',
        spark: 'Drops tap the screen, teal feathers bloom, and the story card rises.',
        title: `${profile.childName || 'Your child'} and the Rain Dancers`,
        snippet: `${profile.childName || 'Your child'} meets a peacock who spreads bright feathers during the rainy season, when the birds become more active and call to one another.`,
        wonder: 'I wonder why some birds have bright colors and others do not?',
      },
      {
        id: 'rain',
        question: 'Where does the rain go after a storm?',
        palette: 'from-[#2f3e67] via-[#5c77bb] to-[#adc9ff]',
        spark: 'Blue ripples sweep across the screen and a story page flips open.',
        title: `${profile.childName || 'Your child'} and the Puddle Trail`,
        snippet: `${profile.childName || 'Your child'} follows a tiny puddle trail and discovers that rain can soak into the ground, run into drains, and rise back into the sky later.`,
        wonder: 'I wonder how clouds fill back up with water?',
      },
    ],
    [profile.childName],
  );

  const selectedPreview =
    previews.find((preview) => preview.id === selectedId) ?? previews[0];
  const guide = WONDER_GUIDES[profile.guide];

  useEffect(() => {
    setStage(0);
    const interval = window.setInterval(() => {
      setStage((currentStage) => (currentStage + 1) % STAGE_LABELS.length);
    }, 1800);

    return () => window.clearInterval(interval);
  }, [selectedId]);

  return (
    <section className="mx-auto mt-14 max-w-5xl rounded-[2.4rem] border border-[#e4d5c2] bg-[#fffaf2]/96 p-6 shadow-panel md:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.28em] text-honey-700">
        Question moments
      </p>
      <div className="mt-4 max-w-3xl">
        <h2 className="font-[family-name:var(--font-fredoka)] text-3xl font-semibold tracking-tight text-midnight-800 md:text-4xl">
          How the story reveal should feel
        </h2>
        <p className="mt-3 text-lg leading-8 text-[#7c6547]">
          These are prototype moments for the transition after a child asks a
          question. The intent is simple: one question, one burst of magic,
          then one calm story reveal.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
        <div className="grid gap-3">
          {previews.map((preview) => {
            const isActive = preview.id === selectedId;

            return (
              <button
                key={preview.id}
                type="button"
                onClick={() => setSelectedId(preview.id)}
                className={`rounded-[1.7rem] border p-4 text-left transition ${
                  isActive
                    ? 'border-[#6e2483] bg-[#f7f1ff] shadow-sm'
                    : 'border-[#ead8c0] bg-white hover:border-[#cfb898]'
                }`}
              >
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-honey-700">
                  Sample question
                </p>
                <h3 className="mt-2 text-xl font-bold leading-7 text-midnight-800">
                  {preview.question}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#7c6547]">
                  {preview.spark}
                </p>
              </button>
            );
          })}
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-[#e2d1be] bg-[#1d1032] p-5 text-white shadow-[0_22px_60px_rgba(25,10,38,0.24)]">
          <div className="flex flex-wrap items-center gap-3">
            {STAGE_LABELS.map((label, index) => (
              <div
                key={label}
                className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] transition ${
                  index === stage
                    ? 'bg-[var(--wj-sun)] text-[#381e4c]'
                    : 'bg-white/10 text-white/74'
                }`}
              >
                {label}
              </div>
            ))}
            <span className="ml-auto text-xs font-bold uppercase tracking-[0.22em] text-white/62">
              Guided by {guide.name}
            </span>
          </div>

          <div
            className={`relative mt-5 min-h-[24rem] overflow-hidden rounded-[1.9rem] bg-gradient-to-br ${selectedPreview.palette} p-5`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_34%)]" />
            <div
              className={`absolute left-6 top-6 max-w-[14rem] rounded-[1.5rem] border border-white/18 bg-white/10 px-4 py-3 backdrop-blur-sm transition duration-500 ${
                stage === 0 ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-78'
              }`}
            >
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#fff0aa]">
                Asked aloud
              </p>
              <p className="mt-2 text-lg font-semibold leading-7">
                {selectedPreview.question}
              </p>
            </div>

            <div
              className={`absolute left-1/2 top-[8.2rem] h-28 w-28 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,240,166,0.95),rgba(255,208,93,0.72))] shadow-[0_0_0_18px_rgba(255,255,255,0.08)] transition duration-500 ${
                stage >= 1 ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
              }`}
            >
              <div className="flex h-full items-center justify-center text-3xl text-[#3f2252]">
                ✦
              </div>
            </div>

            <div
              className={`absolute inset-x-5 bottom-5 rounded-[1.8rem] bg-[#fff9ef] p-5 text-storyink shadow-panel transition duration-500 ${
                stage === 2
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-8 opacity-0'
              }`}
            >
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-honey-700">
                Story reveal
              </p>
              <h3 className="mt-2 font-[family-name:var(--font-fredoka)] text-2xl font-semibold text-midnight-800">
                {selectedPreview.title}
              </h3>
              <p className="mt-3 text-base leading-7 text-[#6b5840]">
                {selectedPreview.snippet}
              </p>
              <div className="mt-4 rounded-[1.3rem] bg-[#fff0d6] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-honey-700">
                  Next wonder
                </p>
                <p className="mt-2 text-base font-semibold leading-7 text-midnight-800">
                  {selectedPreview.wonder}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
