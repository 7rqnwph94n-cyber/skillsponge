import { KnowledgeRecord } from './domain';
import { UpdateKnowledgeRecordInput } from './knowledge-repository';

function normalizeTags(tags: string[]): string[] {
  return tags.map((tag) => tag.trim()).filter(Boolean).sort();
}

function normalizeRelation(value: string | null | undefined): string {
  if (value === null) return '';
  return value?.trim() ?? '';
}

export function hasMeaningfulEditChange(existing: KnowledgeRecord, input: UpdateKnowledgeRecordInput): boolean {
  if (existing.title !== input.title.trim()) return true;
  if (existing.body !== input.body.trim()) return true;
  if (existing.confidence !== input.confidence) return true;
  if (existing.context.asset !== input.asset.trim()) return true;
  if (existing.context.system !== input.system.trim()) return true;
  if (existing.context.task !== input.task.trim()) return true;
  if (existing.context.symptom !== input.symptom.trim()) return true;
  if (existing.context.environment !== input.environment.trim()) return true;
  if ((existing.sourceExpertId ?? '') !== normalizeRelation(input.sourceExpertId)) return true;
  if ((existing.handoverPackId ?? '') !== normalizeRelation(input.handoverPackId)) return true;

  const existingTags = normalizeTags(existing.tags);
  const inputTags = normalizeTags(input.tags);
  if (existingTags.length !== inputTags.length) return true;
  for (let i = 0; i < existingTags.length; i += 1) {
    if (existingTags[i] !== inputTags[i]) return true;
  }

  return false;
}
