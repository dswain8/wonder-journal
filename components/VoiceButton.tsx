'use client';

import { useRef, useState } from 'react';

interface VoiceButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  size?: 'default' | 'hero';
  icon?: 'mic' | 'wand';
  onListeningChange?: (listening: boolean) => void;
}

export default function VoiceButton({
  onTranscript,
  disabled = false,
  size = 'default',
  icon = 'mic',
  onListeningChange,
}: VoiceButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isHero = size === 'hero';
  const wandIdleClasses =
    'bg-[linear-gradient(180deg,#fff4b5_0%,#ffd766_58%,#ffb84f_100%)] text-[#3d214d] hover:brightness-105';
  const wandListeningClasses =
    'scale-110 animate-pulse bg-[linear-gradient(180deg,#ffb693_0%,#ff8e6a_100%)] text-white shadow-lg';
  const micIdleClasses =
    'bg-[var(--wj-lime)] text-[var(--wj-night)] hover:bg-[#a7ff70] active:scale-95';
  const micListeningClasses =
    'scale-110 animate-pulse bg-[var(--wj-peach)] text-white shadow-lg';

  const updateListening = (nextListening: boolean) => {
    setIsListening(nextListening);
    onListeningChange?.(nextListening);
  };

  const toggleListening = () => {
    if (disabled) {
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      updateListening(false);
      return;
    }

    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SR) {
      alert('Voice input is not supported here yet. Please type your question instead.');
      return;
    }

    const recognition = new SR();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => {
      onTranscript(event.results[0][0].transcript);
      updateListening(false);
    };
    recognition.onerror = () => updateListening(false);
    recognition.onend = () => updateListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    updateListening(true);
  };

  return (
    <button
      type="button"
      onClick={toggleListening}
      disabled={disabled}
      className={`flex items-center justify-center rounded-full border border-white/12 transition-all duration-200 ${
        isHero
          ? 'h-[152px] w-[152px] shadow-[0_30px_60px_rgba(24,9,39,0.38)]'
          : 'h-14 w-14 shadow-md'
      } ${
        icon === 'wand'
          ? isListening
            ? wandListeningClasses
            : wandIdleClasses
          : isListening
            ? micListeningClasses
            : micIdleClasses
      } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      aria-label={isListening ? 'Stop listening' : 'Start asking out loud'}
    >
      {icon === 'wand' ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={isHero ? 52 : 28}
          height={isHero ? 52 : 28}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 19 14.5 9.5" />
          <path d="m14 5 1.1 2.4L17.5 8.5l-2.4 1.1L14 12l-1.1-2.4-2.4-1.1 2.4-1.1L14 5Z" />
          <path d="M17.5 13.5 18 15l1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5.5-1.5Z" />
          <path d="M9 4.5 9.3 5.7 10.5 6l-1.2.3L9 7.5l-.3-1.2L7.5 6l1.2-.3L9 4.5Z" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={isHero ? 52 : 28}
          height={isHero ? 52 : 28}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" x2="12" y1="19" y2="22" />
        </svg>
      )}
    </button>
  );
}
