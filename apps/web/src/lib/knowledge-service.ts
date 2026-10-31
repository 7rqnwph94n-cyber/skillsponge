import {
  ApprovalState,
  AuditEvent,
  ConfidenceLevel,
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
  RiskHotspot
} from './domain';
import {
  AuditActorInput,
  AddReviewCommentInput,
  CreateKnowledgeRecordInput,
  CreateExpertProfileInput,
  CreateHandoverPackInput,
  knowledgeRecordTypeOptions,
  KnowledgeRecordRepository,
  ReviewCommentInput,
  ResubmitForReviewInput,
  ReviewDecisionInput,
  UpdateHandoverTaskStatusInput,
  UpdateKnowledgeRecordInput
} from './knowledge-repository';
import { PrismaKnowledgeRecordRepository } from './prisma-knowledge-repository';
import { assertCanEditRecord } from './edit-policy';
import { assertCanApplyReviewDecision, requiresRationale } from './review-decision-policy';
import { assertCanResubmitForReview } from './review-resubmission-policy';
import { assertCanAddReviewComment } from './review-comment-policy';
import { isReviewCommentSection } from './review-comments';

export interface SearchFilters extends KnowledgeRecordQuery {}

export interface SearchFilterOptions {
  types: KnowledgeRecordType[];
  assets: string[];
  systems: string[];
  tasks: string[];
  symptoms: string[];
  statuses: ApprovalState[];
}

let defaultRepository: KnowledgeRecordRepository | undefined;

function getDefaultRepository(): KnowledgeRecordRepository {
  if (!defaultRepository) {
    defaultRepository = new PrismaKnowledgeRecordRepository();
  }
  return defaultRepository;
}

const CREATE_TYPES = new Set<CreateKnowledgeRecordInput['type']>(['PROCEDURE', 'FIELD_NOTE', 'FAILURE_PATTERN', 'LESSON_LEARNED']);
const VALID_STATUSES = new Set<ApprovalState>(['DRAFT', 'UNDER_REVIEW', 'APPROVED', 'ARCHIVED']);
const VALID_CONFIDENCE = new Set<ConfidenceLevel>(['LOW', 'MEDIUM', 'HIGH']);
const VALID_REVIEW_DECISIONS = new Set<ReviewDecision>(['APPROVE', 'REQUEST_CHANGES']);
const VALID_RISK_LEVELS = new Set<NonNullable<CreateExpertProfileInput['riskLevel']>>(['LOW', 'MEDIUM', 'HIGH']);

function requireNonEmpty(value: string, fieldName: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${fieldName} is required`);
  }
  return normalized;
}

function validateCreateInput(input: CreateKnowledgeRecordInput): CreateKnowledgeRecordInput {
  if (!CREATE_TYPES.has(input.type)) {
    throw new Error('Invalid record type');
  }
  if (!VALID_CONFIDENCE.has(input.confidence)) {
    throw new Error('Invalid confidence level');
  }

  return {
    ...input,
    title: requireNonEmpty(input.title, 'Title'),
    asset: requireNonEmpty(input.asset, 'Asset'),
    system: requireNonEmpty(input.system, 'System'),
    task: requireNonEmpty(input.task, 'Task'),
    symptom: requireNonEmpty(input.symptom, 'Symptom'),
    environment: requireNonEmpty(input.environment, 'Environment'),
    body: requireNonEmpty(input.body, 'Body'),
    sourceExpertId: input.sourceExpertId?.trim() || undefined,
    handoverPackId: input.handoverPackId?.trim() || undefined,
    author: requireNonEmpty(input.author, 'Author'),
    tags: input.tags.map((tag) => tag.trim()).filter(Boolean)
  };
}

function normalizeRelationId(value: string | null | undefined): string | null | undefined {
  if (value === null) return null;
  const normalized = value?.trim();
  return normalized || undefined;
}

function normalizeReviewComments(comments: ReviewCommentInput[] | undefined): ReviewCommentInput[] {
  if (!comments?.length) return [];
  return comments
    .map((comment) => ({
      section: comment.section,
      text: comment.text.trim()
    }))
    .filter((comment) => isReviewCommentSection(comment.section) && Boolean(comment.text));
}

export function createKnowledgeService(repository?: KnowledgeRecordRepository) {
  const activeRepository = repository ?? getDefaultRepository();

  return {
    async listKnowledgeRecords(filters?: SearchFilters): Promise<KnowledgeRecord[]> {
      return activeRepository.list(filters);
    },

    async getKnowledgeRecordById(id: string): Promise<KnowledgeRecord | undefined> {
      return activeRepository.getById(id);
    },

    async createKnowledgeRecord(input: CreateKnowledgeRecordInput): Promise<KnowledgeRecord> {
      return activeRepository.create(validateCreateInput(input));
    },

    async updateKnowledgeRecord(input: UpdateKnowledgeRecordInput): Promise<KnowledgeRecord | undefined> {
      if (!input.actor?.actorRole) {
        throw new Error('Actor role is required for edits.');
      }
      assertCanEditRecord(input.actor.actorRole);

      const validated = {
        ...input,
        id: requireNonEmpty(input.id, 'Record id'),
        title: requireNonEmpty(input.title, 'Title'),
        asset: requireNonEmpty(input.asset, 'Asset'),
        system: requireNonEmpty(input.system, 'System'),
        task: requireNonEmpty(input.task, 'Task'),
        symptom: requireNonEmpty(input.symptom, 'Symptom'),
        environment: requireNonEmpty(input.environment, 'Environment'),
        body: requireNonEmpty(input.body, 'Body'),
        sourceExpertId: normalizeRelationId(input.sourceExpertId),
        handoverPackId: normalizeRelationId(input.handoverPackId),
        changeReason: input.changeReason?.trim(),
        editorName: requireNonEmpty(input.editorName, 'Editor name'),
        tags: input.tags.map((tag) => tag.trim()).filter(Boolean)
      };

      if (!VALID_CONFIDENCE.has(validated.confidence)) {
        throw new Error('Invalid confidence level');
      }

      return activeRepository.updateRecord(validated);
    },

    async changeKnowledgeRecordStatus(
      id: string,
      status: ApprovalState,
      reviewer?: string,
      actor?: AuditActorInput
    ): Promise<KnowledgeRecord | undefined> {
      if (!VALID_STATUSES.has(status)) {
        throw new Error('Invalid approval state');
      }
      if (!id.trim()) {
        throw new Error('Record id is required');
      }
      return activeRepository.updateStatus(id, status, reviewer, actor);
    },

    async applyReviewDecision(input: ReviewDecisionInput): Promise<KnowledgeRecord | undefined> {
      if (!input.actor?.actorRole) {
        throw new Error('Actor role is required for review decisions.');
      }
      if (!VALID_REVIEW_DECISIONS.has(input.decision)) {
        throw new Error('Invalid review decision.');
      }

      const id = requireNonEmpty(input.id, 'Record id');
      const existing = await activeRepository.getById(id);
      if (!existing) {
        return undefined;
      }

      assertCanApplyReviewDecision(input.actor.actorRole, existing.approvalState, input.decision);

      const rationale = input.reviewerRationale?.trim();
      if (requiresRationale(input.decision) && !rationale) {
        throw new Error('Reviewer rationale is required when requesting changes.');
      }
      const comments = normalizeReviewComments(input.comments);

      return activeRepository.applyReviewDecision({
        ...input,
        id,
        reviewerName: requireNonEmpty(input.reviewerName, 'Reviewer name'),
        reviewerRationale: rationale,
        comments
      });
    },

    async addReviewComment(input: AddReviewCommentInput): Promise<KnowledgeRecord | undefined> {
      if (!input.actor?.actorRole) {
        throw new Error('Actor role is required for review comments.');
      }
      const id = requireNonEmpty(input.id, 'Record id');
      const existing = await activeRepository.getById(id);
      if (!existing) {
        return undefined;
      }
      assertCanAddReviewComment(input.actor.actorRole, existing.approvalState);
      const comments = normalizeReviewComments([input.comment]);
      if (!comments.length) {
        throw new Error('Review comment text is required.');
      }

      return activeRepository.addReviewComment({
        ...input,
        id,
        reviewerName: requireNonEmpty(input.reviewerName, 'Reviewer name'),
        comment: comments[0]
      });
    },

    async resubmitKnowledgeRecordForReview(input: ResubmitForReviewInput): Promise<KnowledgeRecord | undefined> {
      if (!input.actor?.actorRole) {
        throw new Error('Actor role is required for review resubmission.');
      }

      const id = requireNonEmpty(input.id, 'Record id');
      const existing = await activeRepository.getById(id);
      if (!existing) {
        return undefined;
      }

      const unresolved = await activeRepository.getLatestUnresolvedReviewComment(id);
      assertCanResubmitForReview(input.actor.actorRole, existing.approvalState, Boolean(unresolved));

      return activeRepository.resubmitForReview({
        ...input,
        id,
        editorName: requireNonEmpty(input.editorName, 'Editor name'),
        editorResponseNote: input.editorResponseNote?.trim(),
        addressedCommentIds: [...new Set((input.addressedCommentIds ?? []).map((id) => id.trim()).filter(Boolean))],
        relatedReviewDecisionEventId: unresolved?.requestChangesEvent.id
      });
    },

    async listReviewQueue(): Promise<KnowledgeRecord[]> {
      return activeRepository.listReviewQueue();
    },

    async getDashboardMetrics(): Promise<DashboardMetrics> {
      return activeRepository.getDashboardMetrics();
    },

    async getRiskHotspots(limit = 5): Promise<RiskHotspot[]> {
      return activeRepository.getRiskHotspots(limit);
    },

    async getFilterOptions(): Promise<SearchFilterOptions> {
      return {
        types: knowledgeRecordTypeOptions,
        assets: await activeRepository.getDistinctValues('asset'),
        systems: await activeRepository.getDistinctValues('system'),
        tasks: await activeRepository.getDistinctValues('task'),
        symptoms: await activeRepository.getDistinctValues('symptom'),
        statuses: ['DRAFT', 'UNDER_REVIEW', 'APPROVED', 'ARCHIVED']
      };
    },

    async getRelatedRecords(record: KnowledgeRecord): Promise<KnowledgeRecord[]> {
      const related = await Promise.all(record.relatedRecordIds.map((relatedId) => activeRepository.getById(relatedId)));
      return related.filter((item): item is KnowledgeRecord => Boolean(item));
    },

    async listAuditEvents(recordId: string): Promise<AuditEvent[]> {
      if (!recordId.trim()) {
        return [];
      }
      return activeRepository.listAuditEvents(recordId);
    },

    async listRecordVersions(recordId: string): Promise<RecordVersion[]> {
      if (!recordId.trim()) {
        return [];
      }
      return activeRepository.listVersions(recordId);
    },

    async getLatestUnresolvedReviewComment(recordId: string): Promise<UnresolvedReviewComment | undefined> {
      if (!recordId.trim()) {
        return undefined;
      }
      return activeRepository.getLatestUnresolvedReviewComment(recordId);
    },

    async listReviewComments(recordId: string): Promise<ReviewCommentThread[]> {
      if (!recordId.trim()) {
        return [];
      }
      return activeRepository.listReviewComments(recordId);
    },

    async listExpertProfiles(): Promise<ExpertProfile[]> {
      return activeRepository.listExpertProfiles();
    },

    async createExpertProfile(input: CreateExpertProfileInput): Promise<ExpertProfile> {
      const normalizedRiskLevel = input.riskLevel ?? 'MEDIUM';
      if (!VALID_RISK_LEVELS.has(normalizedRiskLevel)) {
        throw new Error('Invalid risk level');
      }

      return activeRepository.createExpertProfile({
        ...input,
        name: requireNonEmpty(input.name, 'Name'),
        roleFocus: requireNonEmpty(input.roleFocus, 'Role focus'),
        domains: input.domains.map((domain) => domain.trim()).filter(Boolean),
        assets: input.assets.map((asset) => asset.trim()).filter(Boolean),
        yearsExperience: Number.isFinite(input.yearsExperience) ? Math.max(0, Math.trunc(input.yearsExperience)) : 0,
        riskLevel: normalizedRiskLevel,
        notes: input.notes?.trim() || undefined
      });
    },

    async listHandoverPacks(): Promise<HandoverPack[]> {
      return activeRepository.listHandoverPacks();
    },

    async createHandoverPack(input: CreateHandoverPackInput): Promise<HandoverPack | undefined> {
      return activeRepository.createHandoverPack({
        ...input,
        expertProfileId: requireNonEmpty(input.expertProfileId, 'Expert profile id'),
        targetRole: requireNonEmpty(input.targetRole, 'Target role'),
        taskTitles: input.taskTitles.map((title) => title.trim()).filter(Boolean)
      });
    },

    async updateHandoverTaskStatus(input: UpdateHandoverTaskStatusInput): Promise<HandoverPack | undefined> {
      return activeRepository.updateHandoverTaskStatus({
        ...input,
        handoverPackId: requireNonEmpty(input.handoverPackId, 'Handover pack id'),
        taskId: requireNonEmpty(input.taskId, 'Task id'),
        assigneeName: input.assigneeName?.trim() || undefined
      });
    }
  };
}

let defaultService: ReturnType<typeof createKnowledgeService> | undefined;

function getDefaultService() {
  if (!defaultService) {
    defaultService = createKnowledgeService(getDefaultRepository());
  }
  return defaultService;
}

export const listKnowledgeRecords = (...args: Parameters<ReturnType<typeof createKnowledgeService>['listKnowledgeRecords']>) =>
  getDefaultService().listKnowledgeRecords(...args);
export const getKnowledgeRecordById = (...args: Parameters<ReturnType<typeof createKnowledgeService>['getKnowledgeRecordById']>) =>
  getDefaultService().getKnowledgeRecordById(...args);
export const createKnowledgeRecord = (...args: Parameters<ReturnType<typeof createKnowledgeService>['createKnowledgeRecord']>) =>
  getDefaultService().createKnowledgeRecord(...args);
export const updateKnowledgeRecord = (...args: Parameters<ReturnType<typeof createKnowledgeService>['updateKnowledgeRecord']>) =>
  getDefaultService().updateKnowledgeRecord(...args);
export const changeKnowledgeRecordStatus = (...args: Parameters<ReturnType<typeof createKnowledgeService>['changeKnowledgeRecordStatus']>) =>
  getDefaultService().changeKnowledgeRecordStatus(...args);
export const applyReviewDecision = (...args: Parameters<ReturnType<typeof createKnowledgeService>['applyReviewDecision']>) =>
  getDefaultService().applyReviewDecision(...args);
export const addReviewComment = (...args: Parameters<ReturnType<typeof createKnowledgeService>['addReviewComment']>) =>
  getDefaultService().addReviewComment(...args);
export const resubmitKnowledgeRecordForReview = (...args: Parameters<ReturnType<typeof createKnowledgeService>['resubmitKnowledgeRecordForReview']>) =>
  getDefaultService().resubmitKnowledgeRecordForReview(...args);
export const listReviewQueue = (...args: Parameters<ReturnType<typeof createKnowledgeService>['listReviewQueue']>) =>
  getDefaultService().listReviewQueue(...args);
export const getDashboardMetrics = (...args: Parameters<ReturnType<typeof createKnowledgeService>['getDashboardMetrics']>) =>
  getDefaultService().getDashboardMetrics(...args);
export const getRiskHotspots = (...args: Parameters<ReturnType<typeof createKnowledgeService>['getRiskHotspots']>) =>
  getDefaultService().getRiskHotspots(...args);
export const getFilterOptions = (...args: Parameters<ReturnType<typeof createKnowledgeService>['getFilterOptions']>) =>
  getDefaultService().getFilterOptions(...args);
export const getRelatedRecords = (...args: Parameters<ReturnType<typeof createKnowledgeService>['getRelatedRecords']>) =>
  getDefaultService().getRelatedRecords(...args);
export const listAuditEvents = (...args: Parameters<ReturnType<typeof createKnowledgeService>['listAuditEvents']>) =>
  getDefaultService().listAuditEvents(...args);
export const listRecordVersions = (...args: Parameters<ReturnType<typeof createKnowledgeService>['listRecordVersions']>) =>
  getDefaultService().listRecordVersions(...args);
export const getLatestUnresolvedReviewComment = (...args: Parameters<ReturnType<typeof createKnowledgeService>['getLatestUnresolvedReviewComment']>) =>
  getDefaultService().getLatestUnresolvedReviewComment(...args);
export const listReviewComments = (...args: Parameters<ReturnType<typeof createKnowledgeService>['listReviewComments']>) =>
  getDefaultService().listReviewComments(...args);
export const listExpertProfiles = (...args: Parameters<ReturnType<typeof createKnowledgeService>['listExpertProfiles']>) =>
  getDefaultService().listExpertProfiles(...args);
export const createExpertProfile = (...args: Parameters<ReturnType<typeof createKnowledgeService>['createExpertProfile']>) =>
  getDefaultService().createExpertProfile(...args);
export const listHandoverPacks = (...args: Parameters<ReturnType<typeof createKnowledgeService>['listHandoverPacks']>) =>
  getDefaultService().listHandoverPacks(...args);
export const createHandoverPack = (...args: Parameters<ReturnType<typeof createKnowledgeService>['createHandoverPack']>) =>
  getDefaultService().createHandoverPack(...args);
export const updateHandoverTaskStatus = (...args: Parameters<ReturnType<typeof createKnowledgeService>['updateHandoverTaskStatus']>) =>
  getDefaultService().updateHandoverTaskStatus(...args);

export function getTypeLabel(type: KnowledgeRecordType): string {
  return type.replaceAll('_', ' ');
}
