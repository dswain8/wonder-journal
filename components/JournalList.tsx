import Image from 'next/image';
import Link from 'next/link';
import { Story } from '@/lib/types';

const CATEGORY_GRADIENTS: Record<string, { sky: string; foreground: string }> = {
  animals: {
    sky: 'linear-gradient(180deg, #0f4a4a 0%, #1f6b6b 68%, #89c28a 100%)',
    foreground: '#10312d',
  },
  space: {
    sky: 'linear-gradient(180deg, #2a2f6b 0%, #5b2a6b 68%, #8e4412 100%)',
    foreground: '#160f22',
  },
  nature: {
    sky: 'linear-gradient(180deg, #1d432b 0%, #49724d 62%, #d7bb84 100%)',
    foreground: '#172417',
  },
  body: {
    sky: 'linear-gradient(180deg, #5b2a6b 0%, #c2667c 62%, #ffd5af 100%)',
    foreground: '#3c1532',
  },
  food: {
    sky: 'linear-gradient(180deg, #6d2f1f 0%, #dc7b45 62%, #ffd9a3 100%)',
    foreground: '#452214',
  },
  weather: {
    sky: 'linear-gradient(180deg, #28436c 0%, #5c86bf 62%, #bfe4ff 100%)',
    foreground: '#1a3247',
  },
  ocean: {
    sky: 'linear-gradient(180deg, #133958 0%, #1e82a2 62%, #9ae5eb 100%)',
    foreground: '#0f2940',
  },
  transport: {
    sky: 'linear-gradient(180deg, #272c60 0%, #6d65b6 58%, #ecc7a8 100%)',
    foreground: '#1c2144',
  },
  colors: {
    sky: 'linear-gradient(180deg, #5a2b75 0%, #b55aa0 58%, #ffd58e 100%)',
    foreground: '#31173d',
  },
  wonder: {
    sky: 'linear-gradient(180deg, #2d1a4a 0%, #6d49a5 58%, #f9c677 100%)',
    foreground: '#1b1231',
  },
};

function SceneThumb({ category }: { category?: string | null }) {
  const theme = CATEGORY_GRADIENTS[category ?? 'wonder'] ?? CATEGORY_GRADIENTS.wonder;

  return (
    <div
      className="relative h-[74px] w-[74px] overflow-hidden rounded-[16px]"
      style={{
        background: theme.sky,
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)',
      }}
    >
      <div className="absolute right-3 top-3 h-[18px] w-[18px] rounded-full bg-[radial-gradient(circle_at_35%_35%,#fff3d2,#f3c056)] shadow-[0_0_10px_rgba(243,192,86,0.5)]" />
      <div
        className="absolute bottom-0 left-0 right-0 h-7"
        style={{ background: theme.foreground }}
      />
    </div>
  );
}

export default function JournalList({ stories }: { stories: Story[] }) {
  return (
    <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
      {stories.map((story) => (
        <Link
          key={story.id}
          href={`/journal/${story.id}`}
          className="block rounded-[22px] bg-white/5 p-4 text-left transition hover:bg-white/[0.07]"
          style={{
            boxShadow: 'inset 0 0 0 1px rgba(246,238,221,0.12)',
          }}
        >
          <div className="flex gap-3">
            <div className="relative h-[74px] w-[74px] shrink-0 overflow-hidden rounded-[16px]">
              {story.image_path ? (
                <Image
                  src={story.image_path}
                  alt={story.story_title}
                  fill
                  unoptimized={story.image_path.endsWith('.svg')}
                  className="object-cover"
                  sizes="74px"
                />
              ) : (
                <SceneThumb category={story.image_category} />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--wj-marigold)]">
                  {story.image_category ?? 'wonder'}
                </span>
                <span className="text-[11px] text-white/40">
                  · {new Date(story.created_at).toLocaleDateString()}
                </span>
              </div>

              <h3 className="wj-display line-clamp-2 text-[18px] leading-[1.22] text-[var(--wj-ivory)]">
                &ldquo;{story.question}&rdquo;
              </h3>
              <p className="mt-2 line-clamp-2 text-[12.5px] leading-[1.35] text-white/60">
                {story.story_title}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
