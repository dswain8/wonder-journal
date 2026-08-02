const fs = require('fs');

let content = fs.readFileSync('components/StoryCard.tsx.bak', 'utf-8');

// 1. Replace the body of StoryCard up to the return statement
const componentStart = content.indexOf('export default function StoryCard({');
const returnStart = content.indexOf('return (', componentStart);

const newLogic = `export default function StoryCard({
  title,
  story,
  imageUrl,
  question,
  factAnswer,
  sceneTags,
  topic = 'wonder',
  childName,
  guide = 'gargi',
  activityPrompt,
  storyStatus = 'ready',
  isStoryGenerating = false,
  onRequestStory,
  onAskAnother,
}: StoryCardProps) {
  const [activeNarration, setActiveNarration] = useState<NarrationMode | null>(null);
  const [isNarrationPaused, setIsNarrationPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [showStory, setShowStory] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
    \`\${childName || 'Your child'} asked a beautiful question. This answer needs one more careful look, but the wonder is saved.\`;
  const tryThisPrompt =
    specialExperience?.key === 'moon-car'
      ? 'Next time you are in a car, look at a nearby pole and then the moon. The pole jumps away fast. The moon looks steady. That is the clue.'
      : activityPrompt ??
        getTryTogetherPrompt({
          topic,
          question,
          factAnswer: answerText,
          sceneTags,
        });
  const hasStory = story.trim().length > 0 && storyStatus === 'ready';

  const narrationText = useMemo(() => {
    return buildNarrationScript({
      story,
      question,
      factAnswer: answerText,
      specialNarration: specialExperience?.narrationText ?? undefined,
    });
  }, [answerText, question, specialExperience, story]);

  const storyNarrationText = useMemo(() => {
    if (!hasStory) return '';
    return normalizeNarrationText(\`\${title}. \${story}\`);
  }, [hasStory, story, title]);

  const isAnswerNarrating = activeNarration === 'answer';
  const isStoryNarrating = activeNarration === 'story';
  const isAnswerPlaying = isAnswerNarrating && !isNarrationPaused;
  const isStoryPlaying = isStoryNarrating && !isNarrationPaused;
  
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  useEffect(() => {
    setShowStory(false);
  }, [question]);

  const stopNarration = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setActiveNarration(null);
    setIsNarrationPaused(false);
    setProgress(0);
  };

  const toggleReadAloud = async (mode: NarrationMode) => {
    if (activeNarration === mode) {
      if (isNarrationPaused) {
        audioRef.current?.play();
        setIsNarrationPaused(false);
      } else {
        audioRef.current?.pause();
        setIsNarrationPaused(true);
      }
      return;
    }

    if (activeNarration) {
      stopNarration();
    }

    if (mode === 'story' && !hasStory) return;

    const textToRead = mode === 'story' ? storyNarrationText : narrationText;
    const voiceId = guide === 'gargi' ? '21m00Tcm4TlvDq8ikWAM' : 'pNInz6obpgDQGcFmaJgB';

    setIsAudioLoading(true);
    setActiveNarration(mode);
    setIsNarrationPaused(false);
    setProgress(0);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToRead, voiceId }),
      });
      
      const data = await response.json();
      if (data.url) {
        if (!audioRef.current) {
          audioRef.current = new Audio(data.url);
        } else {
          audioRef.current.src = data.url;
        }

        audioRef.current.ontimeupdate = () => {
          if (audioRef.current && audioRef.current.duration) {
            setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
          }
        };

        audioRef.current.onended = () => {
          setProgress(100);
          setActiveNarration(null);
          setIsNarrationPaused(false);
        };

        await audioRef.current.play();
      }
    } catch (err) {
      console.error('Failed to play audio:', err);
      setActiveNarration(null);
    } finally {
      setIsAudioLoading(false);
    }
  };

  `;

content = content.substring(0, componentStart) + newLogic + content.substring(returnStart);

// 2. Remove the voice panel UI and "Now playing" box
// We find '<button\\n                type="button"\\n                onClick={() => setVoicePanelOpen((isOpen) => !isOpen)}'
// and replace up to `{voicePanelOpen ? (... ) : null}\\n          </div>`

const buttonRegex = /<button[\s\S]*?onClick=\{\(\) => setVoicePanelOpen[\s\S]*?\{voicePanelOpen \? \([\s\S]*?\) : null\}\n          <\/div>/;
const replacement = \`              {isAudioLoading && (
                <span className="rounded-full bg-white/8 px-2.5 py-1 text-left text-[11px] font-bold text-white/68">
                  Loading high-quality voice...
                </span>
              )}
            </div>
          </div>\`;

content = content.replace(buttonRegex, replacement);

// 3. Remove some other old references in JSX (like answerReadSeconds and storyReadSeconds)
content = content.replace(/<span>\{answerReadSeconds\} sec<\/span>/g, '<span></span>');
content = content.replace(/\{storyReadSeconds\} sec/g, '');
content = content.replace(/\{isStoryPlaying \? '' : 'Paused: '\}\\n\s*\{storyNarrationSentences\[activeSentenceIndex\]\?\.text \?\? title\}/g, '{isStoryPlaying ? "" : "Paused"}');

fs.writeFileSync('components/StoryCard.tsx', content);
console.log('StoryCard.tsx rewritten successfully!');
