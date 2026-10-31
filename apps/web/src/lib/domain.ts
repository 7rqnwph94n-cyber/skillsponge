export type UserRole = 'TECHNICIAN' | 'SENIOR_TECHNICIAN' | 'SUPERVISOR' | 'REVIEWER' | 'ADMIN';

export type KnowledgeRecordType =
  | 'PROCEDURE'
  | 'FIELD_NOTE'
  | 'FAILURE_PATTERN'
  | 'LESSON_LEARNED'
  | 'EXPERT_INTERVIEW'
  | 'SHADOWING_RECORD';

export type ProcedureScope = 'GENERIC' | 'MODEL_SPECIFIC' | 'VARIANT_SPECIFIC';
export type ApprovalState = 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'ARCHIVED';
export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type ReviewDecision = 'APPROVE' | 'REQUEST_CHANGES';
export type ReviewCommentSection = 'TITLE' | 'BODY' | 'TAXONOMY' | 'TAGS' | 'CONFIDENCE' | 'TYPE_PAYLOAD';
export type ReviewCommentStatus = 'OPEN' | 'ADDRESSED' | 'RESOLVED';

export interface TaxonomyContext {
  asset: string;
  system: string;
  task: string;
  symptom: string;
  environment: string;
}

export interface BaseRecord {
  id: string;
  type: KnowledgeRecordType;
  title: string;
  summary: string;
  body: string;
  author: string;
  reviewer?: string;
  sourceExpertId?: string;
  sourceExpertName?: string;
  handoverPackId?: string;
  approvalState: ApprovalState;
  confidence: ConfidenceLevel;
  currentVersion: number;
  createdAt: string;
  lastValidatedAt?: string;
  scope?: ProcedureScope;
  tags: string[];
  relatedRecordIds: string[];
  context: TaxonomyContext;
}

export interface ProcedureRecord extends BaseRecord {
  type: 'PROCEDURE';
  steps: string[];
}

export interface FieldNoteRecord extends BaseRecord {
  type: 'FIELD_NOTE';
  observation: string;
  immediateAction: string;
}

export interface FailurePatternRecord extends BaseRecord {
  type: 'FAILURE_PATTERN';
  patternSignals: string[];
  likelyCauses: string[];
}

export interface LessonLearnedRecord extends BaseRecord {
  type: 'LESSON_LEARNED';
  lessonPoints: string[];
}

export interface ExpertInterviewRecord extends BaseRecord {
  type: 'EXPERT_INTERVIEW';
  expertName: string;
  answers: {
    whatNoviceMisses: string;
    topThreeDangerSigns: string;
    similarButDifferentFault: string;
    firstCheckBeforeOpening: string;
    whatManualMisses: string;
  };
}

export interface ShadowingRecord extends BaseRecord {
  type: 'SHADOWING_RECORD';
  seniorTechnician: string;
  juniorTechnician: string;
  competencyScore: number;
  sessionOutcome: string;
}

export type KnowledgeRecord =
  | ProcedureRecord
  | FieldNoteRecord
  | FailurePatternRecord
  | LessonLearnedRecord
  | ExpertInterviewRecord
  | ShadowingRecord;

export interface AppUser {
  id: string;
  name: string;
  role: UserRole;
}

export interface KnowledgeRecordQuery {
  keyword?: string;
  type?: KnowledgeRecordType | 'ALL';
  asset?: string;
  system?: string;
  task?: string;
  symptom?: string;
  status?: ApprovalState | 'ALL';
  scope?: ProcedureScope;
}

export interface DashboardMetrics {
  totalRecords: number;
  approvedRecords: number;
  draftRecords: number;
  expertInterviewsCaptured: number;
  shadowingRecordsCaptured: number;
  atRiskExperts: number;
  openHandoverPacks: number;
}

export interface RiskHotspot {
  key: string;
  asset: string;
  task: string;
  totalRecords: number;
  approvedRecords: number;
  riskScore: number;
  reason: string;
}

export interface AuditEvent {
  id: string;
  recordId: string;
  actorName: string;
  actorRole?: UserRole;
  eventType:
    | 'RECORD_CREATED'
    | 'STATUS_CHANGED'
    | 'REVIEW_DECISION'
    | 'REVIEW_RESUBMITTED'
    | 'REVIEW_COMMENT_ADDED'
    | 'REVIEW_COMMENT_STATUS_CHANGED';
  fromStatus?: ApprovalState;
  toStatus?: ApprovalState;
  metadata?: {
    changeReason?: string;
    reviewDecision?: ReviewDecision;
    reviewerRationale?: string;
    editorResponseNote?: string;
    relatedReviewDecisionEventId?: string;
    reviewCommentId?: string;
    reviewCommentSection?: ReviewCommentSection;
    reviewCommentText?: string;
    reviewCommentStatus?: ReviewCommentStatus;
    reviewCommentAction?: 'ADDRESSED' | 'RESOLVED';
    reviewCommentResponseNote?: string;
  };
  createdAt: string;
}

export interface UnresolvedReviewComment {
  requestChangesEvent: AuditEvent;
  latestResubmissionEvent?: AuditEvent;
}

export interface ReviewCommentThread {
  id: string;
  recordId: string;
  section: ReviewCommentSection;
  text: string;
  status: ReviewCommentStatus;
  createdAt: string;
  createdBy: string;
  createdByRole?: UserRole;
  addressedAt?: string;
  addressedBy?: string;
  addressedByRole?: UserRole;
  addressedNote?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolvedByRole?: UserRole;
}

export interface RecordVersion {
  id: string;
  recordId: string;
  versionNumber: number;
  editedBy: string;
  changeNote?: string;
  changeReason?: string;
  snapshot: KnowledgeRecord;
  createdAt: string;
}

export interface ExpertProfile {
  id: string;
  name: string;
  roleFocus: string;
  domains: string[];
  assets: string[];
  yearsExperience: number;
  retirementWindowStart?: string;
  retirementWindowEnd?: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  notes?: string;
  createdAt: string;
}

export interface HandoverTask {
  id: string;
  title: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'DONE';
  assigneeName?: string;
  dueDate?: string;
  completedAt?: string;
}

export interface HandoverPack {
  id: string;
  expertProfileId: string;
  expertName: string;
  targetRole: string;
  status: 'IN_PROGRESS' | 'READY_FOR_REVIEW' | 'COMPLETE';
  targetDate?: string;
  coverageScore: number;
  validatedCount: number;
  tasks: HandoverTask[];
  createdAt: string;
  updatedAt: string;
}
