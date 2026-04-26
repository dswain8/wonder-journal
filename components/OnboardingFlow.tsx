'use client';

import { useMemo, useState } from 'react';
import { AppProfile } from '@/lib/types';
import { WONDER_GUIDE_LIST, WONDER_GUIDES } from '@/lib/wonderGuides';
import { FireflyDot } from './WonderDecor';
import WonderGuideAvatar from './WonderGuideAvatar';

type OnboardingScreen = 'welcome' | 'setup' | 'guide' | 'ready';
type SetupStep = 0 | 1 | 2;

interface OnboardingFlowProps {
  profile: AppProfile;
  onChange: (profile: AppProfile) => void;
  onComplete: () => void;
}

const FIREFLIES = [
  { left: '14%', top: '16%', size: 8 },
  { left: '73%', top: '21%', size: 6 },
  { left: '84%', top: '34%', size: 10 },
  { left: '12%', top: '40%', size: 7 },
  { left: '57%', top: '18%', size: 5 },
  { left: '76%', top: '63%', size: 6 },
  { left: '18%', top: '72%', size: 8 },
  { left: '46%', top: '56%', size: 5 },
];

export default function OnboardingFlow({
  profile,
  onChange,
  onComplete,
}: OnboardingFlowProps) {
  const [screen, setScreen] = useState<OnboardingScreen>('welcome');
  const [setupStep, setSetupStep] = useState<SetupStep>(0);

  const activeGuide = WONDER_GUIDES[profile.guide];

  const canContinueSetup = useMemo(() => {
    if (setupStep === 0) {
      return profile.parentName.trim().length > 1;
    }

    if (setupStep === 1) {
      return profile.childName.trim().length > 1;
    }

    return profile.childAge >= 3 && profile.childAge <= 6;
  }, [profile.childAge, profile.childName, profile.parentName, setupStep]);

  const requestMicrophone = async () => {
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      onChange({
        ...profile,
        micPermission: 'unsupported',
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      onChange({
        ...profile,
        micPermission: 'granted',
      });
    } catch {
      onChange({
        ...profile,
        micPermission: 'denied',
      });
    }
  };

  const ageChoices = [3, 4, 5, 6];

  return (
    <section className="mx-auto flex min-h-[calc(100svh-2.5rem)] w-full max-w-[420px] items-center">
      <div className="wj-screen relative min-h-[760px]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(600px_400px_at_50%_0%,rgba(232,164,60,0.14),transparent_60%),radial-gradient(500px_400px_at_50%_100%,rgba(91,42,107,0.45),transparent_60%)]" />
          <div className="absolute right-[-1.75rem] top-14 h-32 w-32 rounded-full bg-[radial-gradient(circle_at_35%_35%,#ffe9b8,#e8b77a_70%,transparent_72%)] opacity-65 shadow-[0_0_80px_rgba(255,233,184,0.22)]" />
          {FIREFLIES.map((firefly, index) => (
            <div
              key={`${firefly.left}-${firefly.top}`}
              className="absolute"
              style={{
                left: firefly.left,
                top: firefly.top,
                animation: `wj-twinkle ${2 + index * 0.3}s ease-in-out infinite ${
                  index * 0.18
                }s`,
              }}
            >
              <FireflyDot size={firefly.size} />
            </div>
          ))}
        </div>

        {screen === 'welcome' ? (
          <div className="relative flex min-h-[760px] flex-col justify-end px-7 pb-9 pt-10 text-center">
            <div className="absolute left-0 right-0 top-40 flex items-center justify-center">
              <div className="mr-[-1.9rem] translate-y-3">
                <WonderGuideAvatar
                  guide="gargi"
                  size="lg"
                  expression="calm"
                  floating
                  glow
                />
              </div>
              <div className="ml-[-1.9rem]">
                <WonderGuideAvatar
                  guide="nachi"
                  size="lg"
                  expression="curious"
                  floating
                  glow
                />
              </div>
            </div>

            <p className="wj-caveat text-[22px] font-semibold text-[var(--wj-marigold)]">
              welcome, wonderer
            </p>
            <h1 className="wj-display mt-1 text-[44px] leading-[1.02] text-[var(--wj-ivory)]">
              Wonder
              <br />
              Journal
            </h1>
            <p className="mx-auto mt-4 max-w-[17rem] text-[15.5px] leading-[1.45] text-[var(--wj-muted)]">
              A gentle place for little questions and the stories they deserve.
            </p>

            <button
              type="button"
              onClick={() => setScreen('setup')}
              className="wj-primary-btn mt-6 w-full"
            >
              Begin · Parent setup
            </button>
            <p className="mt-3 text-xs text-white/45">
              a parent will help set this up
            </p>
          </div>
        ) : null}

        {screen === 'setup' ? (
          <div className="relative flex min-h-[760px] flex-col px-7 pb-8 pt-4">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((step) => (
                <div
                  key={step}
                  className="h-[3px] flex-1 rounded-full"
                  style={{
                    backgroundColor:
                      step <= setupStep
                        ? 'var(--wj-marigold)'
                        : 'rgba(246,238,221,0.18)',
                  }}
                />
              ))}
            </div>

            <div className="mt-6">
              <p className="wj-overline">A few details · for the parent</p>
              <h2 className="wj-display mt-3 text-[30px] leading-[1.08] text-[var(--wj-ivory)]">
                {setupStep === 0 ? (
                  <>
                    Let us know
                    <br />
                    who you are.
                  </>
                ) : null}
                {setupStep === 1 ? (
                  <>
                    Who will be
                    <br />
                    asking the questions?
                  </>
                ) : null}
                {setupStep === 2 ? (
                  <>
                    And how many
                    <br />
                    candles so far?
                  </>
                ) : null}
              </h2>
            </div>

            <div className="absolute right-[-0.75rem] top-16">
              <WonderGuideAvatar
                guide="gargi"
                size="md"
                expression="curious"
                floating
              />
            </div>

            <div className="mt-12 flex flex-1 flex-col justify-start">
              {setupStep === 0 ? (
                <div>
                  <label className="wj-caveat text-[22px] text-[var(--wj-marigold)]">
                    your name
                  </label>
                  <input
                    type="text"
                    value={profile.parentName}
                    onChange={(event) =>
                      onChange({
                        ...profile,
                        parentName: event.target.value,
                      })
                    }
                    placeholder="e.g. Priya"
                    className="wj-input-line mt-2"
                  />
                </div>
              ) : null}

              {setupStep === 1 ? (
                <div>
                  <label className="wj-caveat text-[22px] text-[var(--wj-marigold)]">
                    your child&apos;s name
                  </label>
                  <input
                    type="text"
                    value={profile.childName}
                    onChange={(event) =>
                      onChange({
                        ...profile,
                        childName: event.target.value,
                      })
                    }
                    placeholder="e.g. Aanya"
                    className="wj-input-line mt-2"
                  />
                </div>
              ) : null}

              {setupStep === 2 ? (
                <div>
                  <label className="wj-caveat text-[22px] text-[var(--wj-marigold)]">
                    their age
                  </label>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {ageChoices.map((age) => {
                      const selected = profile.childAge === age;

                      return (
                        <button
                          key={age}
                          type="button"
                          onClick={() =>
                            onChange({
                              ...profile,
                              childAge: age,
                            })
                          }
                          className="aspect-[1/1.05] rounded-[22px] text-[30px] transition"
                          style={{
                            fontFamily: 'var(--font-display)',
                            background: selected
                              ? 'linear-gradient(180deg, #f2b85a 0%, #e19424 100%)'
                              : 'rgba(255,255,255,0.06)',
                            color: selected ? '#3a1a0a' : 'var(--wj-ivory)',
                            boxShadow: selected
                              ? '0 10px 22px rgba(226,148,36,0.38), inset 0 1px 0 rgba(255,255,255,0.5)'
                              : 'inset 0 0 0 1px rgba(246,238,221,0.18)',
                          }}
                        >
                          {age}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-4 text-[13px] text-[var(--wj-subtle)]">
                    We shape answers gently for their age.
                  </p>
                </div>
              ) : null}
            </div>

            <div className="mt-auto flex gap-2 pb-1">
              {setupStep > 0 ? (
                <button
                  type="button"
                  onClick={() => setSetupStep((current) => (current - 1) as SetupStep)}
                  className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-white/5 text-[22px] text-[var(--wj-ivory)]"
                  style={{
                    boxShadow: 'inset 0 0 0 1px rgba(246,238,221,0.18)',
                  }}
                >
                  ←
                </button>
              ) : null}
              <button
                type="button"
                disabled={!canContinueSetup}
                onClick={() => {
                  if (setupStep < 2) {
                    setSetupStep((current) => (current + 1) as SetupStep);
                    return;
                  }

                  setScreen('guide');
                }}
                className="wj-primary-btn flex-1"
              >
                {setupStep < 2
                  ? 'Continue'
                  : `Meet ${profile.childName.trim() || 'your child'}'s guide →`}
              </button>
            </div>
          </div>
        ) : null}

        {screen === 'guide' ? (
          <div className="relative flex min-h-[760px] flex-col px-5 pb-8 pt-6">
            <div className="px-2">
              <p className="wj-overline">Choose a companion</p>
              <h2 className="wj-display mt-2 text-[30px] leading-[1.06] text-[var(--wj-ivory)]">
                Two keepers of
                <br />
                curiosity.
              </h2>
              <p className="mt-3 text-[13.5px] leading-[1.45] text-[var(--wj-muted)]">
                They&apos;ll walk with {profile.childName.trim() || 'your child'} from
                question to story. You can switch any time.
              </p>
            </div>

            <div className="mt-5 flex flex-1 flex-col gap-3">
              {WONDER_GUIDE_LIST.map((guide) => {
                const selected = guide.id === profile.guide;

                return (
                  <button
                    key={guide.id}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...profile,
                        guide: guide.id,
                      })
                    }
                    className="relative overflow-hidden rounded-[26px] px-4 py-4 text-left transition"
                    style={{
                      background: `linear-gradient(160deg, ${
                        guide.id === 'gargi' ? '#1f6b6b' : '#8e4412'
                      }, ${guide.id === 'gargi' ? '#0e3a3a' : '#5b2a0b'})`,
                      boxShadow: selected
                        ? '0 0 0 2.5px #f3c056, 0 20px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.2)'
                        : '0 14px 28px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.15)',
                      transform: selected ? 'translateY(-3px)' : 'translateY(0)',
                    }}
                  >
                    <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(255,243,210,0.2),transparent_70%)]" />
                    {selected ? (
                      <div className="absolute right-3 top-3 rounded-full bg-[var(--wj-marigold)] px-2 py-1 text-[11px] font-extrabold tracking-[0.04em] text-[#3a1a0a]">
                        ✓ CHOSEN
                      </div>
                    ) : null}

                    <div className="flex gap-3">
                      <div className="flex-1 pr-2">
                        <p className="wj-caveat text-[18px] text-[#fff3d2]">
                          {guide.shortLabel.toLowerCase()}
                        </p>
                        <h3 className="wj-display text-[28px] leading-none text-[var(--wj-ivory)]">
                          {guide.name}
                        </h3>
                        <p className="mt-2 text-[13px] leading-[1.35] text-white/80">
                          {guide.childLine}
                        </p>
                        <div className="mt-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold tracking-[0.06em] text-[#fff3d2]">
                          {guide.id === 'gargi'
                            ? 'CALM · BRAVE · WISE'
                            : 'WARM · CURIOUS · BRIGHT'}
                        </div>
                        <p className="mt-3 text-[11px] leading-5 text-white/58">
                          {guide.importance}
                        </p>
                      </div>

                      <div className="self-start">
                        <WonderGuideAvatar
                          guide={guide.id}
                          size="md"
                          expression={guide.id === 'gargi' ? 'calm' : 'curious'}
                          floating={selected}
                          glow
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-auto pb-1">
              <button
                type="button"
                onClick={() => setScreen('ready')}
                className="wj-primary-btn w-full"
              >
                Journey with {activeGuide.name}
              </button>
              <p className="mt-3 text-center text-xs text-white/45">
                inspired by ancient seekers · made gentle for little hands
              </p>
            </div>
          </div>
        ) : null}

        {screen === 'ready' ? (
          <div className="relative flex min-h-[760px] flex-col px-7 pb-9 pt-7 text-center">
            <div
              className="pointer-events-none absolute left-1/2 top-32 h-72 w-72 -translate-x-1/2 rounded-full wj-pulse"
              style={{
                background:
                  profile.guide === 'nachi'
                    ? 'radial-gradient(circle, rgba(232,154,42,0.34), transparent 62%)'
                    : 'radial-gradient(circle, rgba(43,133,133,0.34), transparent 62%)',
              }}
            />

            <p className="wj-caveat text-[22px] text-[var(--wj-marigold)]">
              a tiny ritual
            </p>
            <h2 className="wj-display mt-1 text-[30px] leading-[1.08] text-[var(--wj-ivory)]">
              Can {activeGuide.name} hear
              <br />
              {profile.childName.trim() || 'your child'}?
            </h2>

            <div className="relative mt-8 flex justify-center">
              <WonderGuideAvatar
                guide={profile.guide}
                size="lg"
                expression="curious"
                floating
                glow
              />
            </div>

            <div className="wj-parchment relative mt-6 rounded-[24px] px-5 py-5 text-left">
              <p className="wj-caveat text-[20px] text-[var(--wj-terracotta)]">
                one little promise
              </p>
              <p className="mt-2 text-[18px] font-semibold leading-7 text-[var(--wj-ink)]">
                I can listen when there&apos;s a question. May I?
              </p>
              <p className="mt-3 text-[14px] leading-6 text-[var(--wj-ink-soft)]">
                Wonder Journal only listens after the wand is tapped. A parent
                can type instead, skip for now, or come back later.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={requestMicrophone}
                className="wj-primary-btn w-full"
              >
                Turn on listening
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...profile,
                    micPermission: 'idle',
                  })
                }
                className="wj-ghost-btn w-full"
              >
                Maybe later
              </button>
            </div>

            <p className="mt-4 text-[11px] leading-5 text-white/45">
              We only listen when you tap the wand. Parent can pause any time.
            </p>

            <div className="mt-auto pt-8">
              <button
                type="button"
                onClick={onComplete}
                className="wj-primary-btn w-full"
              >
                Start wondering
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
