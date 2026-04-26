'use client';

import { KidProfile, StoryLead } from '@/lib/types';
import { WONDER_GUIDE_LIST, WONDER_GUIDES } from '@/lib/wonderGuides';

const AGE_OPTIONS = [3, 4, 5, 6];

const STORY_LEAD_OPTIONS: {
  id: StoryLead;
  label: string;
  detail: string;
}[] = [
  {
    id: 'girl',
    label: 'Girl lead',
    detail: 'Stories center a girl hero.',
  },
  {
    id: 'boy',
    label: 'Boy lead',
    detail: 'Stories center a boy hero.',
  },
  {
    id: 'neutral',
    label: 'Flexible',
    detail: 'Stories keep the child framing broad.',
  },
];

interface FamilySetupProps {
  profile: KidProfile;
  onChange: (profile: KidProfile) => void;
}

export default function FamilySetup({
  profile,
  onChange,
}: FamilySetupProps) {
  const activeGuide = WONDER_GUIDES[profile.guide];

  return (
    <section className="mx-auto mt-14 max-w-5xl rounded-[2.4rem] border border-[#e4d3bf] bg-[#fffaf2]/96 p-6 shadow-panel md:p-8">
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-honey-700">
          Step 1 · Family setup
        </p>
        <h2 className="mt-4 font-[family-name:var(--font-fredoka)] text-3xl font-semibold tracking-tight text-midnight-800 md:text-4xl">
          Make Wonder Journal feel like your child&apos;s own world
        </h2>
        <p className="mt-3 text-lg leading-8 text-[#7c6547]">
          This is the parent-side setup flow. It chooses the child profile,
          the story lead, and the guide who shapes the emotional tone of the
          app after sign-in.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-[#ead8c0] bg-white/70 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-honey-700">
            Child profile
          </p>

          <div className="mt-5">
            <label className="text-sm font-semibold text-midnight-800">
              Child name
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
              className="mt-2 min-h-14 w-full rounded-[1.25rem] border border-[#decfba] bg-[#fffdf9] px-4 text-lg text-storyink outline-none transition focus:border-[#6e2483]"
            />
          </div>

          <div className="mt-5">
            <p className="text-sm font-semibold text-midnight-800">Age</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {AGE_OPTIONS.map((age) => (
                <button
                  key={age}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...profile,
                      childAge: age,
                    })
                  }
                  className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                    profile.childAge === age
                      ? 'bg-[#2a1837] text-white shadow-md'
                      : 'bg-[#fff3df] text-[#6f4c2a] hover:bg-[#ffe9c4]'
                  }`}
                >
                  {age} years
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <p className="text-sm font-semibold text-midnight-800">
              Story lead
            </p>
            <div className="mt-3 grid gap-3">
              {STORY_LEAD_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...profile,
                      storyLead: option.id,
                    })
                  }
                  className={`rounded-[1.4rem] border px-4 py-4 text-left transition ${
                    profile.storyLead === option.id
                      ? 'border-[#6e2483] bg-[#f7f1ff] shadow-sm'
                      : 'border-[#e5d7c4] bg-[#fffdf8] hover:border-[#cfb898]'
                  }`}
                >
                  <p className="font-bold text-midnight-800">{option.label}</p>
                  <p className="mt-1 text-sm leading-6 text-[#7c6547]">
                    {option.detail}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-[1.6rem] bg-[#fff2dc] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-honey-700">
              Signed-in preview
            </p>
            <p className="mt-2 text-lg font-semibold text-midnight-800">
              {profile.childName || 'Your child'}, age {profile.childAge}
            </p>
            <p className="mt-1 text-sm leading-6 text-[#7c6547]">
              The home screen will open straight into the kid-facing question
              stage, guided by {activeGuide.name}.
            </p>
          </div>
        </div>

        <div className="rounded-[2rem] border border-[#ead8c0] bg-[linear-gradient(180deg,#fffefc_0%,#fff6ea_100%)] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-honey-700">
            Step 2 · Choose the guide
          </p>
          <div className="mt-4 grid gap-4">
            {WONDER_GUIDE_LIST.map((guide) => {
              const isActive = profile.guide === guide.id;

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
                  className={`rounded-[1.8rem] border p-5 text-left transition ${
                    isActive
                      ? 'border-[#6e2483] bg-white shadow-md'
                      : 'border-[#ead8c0] bg-white/80 hover:border-[#cfb898]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] ${guide.palette.chip}`}
                      >
                        {guide.shortLabel}
                      </span>
                      <h3 className="mt-3 font-[family-name:var(--font-fredoka)] text-2xl font-semibold text-midnight-800">
                        {guide.name}
                      </h3>
                    </div>
                    <span
                      className={`mt-1 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] ${
                        isActive
                          ? 'bg-[#2a1837] text-white'
                          : 'bg-[#f6edff] text-[#6e2483]'
                      }`}
                    >
                      {isActive ? 'Selected' : 'Choose'}
                    </span>
                  </div>

                  <p className="mt-4 text-base leading-7 text-[#533d4d]">
                    {guide.childLine}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[#7c6547]">
                    {guide.importance}
                  </p>
                  <p className="mt-3 text-sm font-medium text-[#875f38]">
                    {guide.sourceLine}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
