export type Role =
  | 'TECHNICIAN'
  | 'SENIOR_TECHNICIAN'
  | 'SUPERVISOR'
  | 'REVIEWER'
  | 'ADMIN';

export type KnowledgeType =
  | 'JOB_STORY'
  | 'PROCEDURE'
  | 'FIELD_NOTE'
  | 'FAILURE_PATTERN'
  | 'DECISION_RATIONALE'
  | 'LESSON_LEARNED'
  | 'EXPERT_INTERVIEW'
  | 'SHADOWING_RECORD';

export type KnowledgeStatus = 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'ARCHIVED';

export interface KnowledgeItemContract {
  id: string;
  type: KnowledgeType;
  title: string;
  summary?: string;
  body?: string;
  status: KnowledgeStatus;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  source: 'DIRECT_EXPERIENCE' | 'INTERVIEW' | 'HISTORICAL_JOB' | 'IMPORTED_DOC';
  taxonomy: {
    assetCode?: string;
    systemCode?: string;
    taskCode?: string;
    symptomCode?: string;
    environmentCode?: string;
  };
  tags: string[];
  authorId: string;
  reviewerId?: string;
  media: {
    kind: 'photo' | 'audio' | 'video' | 'document';
    objectKey: string;
    caption?: string;
  }[];
  relatedRecordIds: string[];
  version: number;
  lastValidatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpertInterviewTemplate {
  whatNoviceMisses: string;
  topThreeDangerSigns: string;
  similarButDifferentFault: string;
  firstCheckBeforeOpening: string;
  whatManualMisses: string;
}
