'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DesktopStage from '@/components/DesktopStage';
import OnboardingFlow from '@/components/OnboardingFlow';
import QuestionInput from '@/components/QuestionInput';
import StoryCard from '@/components/StoryCard';
import StoryLoading from '@/components/StoryLoading';
import { APP_PROFILE_EVENT, APP_PROFILE_STORAGE_KEY } from '@/lib/appProfile';
import { AppProfile, GenerateResponse } from '@/lib/types';
import { DEFAULT_APP_PROFILE } from '@/lib/wonderGuides';

const SAMPLE_QUESTIONS = [
  'Why does the moon follow our car?',
  'Why do peacocks dance in the rain?',
  'Why do stars twinkle?',
  'Where does the rain go after a storm?',
];

function sanitizeProfile(profile: AppProfile): AppProfile {
  return {
    parentName: profile.parentName.trim().slice(0, 32) || DEFAULT_APP_PROFILE.parentName,
    childName: profile.childName.trim().slice(0, 24) || DEFAULT_APP_PROFILE.childName,
    childAge:
      profile.childAge >= 3 && profile.childAge <= 8
        ? profile.childAge
        : DEFAULT_APP_PROFILE.childAge,
    storyLead:
      profile.storyLead === 'boy' ||
      profile.storyLead === 'neutral' ||
      profile.storyLead === 'girl'
        ? profile.storyLead
        : DEFAULT_APP_PROFILE.storyLead,
    guide:
      profile.guide === 'nachi' || profile.guide === 'gargi'
        ? profile.guide
        : DEFAULT_APP_PROFILE.guide,
    onboardingComplete: Boolean(profile.onboardingComplete),
    micPermission:
      profile.micPermission === 'granted' ||
      profile.micPermission === 'denied' ||
      profile.micPermission === 'unsupported'
        ? profile.micPermission
        : 'idle',
  };
}

export default function Home() {
  const [profile, setProfile] = useState<AppProfile>(DEFAULT_APP_PROFILE);
  const [isLoading, setIsLoading] = useState(false);
  const [story, setStory] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeQuestion, setActiveQuestion] = useState('');
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    try {
      const rawProfile = window.localStorage.getItem(APP_PROFILE_STORAGE_KEY);

      if (rawProfile) {
        setProfile(sanitizeProfile(JSON.parse(rawProfile) as AppProfile));
      }
    } catch {
      window.localStorage.removeItem(APP_PROFILE_STORAGE_KEY);
    } finally {
      setHasHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    const nextProfile = sanitizeProfile(profile);
    window.localStorage.setItem(APP_PROFILE_STORAGE_KEY, JSON.stringify(nextProfile));
    window.dispatchEvent(new Event(APP_PROFILE_EVENT));
  }, [hasHydrated, profile]);

  const handleAsk = async (question: string) => {
    setIsLoading(true);
    setError(null);
    setStory(null);
    setActiveQuestion(question);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          childName: profile.childName,
          childAge: profile.childAge,
          storyLead: profile.storyLead,
          guide: profile.guide,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorData = data as { error?: string };
        setError(errorData.error || 'Something went wrong');
        return;
      }

      setStory(data as GenerateResponse);
    } catch {
      setError('Could not connect. Is Ollama running?');
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasHydrated) {
    return (
      <DesktopStage
        eyebrow="welcome"
        title="Wonder Journal"
        description="A warm curiosity journal that helps a child ask, listen, look, and remember."
        notes={[
          { label: 'Getting ready', value: 'Opening the family journal.' },
        ]}
      >
        <div className="mx-auto min-h-[60vh] max-w-[420px]" />
      </DesktopStage>
    );
  }

  if (!profile.onboardingComplete) {
    return (
      <DesktopStage
        eyebrow="setup"
        title="Make the journal feel like home."
        description="Add the parent and child details once, then choose a curious guide for the child’s questions."
        notes={[
          { label: 'Why this matters', value: 'The answer should feel personal without making the child fill out forms.' },
          { label: 'Guides', value: 'Gargi and Nachi bring an Indian-rooted spirit of curiosity into the experience.' },
        ]}
        checklist={[
          'Does setup feel parent-friendly without becoming form-heavy?',
          'Do the guides feel Indian in spirit without reading as costume characters?',
          'Does this still feel coherent when reviewed on a wide laptop screen?',
        ]}
      >
        <OnboardingFlow
          profile={profile}
          onChange={(nextProfile) => setProfile(sanitizeProfile(nextProfile))}
          onComplete={() =>
            setProfile((currentProfile) =>
              sanitizeProfile({
                ...currentProfile,
                onboardingComplete: true,
              }),
            )
          }
        />
      </DesktopStage>
    );
  }

  if (isLoading) {
    return (
      <DesktopStage
        eyebrow="answer coming"
        title="A little wonder is taking shape."
        description="The app is looking for a simple, warm answer that a child can understand."
        notes={[
          { label: 'Question', value: activeQuestion || 'Waiting for the next wonder.' },
          { label: 'Promise', value: 'Keep the wait calm, visual, and short enough for a child to stay with it.' },
        ]}
        checklist={[
          'Time to first visible loading state',
          'Total wait before the answer screen appears',
          'Whether the waiting screen still feels delightful under real model latency',
        ]}
      >
        <StoryLoading
          childName={profile.childName}
          guide={profile.guide}
          question={activeQuestion}
        />
      </DesktopStage>
    );
  }

  if (story) {
    return (
      <DesktopStage
        eyebrow="answer"
        title="A tiny answer that feels worth keeping."
        description="The child gets the answer first, then a visual clue, a voice moment, and an optional story if the family wants more."
        notes={[
          { label: 'Question', value: story.question },
          { label: 'Reveal mode', value: 'Answer first, then a visual moment, narration, and optional story mode.' },
        ]}
        checklist={[
          'Is the core fact easy to spot before the full story?',
          'Does narration feel worth tapping on desktop and phone?',
          'Would a parent trust this enough to use it repeatedly with a real LLM behind it?',
        ]}
      >
        <div>
          <div className="mx-auto mb-4 flex w-full max-w-[420px] items-center justify-between px-1">
            <button
              type="button"
              onClick={() => {
                setStory(null);
                setError(null);
                setActiveQuestion('');
              }}
              className="flex h-[38px] w-[38px] items-center justify-center rounded-[12px] bg-white/5 text-[18px] text-[var(--wj-ivory)]"
              style={{
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.14)',
              }}
              aria-label="Back home"
            >
              ←
            </button>
            <Link
              href="/journal"
              className="flex h-[38px] w-[38px] items-center justify-center rounded-[12px] bg-white/5 text-[var(--wj-ivory)]"
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

          <StoryCard
            title={story.title}
            story={story.story}
            imageUrl={story.image_url}
            question={story.question}
            factAnswer={story.fact_answer}
            narrationText={story.narration_text}
            sceneTags={story.scene_tags}
            source={story.source}
            qualityScore={story.quality_score}
            topic={story.topic}
            childName={story.child_name}
            guide={profile.guide}
            onAskAnother={() => {
              setStory(null);
              setError(null);
              setActiveQuestion('');
            }}
          />
        </div>
      </DesktopStage>
    );
  }

  return (
    <DesktopStage
      eyebrow="ask"
      title="Do not let a good question disappear."
      description="Ask out loud, type quietly, or pick a starter wonder. The answer becomes something the family can revisit."
      notes={[
        { label: 'Current guide', value: profile.guide === 'nachi' ? 'Nachi · the spark' : 'Gargi · the listener' },
        { label: 'Shape', value: 'Voice first for the child, typed fallback for the parent, and a saved journal for later.' },
      ]}
      checklist={[
        'Laptop: does this feel intentional rather than like a blown-up phone screenshot?',
        'Phone: does the wand remain the clear primary action?',
        'Real Ollama: once you point the app to your running laptop model, does the full loop still feel fast enough?',
      ]}
    >
      <div>
        <QuestionInput
          onSubmit={handleAsk}
          isLoading={isLoading}
          error={error}
          profile={{
            childName: profile.childName,
            childAge: profile.childAge,
            storyLead: profile.storyLead,
            guide: profile.guide,
          }}
          sampleQuestions={SAMPLE_QUESTIONS}
        />
      </div>
    </DesktopStage>
  );
}
