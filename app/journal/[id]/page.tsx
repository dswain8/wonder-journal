'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import DesktopStage from '@/components/DesktopStage';
import StoryCard from '@/components/StoryCard';
import { APP_PROFILE_STORAGE_KEY } from '@/lib/appProfile';
import { AppProfile, Story } from '@/lib/types';

function parseSceneTags(value: string | null): string[] | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((tag): tag is string => typeof tag === 'string')
      : null;
  } catch {
    return null;
  }
}

export default function StoryDetailPage() {
  const params = useParams<{ id: string }>();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AppProfile | null>(null);

  useEffect(() => {
    try {
      const rawProfile = window.localStorage.getItem(APP_PROFILE_STORAGE_KEY);
      setProfile(rawProfile ? (JSON.parse(rawProfile) as AppProfile) : null);
    } catch {
      setProfile(null);
    }

    fetch(`/api/stories/${params.id}`)
      .then((response) => response.json())
      .then((data) => {
        setStory(data?.id ? (data as Story) : null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <DesktopStage
        eyebrow="saved answer"
        title="Opening a saved wonder."
        description="A journal entry should feel calm, readable, and worth returning to later."
      >
        <section className="mx-auto flex min-h-[calc(100svh-2.5rem)] w-full max-w-[420px] items-center">
          <div className="wj-screen flex min-h-[760px] items-center justify-center px-6 text-center">
            <div>
              <p className="wj-caveat text-[22px] text-[var(--wj-marigold)]">
                opening the keepsake…
              </p>
              <p className="mt-3 text-sm text-[var(--wj-muted)]">Loading the saved story.</p>
            </div>
          </div>
        </section>
      </DesktopStage>
    );
  }

  if (!story) {
    return (
      <DesktopStage
        eyebrow="saved answer"
        title="That story is missing."
        description="If an old link no longer works, the app should explain it gently and help the family return to the journal."
      >
        <section className="mx-auto flex min-h-[calc(100svh-2.5rem)] w-full max-w-[420px] items-center">
          <div className="wj-screen flex min-h-[760px] flex-col items-center justify-center px-6 text-center">
            <p className="wj-caveat text-[22px] text-[var(--wj-marigold)]">
              this one slipped away
            </p>
            <p className="mt-3 text-sm text-[var(--wj-muted)]">We couldn&apos;t find that saved story.</p>
            <Link href="/journal" className="wj-primary-btn mt-6">
              Back to journal
            </Link>
          </div>
        </section>
      </DesktopStage>
    );
  }

  return (
    <DesktopStage
      eyebrow="saved answer"
      title="A saved wonder for later."
      description="The answer should still scan well after the moment has passed."
      notes={[
        { label: 'Question', value: story.question },
        { label: 'Saved on', value: new Date(story.created_at).toLocaleString() },
      ]}
      checklist={[
        'Does the answer still scan well out of context?',
        'Would a parent share or reread this later?',
      ]}
    >
      <div>
        <div className="mx-auto mb-4 flex w-full max-w-[420px] items-center justify-between px-1">
          <Link
            href="/journal"
            className="flex h-[38px] w-[38px] items-center justify-center rounded-[12px] bg-white/5 text-[18px] text-[var(--wj-ivory)]"
            style={{
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.14)',
            }}
            aria-label="Back to journal"
          >
            ←
          </Link>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">
            Saved story
          </p>
          <div className="w-[38px]" />
        </div>

        <StoryCard
          title={story.story_title}
          story={story.story_text}
          imageUrl={story.image_path}
          question={story.question}
          factAnswer={story.fact_answer}
          narrationText={story.narration_text}
          sceneTags={parseSceneTags(story.scene_tags)}
          source={story.answer_source}
          qualityScore={story.quality_score}
          topic={story.image_category ?? 'wonder'}
          childName={story.child_name}
          guide={profile?.guide ?? 'gargi'}
        />
      </div>
    </DesktopStage>
  );
}
