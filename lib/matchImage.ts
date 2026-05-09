import fs from 'fs';
import path from 'path';
import { IMAGE_LIBRARY } from './imageLibrary';
import { ImageEntry, StoryTopic, VALID_TOPICS } from './types';
import { alignTopic } from './semanticAlignment';

const imageExistsCache = new Map<string, boolean>();

function imageExists(imagePath: string): boolean {
  const cached = imageExistsCache.get(imagePath);
  if (typeof cached === 'boolean') {
    return cached;
  }

  const relativePath = imagePath.replace(/^\/+/, '');
  const fullPath = path.join(process.cwd(), 'public', relativePath);
  const exists = fs.existsSync(fullPath);
  imageExistsCache.set(imagePath, exists);
  return exists;
}

export function matchImage(
  question: string,
  topic: string,
  factAnswer = '',
): ImageEntry | null {
  const q = question.toLowerCase();
  const words = q
    .split(/[^a-z0-9]+/)
    .map((word) => word.trim())
    .filter(Boolean);

  const alignedTopic = alignTopic({
    question,
    factAnswer,
    proposedTopic: VALID_TOPICS.includes(topic as StoryTopic)
      ? (topic as StoryTopic)
      : 'wonder',
  }).topic;
  const safeTopic =
    alignedTopic === 'mythology' ||
    alignedTopic === 'culture' ||
    alignedTopic === 'history' ||
    alignedTopic === 'people' ||
    alignedTopic === 'music' ||
    alignedTopic === 'feelings'
      ? 'wonder'
      : alignedTopic;

  let candidates = IMAGE_LIBRARY.filter((img) => img.category === safeTopic);

  if (candidates.length === 0) {
    candidates = IMAGE_LIBRARY.filter((img) => img.category === 'wonder');
  }

  candidates = candidates.filter((img) => imageExists(img.path));

  if (candidates.length === 0) {
    return null;
  }

  const scored = candidates.map((img) => {
    const score = img.tags.filter((tag) => {
      const normalizedTag = tag.toLowerCase();
      return words.some(
        (word) => normalizedTag.includes(word) || word.includes(normalizedTag),
      ) || q.includes(normalizedTag);
    }).length;

    return { img, score };
  });

  scored.sort((a, b) => b.score - a.score);

  if (scored[0]?.score > 0) {
    return scored[0].img;
  }

  if (safeTopic !== 'wonder') {
    const wonderCandidates = IMAGE_LIBRARY.filter(
      (img) => img.category === 'wonder' && imageExists(img.path),
    );

    return wonderCandidates[0] ?? null;
  }

  return candidates[Math.floor(Math.random() * candidates.length)] ?? null;
}
