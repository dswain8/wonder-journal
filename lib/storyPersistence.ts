import { scoreGeneratedAnswerQuality } from './answerQuality';
import { lookupBenchmark } from './benchmarks';
import db from './db';
import { GeneratedAnswerV1, KidProfile } from './types';

export async function saveGeneratedStory({
  question,
  answerData,
  imagePath,
  imageCategory,
  profile,
  qualityScore = scoreGeneratedAnswerQuality(answerData, lookupBenchmark(question)),
}: {
  question: string;
  answerData: GeneratedAnswerV1;
  imagePath: string | null;
  imageCategory: string | null;
  profile: KidProfile;
  qualityScore?: number;
}): Promise<number> {
  const result = await db.execute({
    sql: `
      INSERT INTO stories (
        question,
        story_title,
        story_text,
        fact_answer,
        narration_text,
        wonder_question,
        image_path,
        image_category,
        scene_tags,
        confidence,
        answer_source,
        quality_score,
        child_name,
        child_age
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      question,
      answerData.story_title,
      answerData.story_text,
      answerData.fact_answer,
      answerData.narration_text,
      answerData.wonder_question,
      imagePath,
      imageCategory ?? answerData.topic,
      JSON.stringify(answerData.scene_tags),
      answerData.confidence,
      answerData.source,
      qualityScore,
      profile.childName,
      profile.childAge,
    ],
  });

  return Number(result.lastInsertRowid ?? 0);
}
