import benchmarkQuestions from './benchmarkQuestions.json';
import { StoryTopic } from './types';

export interface BenchmarkQuestion {
  id: string;
  question: string;
  expectedTopic: StoryTopic;
  coreFact: string;
  sceneTags: string[];
}

function normalizeQuestion(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const BENCHMARKS = benchmarkQuestions as BenchmarkQuestion[];
const BENCHMARK_BY_NORMALIZED_QUESTION = new Map(
  BENCHMARKS.map((benchmark) => [
    normalizeQuestion(benchmark.question),
    benchmark,
  ]),
);

export function lookupBenchmark(question: string): BenchmarkQuestion | null {
  return BENCHMARK_BY_NORMALIZED_QUESTION.get(normalizeQuestion(question)) ?? null;
}

export function listBenchmarks(): BenchmarkQuestion[] {
  return BENCHMARKS;
}
