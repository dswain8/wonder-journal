'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnswerSource, WonderGuideId } from '@/lib/types';
import {
  StoryExperience,
  StoryMoment,
  getSpecialStoryExperience,
} from '@/lib/storyExperiences';
import { WONDER_GUIDES } from '@/lib/wonderGuides';

interface StoryCardProps {
  title: string;
  story: string;
  imageUrl: string | null;
  question: string;
  factAnswer?: string | null;
  narrationText?: string | null;
  sceneTags?: string[] | null;
  source?: AnswerSource | null;
  qualityScore?: number | null;
  topic?: string;
  childName?: string;
  guide?: WonderGuideId;
  onAskAnother?: () => void;
}

const TOPIC_SCENES: Record<
  string,
  { label: string; gradient: string; accent: string; foreground: string }
> = {
  animals: {
    label: 'Animal wonder',
    gradient: 'linear-gradient(180deg, #0f4a4a 0%, #1f6b6b 58%, #8fc08b 100%)',
    accent: '#ffe8a3',
    foreground: '#14312f',
  },
  space: {
    label: 'Moonlit sky',
    gradient: 'linear-gradient(180deg, #2a2f6b 0%, #5b2a6b 62%, #8e4412 100%)',
    accent: '#fff0bc',
    foreground: '#0f0d22',
  },
  nature: {
    label: 'Nature trail',
    gradient: 'linear-gradient(180deg, #173b2a 0%, #3d6d4a 56%, #d3bb7c 100%)',
    accent: '#fff0b4',
    foreground: '#182517',
  },
  body: {
    label: 'Body clues',
    gradient: 'linear-gradient(180deg, #5b2a6b 0%, #c2667c 55%, #ffd5af 100%)',
    accent: '#fff4c6',
    foreground: '#3c1532',
  },
  food: {
    label: 'Kitchen wonder',
    gradient: 'linear-gradient(180deg, #6d2f1f 0%, #dc7b45 55%, #ffd9a3 100%)',
    accent: '#fff0be',
    foreground: '#442012',
  },
  weather: {
    label: 'Sky workshop',
    gradient: 'linear-gradient(180deg, #28436c 0%, #5c86bf 58%, #bfe4ff 100%)',
    accent: '#fff0bc',
    foreground: '#17324a',
  },
  ocean: {
    label: 'Ocean world',
    gradient: 'linear-gradient(180deg, #133958 0%, #1e82a2 58%, #9ae5eb 100%)',
    accent: '#fff2ba',
    foreground: '#0f2940',
  },
  transport: {
    label: 'Journey story',
    gradient: 'linear-gradient(180deg, #272c60 0%, #6d65b6 56%, #ecc7a8 100%)',
    accent: '#fff1b5',
    foreground: '#1c2247',
  },
  colors: {
    label: 'Colour magic',
    gradient: 'linear-gradient(180deg, #5a2b75 0%, #b55aa0 56%, #ffd58e 100%)',
    accent: '#fff1b0',
    foreground: '#351844',
  },
  wonder: {
    label: 'Wonder trail',
    gradient: 'linear-gradient(180deg, #2d1a4a 0%, #6d49a5 56%, #f9c677 100%)',
    accent: '#fff2b7',
    foreground: '#1b1231',
  },
};

function normalizeNarrationText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

interface NarrationSentence {
  text: string;
  start: number;
  end: number;
}

function splitNarrationSentences(text: string): NarrationSentence[] {
  const sentences: NarrationSentence[] = [];
  const sentenceRegex = /[^.!?]+[.!?]+|[^.!?]+$/g;
  let match: RegExpExecArray | null;

  while ((match = sentenceRegex.exec(text)) !== null) {
    const raw = match[0];
    const leadingWhitespace = raw.match(/^\s*/)?.[0].length ?? 0;
    const sentenceText = raw.trim();

    if (sentenceText.length === 0) {
      continue;
    }

    const start = match.index + leadingWhitespace;
    sentences.push({
      text: sentenceText,
      start,
      end: start + sentenceText.length,
    });
  }

  return sentences;
}

function findNarrationSentenceIndex(
  sentences: NarrationSentence[],
  charIndex: number,
): number {
  const index = sentences.findIndex(
    (sentence) => charIndex >= sentence.start && charIndex <= sentence.end,
  );

  return index >= 0 ? index : 0;
}

const VOICE_STORAGE_PREFIX = 'wonder-journal:narration-voice';

function getVoiceKey(voice: SpeechSynthesisVoice): string {
  return voice.voiceURI || `${voice.name}|${voice.lang}`;
}

function isEnglishVoice(voice: SpeechSynthesisVoice): boolean {
  return voice.lang.toLowerCase().startsWith('en');
}

function isIndianEnglishVoice(voice: SpeechSynthesisVoice): boolean {
  const name = voice.name.toLowerCase();
  const lang = voice.lang.toLowerCase();

  return (
    lang.startsWith('en-in') ||
    name.includes('india') ||
    name.includes('indian') ||
    name.includes('veena') ||
    name.includes('rishi') ||
    name.includes('heera') ||
    name.includes('prabhat')
  );
}

function describeVoiceFit(voice: SpeechSynthesisVoice | null): string {
  if (!voice) {
    return 'Browser default voice';
  }

  if (isIndianEnglishVoice(voice)) {
    return 'Indian English voice';
  }

  if (voice.lang.toLowerCase().startsWith('en')) {
    return 'English voice';
  }

  return voice.lang || 'System voice';
}

function getVoiceLabel(voice: SpeechSynthesisVoice): string {
  const localLabel = voice.localService ? 'local' : 'network';
  return `${voice.name} · ${voice.lang || 'unknown'} · ${localLabel}`;
}

function getGuideVoiceStorageKey(guide: WonderGuideId): string {
  return `${VOICE_STORAGE_PREFIX}:${guide}`;
}

function scoreVoicePersonaFit(
  voice: SpeechSynthesisVoice,
  guide: WonderGuideId,
): number {
  const name = voice.name.toLowerCase();
  const feminineTokens = [
    'female',
    'veena',
    'heera',
    'lekha',
    'meera',
    'priya',
    'samantha',
    'karen',
    'moira',
    'tessa',
    'fiona',
    'flo',
    'shelley',
    'kathy',
  ];
  const masculineTokens = [
    'male',
    'rishi',
    'prabhat',
    'rohan',
    'kabir',
    'daniel',
    'alex',
    'aaron',
    'fred',
    'grandpa',
  ];

  const hasFeminineToken = feminineTokens.some((token) => name.includes(token));
  const hasMasculineToken = masculineTokens.some((token) => name.includes(token));

  if (guide === 'gargi') {
    return (hasFeminineToken ? 16 : 0) - (hasMasculineToken ? 20 : 0);
  }

  return (hasMasculineToken ? 14 : 0) - (hasFeminineToken ? 12 : 0);
}

function buildNarrationScript({
  story,
  question,
  specialNarration,
}: {
  story: string;
  question: string;
  specialNarration?: string;
}) {
  if (specialNarration) {
    return normalizeNarrationText(specialNarration);
  }

  return normalizeNarrationText(
    `You asked, ${question}. Here is one way to see it. ${story}`,
  );
}

function scoreGuideVoice(
  voice: SpeechSynthesisVoice,
  guide: WonderGuideId,
): number {
  const narration = WONDER_GUIDES[guide].narration;
  const name = voice.name.toLowerCase();
  const lang = voice.lang.toLowerCase();

  let score = 0;

  if (lang.startsWith('en-in')) {
    score += 24;
  } else if (lang.startsWith('en-gb')) {
    score += 8;
  } else if (lang.startsWith('en')) {
    score += 5;
  }

  if (isIndianEnglishVoice(voice)) {
    score += 12;
  }

  if (voice.localService) {
    score += 3;
  }

  score += scoreVoicePersonaFit(voice, guide);

  for (const preferredName of narration.preferredVoiceNames) {
    if (name === preferredName.toLowerCase()) {
      score += 20;
    } else if (name.includes(preferredName.toLowerCase())) {
      score += 14;
    }
  }

  for (const token of narration.preferredVoiceTokens) {
    if (name.includes(token) || lang.includes(token)) {
      score += 6;
    }
  }

  return score;
}

function pickGuideVoice(
  voices: SpeechSynthesisVoice[],
  guide: WonderGuideId,
): SpeechSynthesisVoice | null {
  if (!voices.length) {
    return null;
  }

  const candidates = voices.some(isEnglishVoice) ? voices.filter(isEnglishVoice) : voices;
  let bestVoice: SpeechSynthesisVoice | null = null;
  let bestScore = -Infinity;

  for (const voice of candidates) {
    const score = scoreGuideVoice(voice, guide);
    if (score > bestScore) {
      bestScore = score;
      bestVoice = voice;
    }
  }

  return bestVoice;
}

function playGuideChime(guide: WonderGuideId) {
  if (typeof window === 'undefined') {
    return;
  }

  const AudioContextClass =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioContextClass) {
    return;
  }

  const audioContext = new AudioContextClass();
  const now = audioContext.currentTime;
  const gain = audioContext.createGain();
  const frequencies = guide === 'nachi' ? [523.25, 659.25] : [659.25, 880];

  gain.connect(audioContext.destination);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.16, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.58);

  frequencies.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, now + index * 0.12);
    oscillator.connect(gain);
    oscillator.start(now + index * 0.12);
    oscillator.stop(now + 0.6);
  });

  window.setTimeout(() => {
    void audioContext.close();
  }, 800);
}

function MomentGlyph({ glyph }: { glyph: StoryMoment['glyph'] }) {
  if (glyph === 'trees') {
    return (
      <div className="relative h-12 w-12">
        <div className="absolute left-2 top-6 h-5 w-1 rounded-full bg-[#5e3e1c]" />
        <div className="absolute left-0 top-1 h-7 w-7 rounded-full bg-[#7dc873]" />
        <div className="absolute right-2 top-4 h-6 w-1 rounded-full bg-[#5e3e1c]" />
        <div className="absolute right-0 top-0 h-8 w-8 rounded-full bg-[#9ee08d]" />
      </div>
    );
  }

  if (glyph === 'moon') {
    return (
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full bg-[#ffe08a]" />
        <div className="absolute right-1 top-0 h-10 w-10 rounded-full bg-[#fff6e9]" />
      </div>
    );
  }

  return (
    <div className="relative flex h-12 w-12 items-center justify-center">
      <div className="absolute h-12 w-12 rounded-full border border-[#d1b57e]" />
      <div className="absolute h-6 w-6 rounded-full bg-[#ffc768]" />
      <div className="absolute left-1 top-1 h-2 w-2 rounded-full bg-[#6d49a5]" />
      <div className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-[#6d49a5]" />
    </div>
  );
}

const TRY_THIS_PROMPTS: Record<string, string> = {
  animals: 'Look for one animal nearby or in a book. What is one clue its body gives you about how it lives?',
  space: 'Tonight, look at one close thing and one faraway thing. Move your head slowly and see which one seems to move more.',
  nature: 'Pick one leaf, flower, seed, or stone. Look closely and tell each other one tiny detail you did not notice before.',
  body: 'Put a hand on your chest, then do ten little jumps. What changed?',
  food: 'Smell one food before tasting it. Does your nose give your tongue a clue?',
  weather: 'Look out of the window and name three sky clues: cloud, wind, light, or color.',
  ocean: 'Fill a bowl with water and gently blow across it. Can you make tiny waves?',
  transport: 'Roll a toy, a ball, or a pencil. What shape helps it move?',
  colors: 'Hold something colorful near sunlight. Where do you see the brightest color?',
  wonder: 'Pick one thing in the room and ask: what is it made of, and why is it shaped that way?',
};

function getTryThisPrompt(topic: string, specialExperience: StoryExperience | null): string {
  if (specialExperience?.key === 'moon-car') {
    return 'Next time you are in a car, look at a nearby pole and then the moon. The pole jumps away fast. The moon looks steady. That is the clue.';
  }

  return TRY_THIS_PROMPTS[topic] ?? TRY_THIS_PROMPTS.wonder;
}

function QuickClueCards({ moments }: { moments: StoryMoment[] }) {
  return (
    <section className="mt-4 rounded-[24px] bg-white/6 p-4 text-white shadow-[inset_0_0_0_1px_rgba(246,238,221,0.12)]">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/55">
        Three clues
      </p>
      <div className="mt-4 grid gap-3">
        {moments.map((moment) => (
          <div
            key={moment.title}
            className="flex gap-4 rounded-[18px] bg-white/6 p-4 shadow-[inset_0_0_0_1px_rgba(246,238,221,0.1)]"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px] bg-[#fff5d8]">
              <MomentGlyph glyph={moment.glyph} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--wj-ivory)]">
                {moment.title}
              </h3>
              <p className="mt-1 text-sm leading-6 text-white/68">{moment.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MoonMotionDemo({ moments }: { moments: StoryMoment[] }) {
  const [mode, setMode] = useState<'near' | 'far' | 'both'>('both');
  const modeCopy = {
    near: {
      title: 'Nearby things rush',
      detail: 'Trees and lamp posts are close to the car, so they zip past the window.',
    },
    far: {
      title: 'The moon stays steady',
      detail: 'The moon is very far away, so your car barely changes how you see it.',
    },
    both: {
      title: 'That is the moon trick',
      detail: 'Close things race by. Far things look slow. So the moon feels like it is coming along.',
    },
  }[mode];

  const treeDuration = mode === 'far' ? '6.8s' : '1.45s';
  const moonAnimation = mode === 'near' ? 'wj-slow-drift 8s ease-in-out infinite' : 'wj-moon-glow 3.4s ease-in-out infinite';

  return (
    <section className="mt-4 rounded-[26px] bg-white/7 p-4 shadow-[inset_0_0_0_1px_rgba(246,238,221,0.14)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/50">
            See the trick
          </p>
          <h2 className="wj-display mt-1 text-[22px] leading-tight text-[var(--wj-ivory)]">
            Near vs far
          </h2>
        </div>
        <div className="flex rounded-full bg-black/18 p-1">
          {[
            ['near', 'Near'],
            ['far', 'Far'],
            ['both', 'Both'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value as 'near' | 'far' | 'both')}
              aria-pressed={mode === value}
              className={`rounded-full px-3 py-1.5 text-[11px] font-extrabold transition ${
                mode === value
                  ? 'bg-[var(--wj-marigold)] text-[#351500]'
                  : 'text-white/58'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mt-4 h-[220px] overflow-hidden rounded-[22px] bg-[linear-gradient(180deg,#262f72_0%,#5b2a6b_58%,#8e4412_100%)]">
        <div
          className="absolute right-10 top-8 h-[72px] w-[72px] rounded-full bg-[radial-gradient(circle_at_35%_35%,#fff3d2,#f3c056_68%,#d88728_100%)]"
          style={{ animation: moonAnimation }}
        >
          <div className="absolute left-4 top-4 h-2.5 w-2.5 rounded-full bg-[#a76028]/35" />
          <div className="absolute bottom-5 right-4 h-3.5 w-3.5 rounded-full bg-[#a76028]/25" />
        </div>

        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className="absolute bottom-[54px] h-24 w-16"
            style={{
              left: `${index * 28}%`,
              animation: `wj-road-rush ${treeDuration} linear infinite`,
              animationDelay: `${index * -0.42}s`,
              opacity: mode === 'far' ? 0.45 : 0.95,
            }}
          >
            <div className="absolute bottom-0 left-7 h-16 w-3 rounded-full bg-[#5b3218]" />
            <div className="absolute left-1 top-0 h-14 w-14 rounded-full bg-[#78c873]" />
            <div className="absolute left-8 top-8 h-10 w-10 rounded-full bg-[#a6e58c]" />
          </div>
        ))}

        <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#17122b]/80" />
        <div className="absolute bottom-8 left-0 right-0 h-1 bg-[#f6eedd]/22" />
        <div className="absolute bottom-8 left-1/2 h-1 w-16 rounded-full bg-[#f6eedd]/70" />
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
          <svg width="96" height="52" viewBox="0 0 96 52" fill="none">
            <rect x="12" y="24" width="72" height="18" rx="6" fill="#E19424" />
            <path d="M26 24 L 36 10 H 62 L 74 24 Z" fill="#F3C056" />
            <rect x="38" y="13" width="13" height="10" rx="2" fill="#5BC9C2" opacity="0.85" />
            <rect x="55" y="13" width="13" height="10" rx="2" fill="#5BC9C2" opacity="0.85" />
            <circle cx="28" cy="43" r="7" fill="#100d22" />
            <circle cx="70" cy="43" r="7" fill="#100d22" />
            <circle cx="28" cy="43" r="3" fill="#F6EEDD" />
            <circle cx="70" cy="43" r="3" fill="#F6EEDD" />
          </svg>
        </div>
      </div>

      <div className="mt-4 rounded-[18px] bg-black/16 px-4 py-3 shadow-[inset_0_0_0_1px_rgba(246,238,221,0.1)]">
        <p className="text-sm font-extrabold text-[var(--wj-ivory)]">{modeCopy.title}</p>
        <p className="mt-1 text-sm leading-6 text-white/68">{modeCopy.detail}</p>
      </div>

      <QuickClueCards moments={moments} />
    </section>
  );
}

function PictureCluePanel({
  imageUrl,
  title,
  topic,
  childName,
  sceneTags,
}: {
  imageUrl: string | null;
  title: string;
  topic: string;
  childName?: string;
  sceneTags?: string[] | null;
}) {
  return (
    <section className="mt-4">
      <div>
        {imageUrl ? (
          <div className="relative h-[248px] overflow-hidden rounded-[30px] shadow-[0_18px_36px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.1)]">
            <Image
              src={imageUrl}
              alt={title}
              fill
              unoptimized={imageUrl.endsWith('.svg')}
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 420px"
            />
          </div>
        ) : (
          <TopicScene topic={topic} childName={childName} sceneTags={sceneTags} />
        )}
      </div>
    </section>
  );
}

function TryTogetherCard({ prompt }: { prompt: string }) {
  return (
    <section className="mt-4 rounded-[24px] bg-[#fff4d8] px-5 py-5 text-[var(--wj-ink)] shadow-[0_14px_28px_rgba(0,0,0,0.22),inset_0_0_0_1px_rgba(142,68,18,0.1)]">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--wj-terracotta)]">
        Try this together
      </p>
      <p className="mt-2 text-[15px] font-bold leading-7 text-[var(--wj-ink-soft)]">
        {prompt}
      </p>
    </section>
  );
}

function MoonCarScene({
  label,
  childName,
}: {
  label: string;
  childName?: string;
}) {
  return (
    <div className="relative h-[220px] overflow-hidden rounded-[26px] bg-[linear-gradient(180deg,#2a2f6b_0%,#5b2a6b_60%,#8e4412_100%)] shadow-[0_18px_36px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
      {[
        [20, 24, 1.5],
        [60, 50, 1],
        [110, 30, 1.2],
        [180, 60, 1],
        [240, 24, 1.4],
        [300, 48, 1],
        [280, 90, 1.3],
      ].map(([x, y, r], index) => (
        <div
          key={`${x}-${y}`}
          className="absolute rounded-full bg-[#fff3d2]"
          style={{
            left: x,
            top: y,
            width: Number(r) * 3,
            height: Number(r) * 3,
            boxShadow: '0 0 8px rgba(255,243,210,0.9)',
            opacity: 0.85,
            animation: `wj-twinkle ${1.5 + index * 0.3}s ease-in-out infinite ${
              index * 0.2
            }s`,
          }}
        />
      ))}

      <div className="absolute left-4 top-4 rounded-full bg-black/30 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-[#fff3d2] backdrop-blur-sm">
        {label}
      </div>

      <div className="absolute right-10 top-8 h-[74px] w-[74px] rounded-full bg-[radial-gradient(circle_at_35%_35%,#fff3d2,#f3c056_65%,#e19424_100%)] shadow-[0_0_50px_rgba(243,192,86,0.55)]">
        <div className="absolute left-4 top-4 h-[10px] w-[10px] rounded-full bg-[rgba(180,100,30,0.35)]" />
        <div className="absolute left-[42px] top-[36px] h-[14px] w-[14px] rounded-full bg-[rgba(180,100,30,0.28)]" />
        <div className="absolute left-[18px] top-[50px] h-[7px] w-[7px] rounded-full bg-[rgba(180,100,30,0.3)]" />
      </div>

      <svg
        viewBox="0 0 343 220"
        preserveAspectRatio="none"
        className="absolute bottom-0 h-[130px] w-full"
      >
        <path
          d="M0 130 Q 80 60 180 90 T 343 80 L 343 220 L 0 220 Z"
          fill="#0E2A2A"
          opacity="0.9"
        />
        <path
          d="M0 160 Q 100 110 220 140 T 343 130 L 343 220 L 0 220 Z"
          fill="#1F6B6B"
          opacity="0.85"
        />
        <path
          d="M0 185 Q 120 155 260 180 T 343 170 L 343 220 L 0 220 Z"
          fill="#2B8585"
          opacity="0.9"
        />
        <path d="M160 220 L 180 150 L 210 150 L 260 220 Z" fill="#3A1A0A" opacity="0.7" />
        <path
          d="M185 220 L 193 158 L 198 158 L 208 220"
          stroke="#F3C056"
          strokeWidth="1.5"
          strokeDasharray="4 6"
          fill="none"
        />
      </svg>

      <div className="absolute bottom-[30px] left-[180px]">
        <svg width="60" height="30" viewBox="0 0 60 30" fill="none">
          <rect x="6" y="12" width="48" height="12" rx="3" fill="#E19424" />
          <path d="M14 12 L 18 4 L 42 4 L 48 12 Z" fill="#F3C056" />
          <rect x="18" y="6" width="9" height="6" rx="1" fill="#5BC9C2" opacity="0.8" />
          <rect x="32" y="6" width="9" height="6" rx="1" fill="#5BC9C2" opacity="0.8" />
          <circle cx="16" cy="26" r="4" fill="#1B1738" />
          <circle cx="44" cy="26" r="4" fill="#1B1738" />
          <circle cx="16" cy="26" r="1.8" fill="#F6EEDD" />
          <circle cx="44" cy="26" r="1.8" fill="#F6EEDD" />
        </svg>
      </div>

      <div className="absolute bottom-4 left-4 rounded-full bg-black/30 px-3 py-1 text-xs font-semibold text-white/88">
        {childName ? `${childName}'s moon-window answer` : 'Moon-window answer'}
      </div>
    </div>
  );
}

function TopicScene({
  topic,
  childName,
  sceneTags,
}: {
  topic: string;
  childName?: string;
  sceneTags?: string[] | null;
}) {
  const scene = TOPIC_SCENES[topic] ?? TOPIC_SCENES.wonder;
  const tags = buildVisualTags(topic, sceneTags);

  return (
    <div
      className="relative h-[240px] overflow-hidden rounded-[26px] shadow-[0_18px_36px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]"
      style={{ background: scene.gradient }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_32%)]" />
      <div className="absolute left-4 top-4 rounded-full bg-black/30 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-white/88 backdrop-blur-sm">
        {scene.label}
      </div>
      <div className="absolute right-5 top-5 flex max-w-[11rem] flex-wrap justify-end gap-1.5">
        {tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-black/24 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/72 backdrop-blur-sm"
          >
            {tag.replace(/-/g, ' ')}
          </span>
        ))}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-20" style={{ backgroundColor: scene.foreground, opacity: 0.82 }} />
      <div className="absolute bottom-6 left-6 rounded-full bg-white/12 px-4 py-2 text-sm font-semibold text-white/92 backdrop-blur-sm">
        {childName ? `${childName}'s answer adventure` : 'Answer adventure'}
      </div>
      <div className="absolute left-8 top-14 h-24 w-24 rounded-full bg-white/10 blur-sm" />
      <div className="absolute bottom-10 right-10 h-12 w-28 rounded-full bg-white/8 blur-xl" />

      <div className="absolute left-8 top-20 flex items-end gap-4">
        {tags.slice(0, 4).map((tag, index) => (
          <SceneGlyph
            key={`${tag}-${index}`}
            tag={tag}
            accent={scene.accent}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

function buildVisualTags(topic: string, sceneTags?: string[] | null): string[] {
  const defaults: Record<string, string[]> = {
    animals: ['animal', 'tree', 'sun'],
    space: ['moon', 'stars', 'rocket'],
    nature: ['tree', 'leaf', 'sun'],
    body: ['heart', 'spark', 'body'],
    food: ['bowl', 'steam', 'sun'],
    weather: ['cloud', 'rain', 'sun'],
    ocean: ['wave', 'fish', 'shell'],
    transport: ['car', 'road', 'wheel'],
    colors: ['rainbow', 'paint', 'light'],
    wonder: ['lamp', 'spark', 'book'],
  };
  const normalizedTags = (sceneTags ?? [])
    .map((tag) => tag.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'))
    .filter((tag) => tag.length > 1);

  return Array.from(new Set([...normalizedTags, ...(defaults[topic] ?? defaults.wonder)])).slice(0, 6);
}

function SceneGlyph({
  tag,
  accent,
  index,
}: {
  tag: string;
  accent: string;
  index: number;
}) {
  const normalized = tag.toLowerCase();
  const offset = index % 2 === 0 ? 'translateY(0)' : 'translateY(18px)';

  if (normalized.includes('moon')) {
    return (
      <div className="relative h-16 w-16" style={{ transform: offset }}>
        <div className="absolute inset-0 rounded-full bg-[#ffe39a] shadow-[0_0_28px_rgba(255,227,154,0.54)]" />
        <div className="absolute right-1 top-1 h-12 w-12 rounded-full bg-[#5b2a6b]/55" />
        <div className="absolute left-5 top-7 h-2 w-2 rounded-full bg-[#d8ad55]/65" />
      </div>
    );
  }

  if (normalized.includes('star')) {
    return (
      <div className="relative h-16 w-16" style={{ transform: offset }}>
        <div className="absolute left-5 top-3 h-8 w-8 rotate-45 rounded-[8px] bg-[#fff2bc] shadow-[0_0_22px_rgba(255,242,188,0.5)]" />
        <div className="absolute left-5 top-3 h-8 w-8 rounded-[8px] bg-[#fff2bc]" />
      </div>
    );
  }

  if (normalized.includes('sun')) {
    return (
      <div className="relative h-16 w-16" style={{ transform: offset }}>
        <div className="absolute inset-2 rounded-full bg-[#ffd36b] shadow-[0_0_30px_rgba(255,211,107,0.54)]" />
      </div>
    );
  }

  if (normalized.includes('cloud') || normalized.includes('rain')) {
    return (
      <div className="relative h-16 w-20" style={{ transform: offset }}>
        <div className="absolute bottom-5 left-2 h-8 w-14 rounded-full bg-white/82" />
        <div className="absolute bottom-7 left-5 h-9 w-9 rounded-full bg-white/90" />
        <div className="absolute bottom-7 left-10 h-7 w-7 rounded-full bg-white/76" />
        <div className="absolute bottom-1 left-4 h-4 w-1 rotate-12 rounded-full bg-[#92d8ff]" />
        <div className="absolute bottom-0 left-9 h-4 w-1 rotate-12 rounded-full bg-[#92d8ff]" />
      </div>
    );
  }

  if (normalized.includes('rainbow') || normalized.includes('color')) {
    return (
      <div className="relative h-16 w-20" style={{ transform: offset }}>
        <div className="absolute bottom-2 left-1 h-12 w-[4.5rem] rounded-t-full border-[9px] border-b-0 border-[#ff7777]" />
        <div className="absolute bottom-2 left-3 h-9 w-14 rounded-t-full border-[8px] border-b-0 border-[#ffd36b]" />
        <div className="absolute bottom-2 left-5 h-6 w-10 rounded-t-full border-[7px] border-b-0 border-[#5bc9c2]" />
      </div>
    );
  }

  if (normalized.includes('tree') || normalized.includes('leaf') || normalized.includes('flower')) {
    return (
      <div className="relative h-16 w-16" style={{ transform: offset }}>
        <div className="absolute bottom-1 left-7 h-10 w-3 rounded-full bg-[#70431f]" />
        <div className="absolute left-2 top-1 h-10 w-10 rounded-full bg-[#8bd475]" />
        <div className="absolute right-2 top-5 h-8 w-8 rounded-full bg-[#b5e983]" />
      </div>
    );
  }

  if (normalized.includes('car') || normalized.includes('train') || normalized.includes('wheel') || normalized.includes('road')) {
    return (
      <div className="relative h-16 w-24" style={{ transform: offset }}>
        <div className="absolute bottom-5 left-2 h-8 w-16 rounded-[14px] bg-[#f3c056]" />
        <div className="absolute bottom-10 left-7 h-5 w-8 rounded-t-[12px] bg-[#fff2bc]" />
        <div className="absolute bottom-3 left-5 h-4 w-4 rounded-full bg-[#17122b]" />
        <div className="absolute bottom-3 left-14 h-4 w-4 rounded-full bg-[#17122b]" />
      </div>
    );
  }

  if (normalized.includes('wave') || normalized.includes('fish') || normalized.includes('ocean') || normalized.includes('water')) {
    return (
      <div className="relative h-16 w-20" style={{ transform: offset }}>
        <div className="absolute bottom-3 left-0 h-8 w-20 rounded-full bg-[#67d7df]/82" />
        <div className="absolute bottom-8 left-7 h-5 w-9 rounded-full bg-[#fff2bc]" />
        <div className="absolute bottom-9 right-3 h-4 w-4 rotate-45 bg-[#fff2bc]" />
      </div>
    );
  }

  if (normalized.includes('heart') || normalized.includes('body') || normalized.includes('brain')) {
    return (
      <div className="relative h-16 w-16" style={{ transform: offset }}>
        <div className="absolute left-3 top-3 h-10 w-10 rounded-full bg-[#ffd0cf]" />
        <div className="absolute left-6 top-5 h-5 w-5 rounded-full bg-[#ff8a8a]" />
        <div className="absolute left-4 top-5 h-5 w-5 rounded-full bg-[#ff8a8a]" />
        <div className="absolute left-5 top-7 h-6 w-6 rotate-45 bg-[#ff8a8a]" />
      </div>
    );
  }

  if (normalized.includes('food') || normalized.includes('bowl') || normalized.includes('steam')) {
    return (
      <div className="relative h-16 w-16" style={{ transform: offset }}>
        <div className="absolute bottom-3 left-2 h-7 w-12 rounded-b-full rounded-t-[8px] bg-[#fff2bc]" />
        <div className="absolute bottom-8 left-6 h-6 w-1 rounded-full bg-white/58" />
        <div className="absolute bottom-8 left-10 h-7 w-1 rounded-full bg-white/42" />
      </div>
    );
  }

  return (
    <div className="relative h-16 w-16" style={{ transform: offset }}>
      <div
        className="absolute inset-3 rotate-45 rounded-[14px] shadow-[0_0_26px_rgba(255,255,255,0.22)]"
        style={{ backgroundColor: accent }}
      />
      <div className="absolute inset-6 rounded-full bg-[#fff2bc]" />
    </div>
  );
}

export default function StoryCard({
  title,
  story,
  imageUrl,
  question,
  factAnswer,
  narrationText: generatedNarrationText,
  sceneTags,
  topic = 'wonder',
  childName,
  guide = 'gargi',
  onAskAnother,
}: StoryCardProps) {
  const [isNarrating, setIsNarrating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState(0);
  const [selectedVoiceKey, setSelectedVoiceKey] = useState<string | null>(null);
  const [voicePanelOpen, setVoicePanelOpen] = useState(false);
  const [showStory, setShowStory] = useState(false);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const accent = guide === 'nachi' ? '#F3C056' : '#5BC9C2';
  const guideMeta = WONDER_GUIDES[guide];
  const guideName = guideMeta.name;
  const narrationStyle = guideMeta.narration;

  const specialExperience = useMemo(() => {
    return getSpecialStoryExperience(question, childName);
  }, [childName, question]);
  const answerText =
    specialExperience?.fact ??
    factAnswer ??
    `${childName || 'Your child'} asked a beautiful question. This answer needs one more careful look, but the wonder is saved.`;
  const tryThisPrompt = getTryThisPrompt(topic, specialExperience);

  const narrationText = useMemo(() => {
    return buildNarrationScript({
      story,
      question,
      specialNarration: specialExperience?.narrationText ?? generatedNarrationText ?? undefined,
    });
  }, [
    generatedNarrationText,
    question,
    specialExperience,
    story,
  ]);

  const recommendedVoice = useMemo(() => {
    return pickGuideVoice(voices, guide);
  }, [guide, voices]);

  const voiceOptions = useMemo(() => {
    return voices
      .filter(isEnglishVoice)
      .sort((a, b) => {
        const scoreDelta = scoreGuideVoice(b, guide) - scoreGuideVoice(a, guide);
        if (scoreDelta !== 0) {
          return scoreDelta;
        }

        return a.name.localeCompare(b.name);
      });
  }, [guide, voices]);

  const selectedVoice = useMemo(() => {
    if (!selectedVoiceKey) {
      return null;
    }

    return voices.find((voice) => getVoiceKey(voice) === selectedVoiceKey) ?? null;
  }, [selectedVoiceKey, voices]);

  const narrationVoice = selectedVoice ?? recommendedVoice;
  const voiceFitLabel = describeVoiceFit(narrationVoice);

  const narrationSentences = useMemo(() => {
    return splitNarrationSentences(narrationText);
  }, [narrationText]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const synth = window.speechSynthesis;
      const syncVoices = () => {
        const nextVoices = synth.getVoices();
        if (nextVoices.length > 0) {
          setVoices(nextVoices);
        }
      };

      syncVoices();
      synth.onvoiceschanged = syncVoices;

      return () => {
        if (synth.onvoiceschanged === syncVoices) {
          synth.onvoiceschanged = null;
        }

        if (progressTimer.current) {
          clearInterval(progressTimer.current);
        }

        synth.cancel();
      };
    }

    return () => {
      if (progressTimer.current) {
        clearInterval(progressTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    setSelectedVoiceKey(window.localStorage.getItem(getGuideVoiceStorageKey(guide)));
  }, [guide]);

  useEffect(() => {
    setShowStory(false);
  }, [question]);

  useEffect(() => {
    if (!selectedVoiceKey || voices.length === 0) {
      return;
    }

    const voiceStillExists = voices.some(
      (voice) => getVoiceKey(voice) === selectedVoiceKey,
    );

    if (!voiceStillExists) {
      setSelectedVoiceKey(null);
    }
  }, [selectedVoiceKey, voices]);

  const stopNarration = (resetProgress = true) => {
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
      progressTimer.current = null;
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setIsNarrating(false);

    if (resetProgress) {
      setProgress(0);
      setActiveSentenceIndex(0);
    }
  };

  const applyNarrationVoice = (utterance: SpeechSynthesisUtterance) => {
    utterance.lang = narrationVoice?.lang || 'en-IN';
    utterance.rate = narrationStyle.rate;
    utterance.pitch = narrationStyle.pitch;

    if (narrationVoice) {
      utterance.voice = narrationVoice;
    }
  };

  const handleVoiceChoice = (nextVoiceKey: string) => {
    stopNarration(true);

    if (typeof window !== 'undefined') {
      const storageKey = getGuideVoiceStorageKey(guide);

      if (nextVoiceKey) {
        window.localStorage.setItem(storageKey, nextVoiceKey);
      } else {
        window.localStorage.removeItem(storageKey);
      }
    }

    setSelectedVoiceKey(nextVoiceKey || null);
  };

  const previewNarratorVoice = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }

    stopNarration(true);

    const sampleText =
      guide === 'gargi'
        ? 'Let us look closely. The moon is very far away, so it seems to stay with us.'
        : 'Let us follow the clues. Nearby trees rush past, but the faraway moon looks steady.';
    const utterance = new SpeechSynthesisUtterance(sampleText);
    applyNarrationVoice(utterance);
    utterance.onend = () => setIsNarrating(false);
    utterance.onerror = () => setIsNarrating(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsNarrating(true);
  };

  const toggleNarration = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }

    if (isNarrating) {
      stopNarration(true);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(narrationText);
    applyNarrationVoice(utterance);

    const durationMs = Math.max(
      4200,
      narrationText.length * (56 / narrationStyle.rate),
    );
    const stepMs = 120;
    const stepAmount = (stepMs / durationMs) * 100;

    setProgress(0);
    setActiveSentenceIndex(0);
    playGuideChime(guide);

    progressTimer.current = setInterval(() => {
      setProgress((current) => {
        if (current >= 98) {
          return current;
        }

        return Math.min(98, current + stepAmount);
      });
    }, stepMs);

    utterance.onboundary = (event) => {
      if (typeof event.charIndex !== 'number') {
        return;
      }

      setActiveSentenceIndex(
        findNarrationSentenceIndex(narrationSentences, event.charIndex),
      );
    };

    utterance.onend = () => {
      if (progressTimer.current) {
        clearInterval(progressTimer.current);
        progressTimer.current = null;
      }
      setProgress(100);
      setActiveSentenceIndex(Math.max(0, narrationSentences.length - 1));
      setIsNarrating(false);
    };

    utterance.onerror = () => {
      stopNarration(true);
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsNarrating(true);
  };

  return (
    <section className="mx-auto min-h-[calc(100svh-2.5rem)] w-full max-w-[420px]">
      <article className="wj-screen relative min-h-[760px] overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(500px_400px_at_50%_0%,rgba(91,42,107,0.5),transparent_70%)]" />

        <div className="relative px-4 pb-6 pt-4">
          <div className="mt-1">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/50">
              You asked
            </p>
            <h1 className="wj-display mt-2 text-[26px] leading-[1.2] text-[var(--wj-ivory)]">
              &ldquo;{question}&rdquo;
            </h1>
          </div>

          <div className="mt-4 rounded-[26px] bg-[#fff4d8] px-5 py-5 shadow-[0_18px_34px_rgba(0,0,0,0.22),inset_0_0_0_1px_rgba(142,68,18,0.1)]">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--wj-terracotta)]">
              Short answer
            </p>
            <p className="wj-display mt-3 text-[20px] leading-[1.42] text-[var(--wj-ink)]">
              {answerText}
            </p>
          </div>

          {specialExperience?.key === 'moon-car' ? (
            <MoonMotionDemo moments={specialExperience.moments} />
          ) : (
            <PictureCluePanel
              imageUrl={imageUrl}
              title={title}
              topic={topic}
              childName={childName}
              sceneTags={sceneTags}
            />
          )}

          <div className="mt-4 rounded-[22px] bg-white/6 p-4 shadow-[inset_0_0_0_1px_rgba(246,238,221,0.14)]">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleNarration}
                className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full text-[var(--wj-ivory)]"
                style={{
                  background:
                    guide === 'nachi'
                      ? 'linear-gradient(180deg, #f3c056 0%, #8e4412 100%)'
                      : 'linear-gradient(180deg, #5bc9c2 0%, #176060 100%)',
                  boxShadow:
                    '0 6px 14px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
                }}
              >
                {isNarrating ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                    <rect x="2" y="1" width="3.5" height="12" rx="1" />
                    <rect x="8.5" y="1" width="3.5" height="12" rx="1" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                    <path d="M3 1 L12 7 L3 13 Z" />
                  </svg>
                )}
              </button>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[var(--wj-ivory)]">
                  Listen to the answer
                </p>
                <p className="mt-0.5 text-xs text-white/58">
                  {guideName} reads it aloud
                </p>
                <div className="mt-2 h-1 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full transition-[width] duration-150"
                    style={{
                      width: `${progress}%`,
                      background: `linear-gradient(90deg, ${accent}, #F3C056)`,
                    }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-white/50">
                  <span>
                    {isNarrating
                      ? narrationStyle.playingLine
                      : narrationStyle.idleLine}
                  </span>
                  <span>{Math.max(32, Math.round(narrationText.length / 15))} sec</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setVoicePanelOpen((isOpen) => !isOpen)}
                className="rounded-full bg-white/8 px-2.5 py-1 text-left text-[11px] font-bold text-white/68 transition hover:bg-white/12"
                style={{
                  boxShadow: 'inset 0 0 0 1px rgba(246,238,221,0.14)',
                }}
                aria-expanded={voicePanelOpen}
              >
                {voiceFitLabel}
              </button>
            </div>

            <div className="mt-4 rounded-[18px] bg-black/16 px-4 py-3 shadow-[inset_0_0_0_1px_rgba(246,238,221,0.1)]">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/38">
                  Now playing
                </p>
              <p
                className="mt-1 text-[15px] font-semibold leading-6 transition-colors duration-200"
                style={{ color: isNarrating ? accent : 'rgba(246,238,221,0.78)' }}
              >
                {narrationSentences[activeSentenceIndex]?.text ??
                  narrationStyle.idleLine}
              </p>
            </div>

            {voicePanelOpen ? (
              <div className="mt-3 rounded-[18px] bg-white/[0.07] px-4 py-4 shadow-[inset_0_0_0_1px_rgba(246,238,221,0.12)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/42">
                      Narrator voice
                    </p>
                    <p className="mt-1 text-xs leading-5 text-white/62">
                      {narrationVoice
                        ? `${getVoiceLabel(narrationVoice)}`
                        : 'Your browser has not shared voice options yet.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={previewNarratorVoice}
                    disabled={!voices.length}
                    className="shrink-0 rounded-full bg-white/10 px-3 py-2 text-xs font-extrabold text-[var(--wj-ivory)] transition hover:bg-white/14 disabled:opacity-40"
                  >
                    Test
                  </button>
                </div>

                <select
                  value={selectedVoiceKey ?? ''}
                  onChange={(event) => handleVoiceChoice(event.target.value)}
                  className="mt-3 w-full rounded-[14px] border border-white/10 bg-[#181331] px-3 py-3 text-sm font-semibold text-[var(--wj-ivory)] outline-none"
                >
                  <option value="">
                    Auto-pick the warmest Indian English voice
                  </option>
                  {voiceOptions.map((voice) => (
                    <option key={getVoiceKey(voice)} value={getVoiceKey(voice)}>
                      {getVoiceLabel(voice)}
                    </option>
                  ))}
                </select>

                <p className="mt-3 text-[11px] leading-5 text-white/45">
                  Browser narration uses voices installed on this device. If an Indian
                  English voice is missing here, install one in system voices or use a
                  local TTS layer later for product-quality audio.
                </p>
              </div>
            ) : null}
          </div>

          <TryTogetherCard prompt={tryThisPrompt} />

          <div className="mt-5 overflow-hidden rounded-[26px] bg-white/6 shadow-[inset_0_0_0_1px_rgba(246,238,221,0.14)]">
            <button
              type="button"
              onClick={() => setShowStory((current) => !current)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              aria-expanded={showStory}
            >
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/45">
                  Story mode
                </p>
                <p className="mt-1 text-sm font-bold text-[var(--wj-ivory)]">
                  {showStory ? 'Hide the bedtime story' : 'Tell it like a bedtime story'}
                </p>
              </div>
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xl font-bold text-[var(--wj-ivory)] transition"
                style={{ transform: showStory ? 'rotate(45deg)' : 'rotate(0deg)' }}
              >
                +
              </span>
            </button>

            {showStory ? (
              <div className="wj-parchment wj-page-in rounded-t-[26px] px-5 py-5">
                <h2 className="wj-display text-[28px] leading-[1.12] text-[var(--wj-ink)]">
                  {title}
                </h2>
                <div className="mt-4 whitespace-pre-line text-[15px] leading-[1.65] text-[var(--wj-ink-soft)]">
                  {story}
                </div>
              </div>
            ) : null}
          </div>

          {onAskAnother ? (
            <button
              type="button"
              onClick={onAskAnother}
              className="wj-primary-btn mt-5 w-full"
            >
              Ask another question
            </button>
          ) : null}
        </div>
      </article>
    </section>
  );
}
