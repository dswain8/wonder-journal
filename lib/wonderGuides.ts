import { AppProfile, KidProfile, WonderGuideId } from './types';

export interface WonderGuide {
  id: WonderGuideId;
  name: string;
  fullName: string;
  shortLabel: string;
  childLine: string;
  importance: string;
  sourceLine: string;
  palette: {
    chip: string;
    glow: string;
    card: string;
  };
  narration: {
    label: string;
    idleLine: string;
    playingLine: string;
    speedLabel: string;
    intro: string;
    outro: string;
    rate: number;
    pitch: number;
    preferredVoiceNames: string[];
    preferredVoiceTokens: string[];
  };
}

export const WONDER_GUIDES: Record<WonderGuideId, WonderGuide> = {
  gargi: {
    id: 'gargi',
    name: 'Gargi',
    fullName: 'Gargi Vachaknavi',
    shortLabel: 'The listener',
    childLine: 'Still, kind, and brave. Gargi stays with a question until the answer feels clear.',
    importance:
      'Inspired by Gargi Vachaknavi, remembered in Indian wisdom traditions for asking fearless, thoughtful questions with unusual calm and courage.',
    sourceLine: 'Inspired by an ancient seeker. Reimagined here as a gentle guide.',
    palette: {
      chip: 'bg-[#dff5f1] text-[#123e3d]',
      glow: 'rgba(91, 201, 194, 0.22)',
      card: 'from-[#1f6b6b] via-[#175050] to-[#0e3a3a]',
    },
    narration: {
      label: 'Clear, warm story voice',
      idleLine: 'Tap to hear Gargi explain slowly',
      playingLine: 'Gargi is reading the answer',
      speedLabel: 'clear',
      intro: 'Let us look closely.',
      outro: '',
      rate: 0.82,
      pitch: 1.12,
      preferredVoiceNames: [
        'Veena',
        'Lekha',
        'Meera',
        'Priya',
        'Samantha',
        'Karen',
        'Moira',
        'Tessa',
        'Siri',
        'Fiona',
        'Google UK English Female',
        'Microsoft Heera - English (India)',
      ],
      preferredVoiceTokens: [
        'female',
        'india',
        'indian',
        'en-in',
        'english india',
        'veena',
        'heera',
        'lekha',
        'meera',
        'siri',
      ],
    },
  },
  nachiketh: {
    id: 'nachiketh',
    name: 'Nachiketh',
    fullName: 'Nachiketh',
    shortLabel: 'The spark',
    childLine: 'Warm, bright, and curious. Nachiketh keeps following every why until it becomes a story.',
    importance:
      'Inspired by Nachiketh, the truth-seeking child of the Katha Upanishad, remembered for asking again and again instead of settling for easy answers.',
    sourceLine: 'Inspired by a child seeker. Reimagined here as a warm companion.',
    palette: {
      chip: 'bg-[#ffe1b1] text-[#4f2410]',
      glow: 'rgba(243, 192, 86, 0.24)',
      card: 'from-[#8e4412] via-[#6d3210] to-[#5b2a0b]',
    },
    narration: {
      label: 'Sunny, clear story voice',
      idleLine: 'Tap to hear Nachiketh explain slowly',
      playingLine: 'Nachiketh is reading the answer',
      speedLabel: 'clear',
      intro: 'Let us follow the clues.',
      outro: '',
      rate: 0.84,
      pitch: 1.03,
      preferredVoiceNames: [
        'Rishi',
        'Rohan',
        'Kabir',
        'Daniel',
        'Alex',
        'Aaron',
        'Siri',
        'Google UK English Male',
        'Microsoft Prabhat - English (India)',
      ],
      preferredVoiceTokens: [
        'male',
        'india',
        'indian',
        'en-in',
        'english india',
        'rishi',
        'prabhat',
        'rohan',
        'kabir',
        'siri',
      ],
    },
  },
};

export const WONDER_GUIDE_LIST = Object.values(WONDER_GUIDES);

export const DEFAULT_KID_PROFILE: KidProfile = {
  childName: 'Aanya',
  childAge: 5,
  storyLead: 'girl',
  guide: 'gargi',
};

export const DEFAULT_APP_PROFILE: AppProfile = {
  parentName: 'Priya',
  onboardingComplete: false,
  micPermission: 'idle',
  ...DEFAULT_KID_PROFILE,
};

export function describeStoryLead(storyLead: KidProfile['storyLead']): string {
  if (storyLead === 'boy') {
    return 'boy';
  }

  if (storyLead === 'neutral') {
    return 'child';
  }

  return 'girl';
}
