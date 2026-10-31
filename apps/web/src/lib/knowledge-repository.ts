import {
  ApprovalState,
  AuditEvent,
  DashboardMetrics,
  ExpertProfile,
  HandoverPack,
  KnowledgeRecord,
  KnowledgeRecordQuery,
  ReviewCommentThread,
  KnowledgeRecordType,
  RecordVersion,
  UnresolvedReviewComment,
  ReviewDecision,
  RiskHotspot,
  UserRole
} from './domain';

export interface AuditActorInput {
  actorUserId?: string;
  actorName: string;
  actorRole?: UserRole;
}

export interface CreateKnowledgeRecordInput {
  type: 'PROCEDURE' | 'FIELD_NOTE' | 'FAILURE_PATTERN' | 'LESSON_LEARNED';
  title: string;
  asset: string;
  system: string;
  task: string;
  symptom: string;
  environment: string;
  tags: string[];
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  body: string;
  sourceExpertId?: string;
  handoverPackId?: string;
  author: string;
  actor?: AuditActorInput;
}

export interface UpdateKnowledgeRecordInput {
  id: string;
  title: string;
  asset: string;
  system: string;
  task: string;
  symptom: string;
  environment: string;
  tags: string[];
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  body: string;
  sourceExpertId?: string | null;
  handoverPackId?: string | null;
  changeNote?: string;
  changeReason?: string;
  editorName: string;
  actor: AuditActorInput;
}

export interface ReviewDecisionInput {
  id: string;
  decision: ReviewDecision;
  reviewerName: string;
  reviewerRationale?: string;
  comments?: ReviewCommentInput[];
  actor: AuditActorInput;
}

export interface ReviewCommentInput {
  section: 'TITLE' | 'BODY' | 'TAXONOMY' | 'TAGS' | 'CONFIDENCE' | 'TYPE_PAYLOAD';
  text: string;
}

export interface AddReviewCommentInput {
  id: string;
  reviewerName: string;
  comment: ReviewCommentInput;
  actor: AuditActorInput;
}

export interface ResubmitForReviewInput {
  id: string;
  editorName: string;
  editorResponseNote?: string;
  addressedCommentIds?: string[];
  relatedReviewDecisionEventId?: string;
  actor: AuditActorInput;
}

export interface CreateExpertProfileInput {
  name: string;
  roleFocus: string;
  domains: string[];
  assets: string[];
  yearsExperience: number;
  retirementWindowStart?: string;
  retirementWindowEnd?: string;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  notes?: string;
}

export interface CreateHandoverPackInput {
  expertProfileId: string;
  targetRole: string;
  targetDate?: string;
  taskTitles: string[];
}

export interface UpdateHandoverTaskStatusInput {
  handoverPackId: string;
  taskId: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'DONE';
  assigneeName?: string;
}

export interface KnowledgeRecordRepository {
  list(query?: KnowledgeRecordQuery): Promise<KnowledgeRecord[]>;
  getById(id: string): Promise<KnowledgeRecord | undefined>;
  create(input: CreateKnowledgeRecordInput): Promise<KnowledgeRecord>;
  updateRecord(input: UpdateKnowledgeRecordInput): Promise<KnowledgeRecord | undefined>;
  applyReviewDecision(input: ReviewDecisionInput): Promise<KnowledgeRecord | undefined>;
  addReviewComment(input: AddReviewCommentInput): Promise<KnowledgeRecord | undefined>;
  resubmitForReview(input: ResubmitForReviewInput): Promise<KnowledgeRecord | undefined>;
  updateStatus(id: string, status: ApprovalState, reviewer?: string, actor?: AuditActorInput): Promise<KnowledgeRecord | undefined>;
  listAuditEvents(recordId: string): Promise<AuditEvent[]>;
  getLatestUnresolvedReviewComment(recordId: string): Promise<UnresolvedReviewComment | undefined>;
  listReviewComments(recordId: string): Promise<ReviewCommentThread[]>;
  listVersions(recordId: string): Promise<RecordVersion[]>;
  listExpertProfiles(): Promise<ExpertProfile[]>;
  createExpertProfile(input: CreateExpertProfileInput): Promise<ExpertProfile>;
  listHandoverPacks(): Promise<HandoverPack[]>;
  createHandoverPack(input: CreateHandoverPackInput): Promise<HandoverPack | undefined>;
  updateHandoverTaskStatus(input: UpdateHandoverTaskStatusInput): Promise<HandoverPack | undefined>;
  getDashboardMetrics(): Promise<DashboardMetrics>;
  getRiskHotspots(limit: number): Promise<RiskHotspot[]>;
  listReviewQueue(): Promise<KnowledgeRecord[]>;
  getDistinctValues(field: 'asset' | 'system' | 'task' | 'symptom'): Promise<string[]>;
}

export const knowledgeRecordTypeOptions: KnowledgeRecordType[] = [
  'PROCEDURE',
  'FIELD_NOTE',
  'FAILURE_PATTERN',
  'LESSON_LEARNED',
  'EXPERT_INTERVIEW',
  'SHADOWING_RECORD'
];

const transitionMap: Record<ApprovalState, ApprovalState[]> = {
  DRAFT: ['UNDER_REVIEW', 'ARCHIVED', 'DRAFT'],
  UNDER_REVIEW: ['APPROVED', 'ARCHIVED', 'UNDER_REVIEW'],
  APPROVED: ['APPROVED', 'ARCHIVED'],
  ARCHIVED: ['ARCHIVED']
};

export function canTransitionStatus(current: ApprovalState, next: ApprovalState): boolean {
  return transitionMap[current].includes(next);
}
