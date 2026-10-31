import { ApprovalState, KnowledgeRecordType } from './domain';
import { SearchFilters } from './knowledge-service';

function asString(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export function parseSearchFilters(params: Record<string, string | string[] | undefined>): SearchFilters {
  const type = asString(params.type);
  const status = asString(params.status);
  const validTypes = new Set<KnowledgeRecordType | 'ALL'>([
    'ALL',
    'PROCEDURE',
    'FIELD_NOTE',
    'FAILURE_PATTERN',
    'LESSON_LEARNED',
    'EXPERT_INTERVIEW',
    'SHADOWING_RECORD'
  ]);
  const validStatuses = new Set<ApprovalState | 'ALL'>(['ALL', 'DRAFT', 'UNDER_REVIEW', 'APPROVED', 'ARCHIVED']);
  const parsedType = validTypes.has(type as KnowledgeRecordType | 'ALL') ? (type as KnowledgeRecordType | 'ALL') : 'ALL';
  const parsedStatus = validStatuses.has(status as ApprovalState | 'ALL') ? (status as ApprovalState | 'ALL') : 'ALL';

  return {
    keyword: asString(params.keyword),
    type: type ? parsedType : 'ALL',
    asset: asString(params.asset),
    system: asString(params.system),
    task: asString(params.task),
    symptom: asString(params.symptom),
    status: status ? parsedStatus : 'ALL'
  };
}
