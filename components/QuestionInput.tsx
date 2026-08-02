'use client';

import Link from 'next/link';
import { useState } from 'react';
import { KidProfile } from '@/lib/types';
import { FireflyDot } from './WonderDecor';
import VoiceButton from './VoiceButton';
import WonderGuideAvatar from './WonderGuideAvatar';

interface QuestionInputProps {
  onSubmit: (question: string) => void;
  isLoading: boolean;
  profile: KidProfile;
  sampleQuestions?: string[];
  error?: string | null;
}

const AMBIENT_FIREFLIES = [
  { left: '12%', top: '20%', size: 7, drift: 'wj-drift' },
  { left: '83%', top: '28%', size: 6, drift: 'wj-drift2' },
  { left: '18%', top: '58%', size: 8, drift: 'wj-drift2' },
  { left: '76%', top: '63%', size: 6, drift: 'wj-drift' },
];

export default function QuestionInput({
  onSubmit,
  isLoading,
  profile,
  sampleQuestions = [],
  error,
}: QuestionInputProps) {
  const [question, setQuestion] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showParentPanel, setShowParentPanel] = useState(false);

  const guideAccent = profile.guide === 'nachiketh' ? '#F3C056' : '#5BC9C2';

  const getRandomQuestion = () => {
    if (sampleQuestions.length === 0) {
      return 'Why does the moon follow our car?';
    }

    return sampleQuestions[Math.floor(Math.random() * sampleQuestions.length)];
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!question.trim() || isLoading) {
      return;
    }

    onSubmit(question.trim());
  };

  const handleSampleQuestion = (sampleQuestion: string) => {
    if (isLoading) {
      return;
    }

    setQuestion(sampleQuestion);
    onSubmit(sampleQuestion);
  };

  const handleTranscript = (transcript: string) => {
    const cleanTranscript = transcript.trim();

    if (!cleanTranscript || isLoading) {
      return;
    }

    setQuestion(cleanTranscript);
    setShowParentPanel(false);
    onSubmit(cleanTranscript);
  };

  return (
    <section className="mx-auto min-h-[calc(100svh-2.5rem)] w-full max-w-[420px] lg:max-w-none">
      <form
        onSubmit={handleSubmit}
        className="wj-screen relative min-h-[760px] lg:min-h-[680px] lg:max-w-none lg:rounded-[2.5rem]"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute left-1/2 top-[15.5rem] h-[21rem] w-[21rem] -translate-x-1/2 rounded-full"
            style={{
              background: `radial-gradient(circle, ${guideAccent}26, transparent 65%)`,
            }}
          />
          {AMBIENT_FIREFLIES.map((firefly, index) => (
            <div
              key={`${firefly.left}-${firefly.top}`}
              className="absolute"
              style={{
                left: firefly.left,
                top: firefly.top,
                animation: `${firefly.drift} ${10 + index * 2}s ease-in-out infinite ${
                  index * 0.4
                }s`,
              }}
            >
              <FireflyDot size={firefly.size} hue={guideAccent} />
            </div>
          ))}
        </div>

        <div className="relative flex min-h-[760px] flex-col px-5 pb-6 pt-4 lg:min-h-[680px] lg:px-8 lg:pb-8 lg:pt-7">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold text-[#3a1a0a]"
                style={{
                  background:
                    'linear-gradient(180deg, var(--wj-marigold) 0%, var(--wj-marigold-2) 100%)',
                  boxShadow:
                    '0 8px 18px rgba(226,148,36,0.32), inset 0 1px 0 rgba(255,255,255,0.45)',
                }}
              >
                {(profile.childName.trim() || 'A')[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-white/90">
                  Hello, {profile.childName.trim() || 'wonderer'}
                </p>
                <p className="text-xs text-white/45">A little question can begin any time.</p>
              </div>
            </div>

            <Link
              href="/journal"
              className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-white/5 text-[var(--wj-ivory)] transition hover:bg-white/10"
              style={{
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.14)',
              }}
              aria-label="Open journal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
              </svg>
            </Link>
          </div>

          <div className="mt-9 text-center lg:mt-10">
            <p
              className="wj-caveat text-[22px]"
              style={{ color: guideAccent }}
            >
              {profile.guide === 'nachiketh' ? 'Nachiketh is listening' : 'Gargi is listening'}
            </p>
            <h1 className="wj-display mt-1 text-[30px] leading-[1.05] text-[var(--wj-ivory)] lg:text-[44px]">
              What are you
              <br />
              wondering today?
            </h1>
          </div>

          <div className="relative mt-4 flex justify-center lg:mt-6">
            <WonderGuideAvatar
              guide={profile.guide}
              size="lg"
              expression={isListening ? 'calm' : 'curious'}
              floating
              glow
            />
          </div>

          <div className="relative mt-1 flex flex-col items-center">
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                boxShadow: `0 0 0 1px ${guideAccent}44`,
                animation: 'wj-ripple 3s ease-out infinite',
              }}
            />
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                boxShadow: `0 0 0 1px ${guideAccent}22`,
                animation: 'wj-ripple 3s ease-out infinite 0.9s',
              }}
            />
            <div
              className="relative overflow-hidden rounded-full"
              style={{
                boxShadow: '0 30px 60px rgba(232,164,60,0.42)',
              }}
            >
              <VoiceButton
                onTranscript={handleTranscript}
                onListeningChange={(listening) => {
                  setIsListening(listening);
                  if (listening) {
                    setShowParentPanel(false);
                  }
                }}
                disabled={isLoading}
                size="hero"
                icon="wand"
              />
            </div>

            <p className="mt-5 text-sm font-bold tracking-[0.08em] text-white/90">
              {isListening ? (
                <span className="animate-pulse text-[#ffd766]">Tap the wand again when you are done</span>
              ) : (
                'tap when you are ready'
              )}
            </p>
          </div>

          <div className="mt-auto lg:mx-auto lg:w-full lg:max-w-[620px]">
            {isListening ? (
              <div className="mb-5 flex h-[72px] items-center justify-center gap-[3px]">
                {Array.from({ length: 24 }, (_, index) => (
                  <span
                    key={index}
                    className="block h-12 max-w-[6px] flex-1 rounded-full"
                    style={{
                      background: `linear-gradient(180deg, ${guideAccent}, #e19424)`,
                      transformOrigin: 'center',
                      animation: `wj-bar ${0.7 + (index % 5) * 0.12}s ease-in-out infinite ${
                        index * 0.05
                      }s`,
                    }}
                  />
                ))}
              </div>
            ) : (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <p className="wj-overline">Try one</p>
                  <button
                    type="button"
                    onClick={() => handleSampleQuestion(getRandomQuestion())}
                    className="text-xs font-bold uppercase tracking-[0.16em] text-white/55"
                  >
                    surprise me
                  </button>
                </div>

                <div className="wj-hide-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-3">
                  {sampleQuestions.map((sampleQuestion) => (
                    <button
                      key={sampleQuestion}
                      type="button"
                      onClick={() => handleSampleQuestion(sampleQuestion)}
                      className="flex-shrink-0 rounded-full bg-white/5 px-4 py-2.5 text-[13.5px] font-medium text-[var(--wj-ivory)] transition hover:bg-white/10"
                      style={{
                        boxShadow: 'inset 0 0 0 1px rgba(246,238,221,0.18)',
                      }}
                    >
                      {sampleQuestion}
                    </button>
                  ))}
                </div>
              </>
            )}

            {showParentPanel ? (
              <div className="wj-glass mb-4 rounded-[22px] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="wj-overline">Parent mode</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--wj-muted)]">
                      Type a question quietly if you want to steer the next wonder.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowParentPanel(false)}
                    className="text-lg text-white/45"
                    aria-label="Close parent panel"
                  >
                    ×
                  </button>
                </div>

                <div className="mt-4 flex flex-col gap-3">
                  <input
                    type="text"
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder="Why does the moon follow our car?"
                    maxLength={220}
                    disabled={isLoading}
                    className="min-h-14 rounded-[18px] border border-white/10 bg-white/8 px-4 text-[16px] text-[var(--wj-ivory)] outline-none placeholder:text-white/25"
                  />
                  <button
                    type="submit"
                    disabled={!question.trim() || isLoading}
                    className="wj-primary-btn w-full"
                  >
                    Show answer
                  </button>
                </div>
              </div>
            ) : null}

            {error ? (
              <div
                className="mb-4 rounded-[20px] bg-[#4c1f33]/82 px-4 py-3 text-center text-sm font-semibold leading-5 text-[#ffd9e2]"
                style={{
                  boxShadow: 'inset 0 0 0 1px rgba(255,180,200,0.16)',
                }}
              >
                {error}
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              <Link href="/journal" className="wj-ghost-btn flex-1">
                my wonders
              </Link>
              <button
                type="button"
                onClick={() => handleSampleQuestion(getRandomQuestion())}
                className="wj-ghost-btn flex-1"
              >
                surprise me
              </button>
              <button
                type="button"
                onClick={() => setShowParentPanel((current) => !current)}
                className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-white/5 text-[var(--wj-ivory)] transition hover:bg-white/10"
                style={{
                  boxShadow: 'inset 0 0 0 1px rgba(246,238,221,0.18)',
                }}
                aria-label="Open parent controls"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2v2" />
                  <path d="M12 20v2" />
                  <path d="m4.93 4.93 1.41 1.41" />
                  <path d="m17.66 17.66 1.41 1.41" />
                  <path d="M2 12h2" />
                  <path d="M20 12h2" />
                  <path d="m6.34 17.66-1.41 1.41" />
                  <path d="m19.07 4.93-1.41 1.41" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </form>
    </section>
  );
}
