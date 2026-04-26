'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnswerSource, WonderGuideId } from '@/lib/types';
import { StoryMoment, getSpecialStoryExperience } from '@/lib/storyExperiences';
import { WONDER_GUIDES } from '@/lib/wonderGuides';

interface StoryCardProps {
  title: string;
  story: string;
  wonderQuestion: string;
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
  onFollowup?: (question: string) => void;
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
  guide,
  title,
  story,
  wonderQuestion,
  question,
  specialNarration,
}: {
  guide: WonderGuideId;
  title: string;
  story: string;
  wonderQuestion: string;
  question: string;
  specialNarration?: string;
}) {
  const narration = WONDER_GUIDES[guide].narration;

  if (specialNarration) {
    return normalizeNarrationText(
      `${narration.intro} ${specialNarration} ${narration.outro}`,
    );
  }

  return normalizeNarrationText(
    `${narration.intro} You asked, ${question}. Here comes a little story called ${title}. ${story} ${narration.outro} ${wonderQuestion}`,
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

function SpecialStoryMoments({
  fact,
  moments,
}: {
  fact: string;
  moments: StoryMoment[];
}) {
  return (
    <section className="mt-5 rounded-[24px] bg-white/6 p-4 text-white shadow-[inset_0_0_0_1px_rgba(246,238,221,0.12)]">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/55">
        The quick clues
      </p>
      <p className="mt-2 text-base font-semibold leading-7 text-[var(--wj-ivory)]">
        {fact}
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
}: {
  topic: string;
  childName?: string;
}) {
  const scene = TOPIC_SCENES[topic] ?? TOPIC_SCENES.wonder;

  return (
    <div
      className="relative h-[220px] overflow-hidden rounded-[26px] shadow-[0_18px_36px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]"
      style={{ background: scene.gradient }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_32%)]" />
      <div className="absolute left-4 top-4 rounded-full bg-black/30 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-white/88 backdrop-blur-sm">
        {scene.label}
      </div>
      <div
        className="absolute right-6 top-6 h-3 w-3 rounded-full"
        style={{ backgroundColor: scene.accent }}
      />
      <div className="absolute bottom-0 left-0 right-0 h-20" style={{ backgroundColor: scene.foreground, opacity: 0.82 }} />
      <div className="absolute bottom-6 left-6 rounded-full bg-white/12 px-4 py-2 text-sm font-semibold text-white/92 backdrop-blur-sm">
        {childName ? `${childName}'s answer adventure` : 'Answer adventure'}
      </div>
      <div className="absolute left-10 top-16 h-20 w-20 rounded-full bg-white/12 blur-sm" />
      <div className="absolute right-16 top-20 h-14 w-14 rounded-full border border-white/14" />
      <div className="absolute bottom-10 right-10 h-12 w-28 rounded-full bg-white/8 blur-xl" />
    </div>
  );
}

export default function StoryCard({
  title,
  story,
  wonderQuestion,
  imageUrl,
  question,
  factAnswer,
  narrationText: generatedNarrationText,
  sceneTags,
  source,
  qualityScore,
  topic = 'wonder',
  childName,
  guide = 'gargi',
  onAskAnother,
  onFollowup,
}: StoryCardProps) {
  const [isNarrating, setIsNarrating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState(0);
  const [selectedVoiceKey, setSelectedVoiceKey] = useState<string | null>(null);
  const [voicePanelOpen, setVoicePanelOpen] = useState(false);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const accent = guide === 'nachi' ? '#F3C056' : '#5BC9C2';
  const guideMeta = WONDER_GUIDES[guide];
  const guideName = guideMeta.name;
  const narrationStyle = guideMeta.narration;

  const specialExperience = useMemo(() => {
    return getSpecialStoryExperience(question, childName);
  }, [childName, question]);

  const narrationText = useMemo(() => {
    return buildNarrationScript({
      guide,
      title,
      story,
      wonderQuestion,
      question,
      specialNarration: specialExperience?.narrationText ?? generatedNarrationText ?? undefined,
    });
  }, [
    generatedNarrationText,
    guide,
    question,
    specialExperience,
    story,
    title,
    wonderQuestion,
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
        ? 'Namaste, little wonderer. I am Gargi. Let us chase this question together.'
        : 'Namaste, curious friend. I am Nachi. Let us turn this why into a tiny adventure.';
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
          <div className="text-center">
            <p className="wj-caveat text-[18px]" style={{ color: accent }}>
              a little story from {guideName}
            </p>
          </div>

          <div className="mt-5">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/50">
              {childName || 'Someone'} asked
            </p>
            <h1 className="wj-display mt-2 text-[26px] leading-[1.2] text-[var(--wj-ivory)]">
              &ldquo;{question}&rdquo;
            </h1>
          </div>

          <div className="mt-5">
            {imageUrl ? (
              <div className="relative h-[220px] overflow-hidden rounded-[26px] shadow-[0_18px_36px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
                <Image
                  src={imageUrl}
                  alt={title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 420px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                <div className="absolute left-4 top-4 rounded-full bg-black/30 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-white/88 backdrop-blur-sm">
                  Illustrated scene
                </div>
              </div>
            ) : specialExperience ? (
              <MoonCarScene label={specialExperience.sceneLabel} childName={childName} />
            ) : (
              <TopicScene topic={topic} childName={childName} />
            )}
          </div>

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
                  narrated by {guideName}
                </p>
                <p className="mt-0.5 text-xs text-white/58">
                  {narrationStyle.label}
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
                {guideName} says
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

          <div className="wj-parchment wj-page-in mt-5 rounded-[26px] px-5 py-5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--wj-terracotta)]">
                The little truth
              </span>
              <div className="h-px flex-1 bg-black/10" />
            </div>

            <p className="wj-display mt-3 text-[17px] leading-[1.5] text-[var(--wj-ink)]">
              {specialExperience?.fact ??
                factAnswer ??
                `${childName || 'Your child'} asked a beautiful question, so this answer was wrapped in a little story first and a clearer truth second.`}
            </p>

            {source || typeof qualityScore === 'number' || sceneTags?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {source ? (
                  <span
                    className="rounded-full px-3 py-1.5 text-[11px] font-bold text-[var(--wj-terracotta)] shadow-[inset_0_0_0_1px_rgba(142,68,18,0.2)]"
                    style={{ background: 'rgba(142,68,18,0.08)' }}
                  >
                    {source === 'benchmark'
                      ? 'curated fact'
                      : source === 'hybrid'
                        ? 'curated + AI'
                        : source === 'fallback'
                          ? 'read together'
                          : 'AI answer'}
                  </span>
                ) : null}
                {typeof qualityScore === 'number' ? (
                  <span
                    className="rounded-full px-3 py-1.5 text-[11px] font-bold text-[var(--wj-terracotta)] shadow-[inset_0_0_0_1px_rgba(142,68,18,0.2)]"
                    style={{ background: 'rgba(142,68,18,0.08)' }}
                  >
                    {Math.round(qualityScore * 100)}% quality check
                  </span>
                ) : null}
                {sceneTags?.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full px-3 py-1.5 text-[11px] font-bold text-[var(--wj-terracotta)] shadow-[inset_0_0_0_1px_rgba(142,68,18,0.2)]"
                    style={{ background: 'rgba(142,68,18,0.08)' }}
                  >
                    {tag.replace(/-/g, ' ')}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-6 flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--wj-terracotta)]">
                The story
              </span>
              <div className="h-px flex-1 bg-black/10" />
            </div>

            <h2 className="wj-display mt-3 text-[28px] leading-[1.12] text-[var(--wj-ink)]">
              {title}
            </h2>
            <div className="mt-4 whitespace-pre-line text-[15px] leading-[1.65] text-[var(--wj-ink-soft)]">
              {story}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {(specialExperience
                ? ['why so far?', 'does the moon sleep?', 'other car-window wonders']
                : ['tell me more', 'show another clue', 'keep wondering']
              ).map((chip) => (
                <span
                  key={chip}
                  className="rounded-full px-3 py-1.5 text-xs font-bold text-[var(--wj-terracotta)] shadow-[inset_0_0_0_1px_rgba(142,68,18,0.22)]"
                  style={{ background: 'rgba(142,68,18,0.08)' }}
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>

          {specialExperience ? (
            <SpecialStoryMoments
              fact={specialExperience.fact}
              moments={specialExperience.moments}
            />
          ) : null}

          <div
            className="mt-5 overflow-hidden rounded-[26px] px-5 py-5 text-white shadow-[0_14px_30px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.15)]"
            style={{
              background:
                guide === 'nachi'
                  ? 'linear-gradient(160deg, #8e4412 0%, #5b2a0b 100%)'
                  : 'linear-gradient(160deg, #1f6b6b 0%, #0e3a3a 100%)',
            }}
          >
            <p className="wj-caveat text-[22px] text-[#fff3d2]">I wonder…</p>
            <p className="wj-display mt-2 text-[22px] leading-[1.25] text-[var(--wj-ivory)]">
              {wonderQuestion}
            </p>

            {onFollowup || onAskAnother ? (
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                {onFollowup ? (
                  <button
                    type="button"
                    onClick={() => onFollowup(wonderQuestion)}
                    className="wj-primary-btn flex-1"
                  >
                    Ask this next
                  </button>
                ) : null}
                {onAskAnother ? (
                  <button
                    type="button"
                    onClick={onAskAnother}
                    className="wj-ghost-btn flex-1"
                  >
                    Ask something else
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </article>
    </section>
  );
}
