import { StoryTopic } from './types';

export interface StoryMoment {
  title: string;
  detail: string;
  glyph: 'trees' | 'moon' | 'distance';
}

export interface StoryExperience {
  key: string;
  title: string;
  story: string;
  wonderQuestion: string;
  topic: StoryTopic;
  fact: string;
  narrationText: string;
  sceneLabel: string;
  sceneTitle: string;
  loadingMessages: string[];
  moments: StoryMoment[];
}

function normalizeQuestion(question: string): string {
  return question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isMoonCarQuestion(question: string): boolean {
  const normalized = normalizeQuestion(question);

  return (
    normalized.includes('moon') &&
    normalized.includes('car') &&
    (normalized.includes('follow') ||
      normalized.includes('following') ||
      normalized.includes('comes with') ||
      normalized.includes('comes along') ||
      normalized.includes('chase'))
  );
}

export function getSpecialStoryExperience(
  question: string,
  childName = 'Anvita',
): StoryExperience | null {
  if (!isMoonCarQuestion(question)) {
    return null;
  }

  const safeName = childName.trim() || 'Anvita';

  return {
    key: 'moon-car',
    title: 'The Moon Outside the Window',
    story: `One night, ${safeName} looked out of the car window and gasped. The moon was there above the trees. When the car turned, the moon seemed to turn too. When the car rolled faster, the moon still looked as if it was coming along for the ride.\n\n${safeName} watched more carefully. A lamp post whooshed by. A tree rushed past. A shop sign slipped away. But the moon stayed almost in the same place. That was the clue.\n\nThings that are close to us look like they zoom past when we move. But the moon is very, very far away, much farther than trees, houses, or hills. Because it is so far, our car does not change our view of it very much. So it can look like it is following us, even though it is not moving with the car at all.\n\n${safeName} pressed a small hand to the window and smiled. The moon was not chasing the car. It was shining from far away while the close-up world hurried past. "Wow!"`,
    wonderQuestion: 'I wonder why the moon looks bigger when it is near the horizon?',
    topic: 'space',
    fact: 'The moon is so far away that it seems to stay with us while nearby things race past.',
    narrationText: `Why does the moon follow our car? Ooh, it really can feel like the moon is riding beside us. But here is the moon trick. Close things go zip, zip, zip past the window. The moon is far, far away, so it barely shifts in the sky while the car moves. That is why it looks like the moon is coming along for the ride.`,
    sceneLabel: 'Featured moon demo',
    sceneTitle: 'A night drive, a bright moon, and three tiny clues',
    loadingMessages: [
      'Catching the moon outside the window...',
      'Watching the trees race by...',
      'Turning distance into a story...',
      'Almost ready to explain the moon trick...',
    ],
    moments: [
      {
        title: 'Nearby things rush by',
        detail:
          'Trees, signs, and lamp posts are close to the car, so they seem to move fast.',
        glyph: 'trees',
      },
      {
        title: 'The moon stays steady',
        detail:
          'The moon is so far away that our place on the road hardly changes our view of it.',
        glyph: 'moon',
      },
      {
        title: 'Far-away things look slower',
        detail:
          'Very distant things can feel like they are coming with us, even when they are not.',
        glyph: 'distance',
      },
    ],
  };
}
