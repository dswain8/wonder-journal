import { KidProfile } from '@/lib/types';
import { WONDER_GUIDES } from '@/lib/wonderGuides';

interface JourneyMapProps {
  profile: KidProfile;
}

export default function JourneyMap({ profile }: JourneyMapProps) {
  const guide = WONDER_GUIDES[profile.guide];

  const steps = [
    {
      step: '01',
      lane: 'Parent',
      title: 'Create the child profile',
      detail: `Set the child name, age, and story lead so the app feels personal from the first screen.`,
    },
    {
      step: '02',
      lane: 'Parent',
      title: `Choose ${guide.name} as the guide`,
      detail: `${guide.name} becomes the emotional guide for the product and frames how curiosity feels in the signed-in experience.`,
    },
    {
      step: '03',
      lane: 'Child',
      title: 'Open straight into the wonder stage',
      detail: `${profile.childName || 'Your child'} sees one magical action on the home screen: ask a question with the wand.`,
    },
    {
      step: '04',
      lane: 'Together',
      title: 'Watch the answer bloom into a story',
      detail: `The app listens, animates the transition, reveals a story scene, and ends with one new wonder to keep the moment going.`,
    },
    {
      step: '05',
      lane: 'Parent',
      title: 'Save and revisit in the journal',
      detail: `The story drops into the journal automatically so bedtime rereads and repeat questions feel easy.`,
    },
  ];

  return (
    <section
      id="journey"
      className="mx-auto mt-14 max-w-5xl rounded-[2.4rem] border border-[#e1d3c2] bg-[#fffaf2]/96 p-6 shadow-panel md:p-8"
    >
      <p className="text-xs font-bold uppercase tracking-[0.28em] text-honey-700">
        End-to-end journey
      </p>
      <div className="mt-4 max-w-3xl">
        <h2 className="font-[family-name:var(--font-fredoka)] text-3xl font-semibold tracking-tight text-midnight-800 md:text-4xl">
          From parent setup to a saved story
        </h2>
        <p className="mt-3 text-lg leading-8 text-[#7c6547]">
          This is the product journey we are prototyping now: setup happens
          quietly, the child-facing home stays simple, and every answer flows
          into a story reveal plus journal save.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-5">
        {steps.map((item) => (
          <article
            key={item.step}
            className="rounded-[1.8rem] border border-[#e6d8c5] bg-white/85 p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-2xl font-black text-[#5a2d74]">
                {item.step}
              </span>
              <span className="rounded-full bg-[#fff1da] px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-honey-700">
                {item.lane}
              </span>
            </div>
            <h3 className="mt-4 text-xl font-bold leading-7 text-midnight-800">
              {item.title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-[#7c6547]">
              {item.detail}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
