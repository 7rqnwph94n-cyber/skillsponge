import { Prisma, KnowledgeRecord as DbKnowledgeRecord, ApprovalState as DbApprovalState, PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { getPrismaClient } from './prisma';
import {
  ApprovalState,
  AuditEvent,
  DashboardMetrics,
  ExpertProfile,
  HandoverPack,
  HandoverTask,
  KnowledgeRecord,
  KnowledgeRecordQuery,
  ReviewCommentThread,
  KnowledgeRecordType,
  RecordVersion,
  UnresolvedReviewComment,
  RiskHotspot
} from './domain';
import {
  AuditActorInput,
  AddReviewCommentInput,
  canTransitionStatus,
  CreateExpertProfileInput,
  CreateHandoverPackInput,
  CreateKnowledgeRecordInput,
  KnowledgeRecordRepository,
  ResubmitForReviewInput,
  ReviewDecisionInput,
  UpdateHandoverTaskStatusInput,
  UpdateKnowledgeRecordInput
} from './knowledge-repository';
import { hasMeaningfulEditChange } from './edit-change';
import { getTargetStatusForReviewDecision } from './review-decision-policy';
import { assertCanResubmitForReview } from './review-resubmission-policy';
import { deriveReviewComments, getUnresolvedReviewComments } from './review-comments';

const RECORD_INCLUDE = {
  relatedFrom: { select: { toRecordId: true } },
  sourceExpert: { select: { id: true, name: true } },
  handoverPack: { select: { id: true } }
} as const;

function formatDate(date: Date | null | undefined): string | undefined {
  if (!date) return undefined;
  return date.toISOString().slice(0, 10);
}

function getSummary(body: string): string {
  return body.length > 160 ? `${body.slice(0, 157)}...` : body;
}

function getKeywordHaystack(record: KnowledgeRecord): string {
  const specialized =
    record.type === 'PROCEDURE'
      ? record.steps.join(' ')
      : record.type === 'FIELD_NOTE'
      ? `${record.observation} ${record.immediateAction}`
      : record.type === 'FAILURE_PATTERN'
      ? `${record.patternSignals.join(' ')} ${record.likelyCauses.join(' ')}`
      : record.type === 'LESSON_LEARNED'
      ? record.lessonPoints.join(' ')
      : record.type === 'EXPERT_INTERVIEW'
      ? Object.values(record.answers).join(' ')
      : `${record.sessionOutcome} ${record.seniorTechnician} ${record.juniorTechnician}`;

  return [record.title, record.summary, record.body, record.tags.join(' '), specialized].join(' ').toLowerCase();
}

function toTypePayload(input: CreateKnowledgeRecordInput): Prisma.InputJsonValue {
  if (input.type === 'PROCEDURE') {
    return { steps: input.body.split('\n').filter(Boolean) };
  }

  if (input.type === 'FIELD_NOTE') {
    return {
      observation: input.body.split('\n')[0] ?? input.body,
      immediateAction: input.body.split('\n')[1] ?? 'Follow standard supervisor escalation criteria.'
    };
  }

  if (input.type === 'FAILURE_PATTERN') {
    return {
      patternSignals: input.body.split('\n').slice(0, 2).filter(Boolean),
      likelyCauses: input.body.split('\n').slice(2).filter(Boolean)
    };
  }

  return {
    lessonPoints: input.body.split('\n').filter(Boolean)
  };
}

function toTypePayloadForRecord(type: KnowledgeRecordType, body: string, existingPayload?: unknown): Prisma.InputJsonValue {
  if (type === 'PROCEDURE') {
    return { steps: body.split('\n').filter(Boolean) };
  }

  if (type === 'FIELD_NOTE') {
    return {
      observation: body.split('\n')[0] ?? body,
      immediateAction: body.split('\n')[1] ?? 'Follow standard supervisor escalation criteria.'
    };
  }

  if (type === 'FAILURE_PATTERN') {
    return {
      patternSignals: body.split('\n').slice(0, 2).filter(Boolean),
      likelyCauses: body.split('\n').slice(2).filter(Boolean)
    };
  }

  if (type === 'LESSON_LEARNED') {
    return {
      lessonPoints: body.split('\n').filter(Boolean)
    };
  }

  return (existingPayload ?? null) as Prisma.InputJsonValue;
}

function asArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function toAuditMetadata(value: unknown): AuditEvent['metadata'] | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const metadata = value as Record<string, unknown>;
  const changeReason =
    typeof metadata.changeReason === 'string'
      ? metadata.changeReason
      : typeof metadata.reason === 'string'
      ? metadata.reason
      : undefined;
  const reviewDecision = metadata.reviewDecision === 'APPROVE' || metadata.reviewDecision === 'REQUEST_CHANGES' ? metadata.reviewDecision : undefined;
  const reviewerRationale = typeof metadata.reviewerRationale === 'string' ? metadata.reviewerRationale : undefined;
  const editorResponseNote = typeof metadata.editorResponseNote === 'string' ? metadata.editorResponseNote : undefined;
  const relatedReviewDecisionEventId = typeof metadata.relatedReviewDecisionEventId === 'string' ? metadata.relatedReviewDecisionEventId : undefined;
  const reviewCommentId = typeof metadata.reviewCommentId === 'string' ? metadata.reviewCommentId : undefined;
  const reviewCommentSection = (() => {
    const candidate = metadata.reviewCommentSection;
    if (
      candidate === 'TITLE' ||
      candidate === 'BODY' ||
      candidate === 'TAXONOMY' ||
      candidate === 'TAGS' ||
      candidate === 'CONFIDENCE' ||
      candidate === 'TYPE_PAYLOAD'
    ) {
      return candidate;
    }
    return undefined;
  })();
  const reviewCommentText = typeof metadata.reviewCommentText === 'string' ? metadata.reviewCommentText : undefined;
  const reviewCommentStatus = (() => {
    const candidate = metadata.reviewCommentStatus;
    if (candidate === 'OPEN' || candidate === 'ADDRESSED' || candidate === 'RESOLVED') {
      return candidate;
    }
    return undefined;
  })();
  const reviewCommentAction =
    metadata.reviewCommentAction === 'ADDRESSED' || metadata.reviewCommentAction === 'RESOLVED' ? metadata.reviewCommentAction : undefined;
  const reviewCommentResponseNote = typeof metadata.reviewCommentResponseNote === 'string' ? metadata.reviewCommentResponseNote : undefined;

  if (
    !changeReason &&
    !reviewDecision &&
    !reviewerRationale &&
    !editorResponseNote &&
    !relatedReviewDecisionEventId &&
    !reviewCommentId &&
    !reviewCommentSection &&
    !reviewCommentText &&
    !reviewCommentStatus &&
    !reviewCommentAction &&
    !reviewCommentResponseNote
  ) {
    return undefined;
  }
  return {
    changeReason,
    reviewDecision,
    reviewerRationale,
    editorResponseNote,
    relatedReviewDecisionEventId,
    reviewCommentId,
    reviewCommentSection,
    reviewCommentText,
    reviewCommentStatus,
    reviewCommentAction,
    reviewCommentResponseNote
  };
}

function mapDbAuditEvent(row: {
  id: string;
  knowledgeRecordId: string;
  actorName: string;
  actorRole: string | null;
  eventType: string;
  fromStatus: DbApprovalState | null;
  toStatus: DbApprovalState | null;
  metadata: unknown;
  createdAt: Date;
}): AuditEvent {
  return {
    id: row.id,
    recordId: row.knowledgeRecordId,
    actorName: row.actorName,
    actorRole: (row.actorRole as AuditEvent['actorRole']) ?? undefined,
    eventType: row.eventType as AuditEvent['eventType'],
    fromStatus: (row.fromStatus as ApprovalState | null) ?? undefined,
    toStatus: (row.toStatus as ApprovalState | null) ?? undefined,
    metadata: toAuditMetadata(row.metadata),
    createdAt: row.createdAt.toISOString()
  };
}

function mapDbRecord(
  record: DbKnowledgeRecord & {
    relatedFrom: { toRecordId: string }[];
    sourceExpert: { id: string; name: string } | null;
    handoverPack: { id: string } | null;
  }
): KnowledgeRecord {
  const payload = (record.typePayload ?? {}) as Record<string, unknown>;

  const base = {
    id: record.id,
    type: record.type as KnowledgeRecordType,
    title: record.title,
    summary: record.summary,
    body: record.body,
    author: record.author,
    reviewer: record.reviewer ?? undefined,
    sourceExpertId: record.sourceExpertId ?? undefined,
    sourceExpertName: record.sourceExpert?.name ?? undefined,
    handoverPackId: record.handoverPackId ?? undefined,
    approvalState: record.approvalState as ApprovalState,
    confidence: record.confidence,
    currentVersion: record.currentVersion,
    createdAt: formatDate(record.createdAt) ?? '',
    lastValidatedAt: formatDate(record.lastValidatedAt),
    scope: (record.scope as KnowledgeRecord['scope']) ?? undefined,
    tags: record.tags,
    relatedRecordIds: record.relatedFrom.map((relation) => relation.toRecordId),
    context: {
      asset: record.asset,
      system: record.system,
      task: record.task,
      symptom: record.symptom,
      environment: record.environment
    }
  };

  if (record.type === 'PROCEDURE') {
    return { ...base, type: 'PROCEDURE', steps: asArray(payload.steps) };
  }

  if (record.type === 'FIELD_NOTE') {
    return {
      ...base,
      type: 'FIELD_NOTE',
      observation: asString(payload.observation) ?? base.body,
      immediateAction: asString(payload.immediateAction) ?? 'Follow standard supervisor escalation criteria.'
    };
  }

  if (record.type === 'FAILURE_PATTERN') {
    return {
      ...base,
      type: 'FAILURE_PATTERN',
      patternSignals: asArray(payload.patternSignals),
      likelyCauses: asArray(payload.likelyCauses)
    };
  }

  if (record.type === 'LESSON_LEARNED') {
    return {
      ...base,
      type: 'LESSON_LEARNED',
      lessonPoints: asArray(payload.lessonPoints)
    };
  }

  if (record.type === 'EXPERT_INTERVIEW') {
    const rawAnswers = (payload.answers ?? {}) as Record<string, unknown>;
    return {
      ...base,
      type: 'EXPERT_INTERVIEW',
      expertName: asString(payload.expertName) ?? 'Unknown expert',
      answers: {
        whatNoviceMisses: asString(rawAnswers.whatNoviceMisses) ?? '',
        topThreeDangerSigns: asString(rawAnswers.topThreeDangerSigns) ?? '',
        similarButDifferentFault: asString(rawAnswers.similarButDifferentFault) ?? '',
        firstCheckBeforeOpening: asString(rawAnswers.firstCheckBeforeOpening) ?? '',
        whatManualMisses: asString(rawAnswers.whatManualMisses) ?? ''
      }
    };
  }

  return {
    ...base,
    type: 'SHADOWING_RECORD',
    seniorTechnician: asString(payload.seniorTechnician) ?? '',
    juniorTechnician: asString(payload.juniorTechnician) ?? '',
    competencyScore: Number(payload.competencyScore ?? 0),
    sessionOutcome: asString(payload.sessionOutcome) ?? ''
  };
}

function cloneSnapshot(record: KnowledgeRecord): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(record)) as Prisma.InputJsonValue;
}

function applyClientSideKeyword(records: KnowledgeRecord[], keyword?: string): KnowledgeRecord[] {
  if (!keyword?.trim()) return records;
  const normalized = keyword.trim().toLowerCase();
  return records.filter((record) => getKeywordHaystack(record).includes(normalized));
}

function buildWhere(query?: KnowledgeRecordQuery): Prisma.KnowledgeRecordWhereInput {
  const where: Prisma.KnowledgeRecordWhereInput = {};

  if (!query) return where;

  if (query.type && query.type !== 'ALL') {
    where.type = query.type;
  }

  if (query.status && query.status !== 'ALL') {
    where.approvalState = query.status as DbApprovalState;
  }

  if (query.asset?.trim()) where.asset = query.asset.trim();
  if (query.system?.trim()) where.system = query.system.trim();
  if (query.task?.trim()) where.task = query.task.trim();
  if (query.symptom?.trim()) where.symptom = query.symptom.trim();
  if (query.scope) where.scope = query.scope;

  return where;
}

function resolveLatestUnresolvedReviewComment(events: AuditEvent[]): UnresolvedReviewComment | undefined {
  const latestRequestChangesIndex = events.findIndex(
    (event) => event.eventType === 'REVIEW_DECISION' && event.metadata?.reviewDecision === 'REQUEST_CHANGES'
  );
  if (latestRequestChangesIndex === -1) {
    return undefined;
  }
  const latestRequestChanges = events[latestRequestChangesIndex];

  const newerEvents = events.slice(0, latestRequestChangesIndex);
  const isResolved = newerEvents.some(
    (event) => event.eventType === 'REVIEW_DECISION' && event.id !== latestRequestChanges.id
  );
  if (isResolved) {
    return undefined;
  }

  const latestResubmissionEvent = newerEvents.find((event) => event.eventType === 'REVIEW_RESUBMITTED');

  return {
    requestChangesEvent: latestRequestChanges,
    latestResubmissionEvent
  };
}

function mapReviewCommentAuditRows(
  rows: Array<{
    id: string;
    knowledgeRecordId: string;
    actorName: string;
    actorRole: string | null;
    eventType: string;
    fromStatus: DbApprovalState | null;
    toStatus: DbApprovalState | null;
    metadata: unknown;
    createdAt: Date;
  }>
): AuditEvent[] {
  return rows.map(mapDbAuditEvent);
}

function mapExpertProfileRow(row: {
  id: string;
  name: string;
  roleFocus: string;
  domains: string[];
  assets: string[];
  yearsExperience: number;
  retirementWindowStart: Date | null;
  retirementWindowEnd: Date | null;
  riskLevel: string;
  notes: string | null;
  createdAt: Date;
}): ExpertProfile {
  return {
    id: row.id,
    name: row.name,
    roleFocus: row.roleFocus,
    domains: row.domains,
    assets: row.assets,
    yearsExperience: row.yearsExperience,
    retirementWindowStart: formatDate(row.retirementWindowStart),
    retirementWindowEnd: formatDate(row.retirementWindowEnd),
    riskLevel: (row.riskLevel === 'LOW' || row.riskLevel === 'HIGH' ? row.riskLevel : 'MEDIUM') as ExpertProfile['riskLevel'],
    notes: row.notes ?? undefined,
    createdAt: row.createdAt.toISOString()
  };
}

function mapHandoverTaskRow(row: {
  id: string;
  title: string;
  status: string;
  assigneeName: string | null;
  dueDate: Date | null;
  completedAt: Date | null;
}): HandoverTask {
  return {
    id: row.id,
    title: row.title,
    status: (row.status === 'IN_PROGRESS' || row.status === 'DONE' ? row.status : 'OPEN') as HandoverTask['status'],
    assigneeName: row.assigneeName ?? undefined,
    dueDate: formatDate(row.dueDate),
    completedAt: row.completedAt?.toISOString()
  };
}

function mapHandoverPackRow(row: {
  id: string;
  expertProfileId: string;
  targetRole: string;
  status: string;
  targetDate: Date | null;
  coverageScore: number;
  validatedCount: number;
  createdAt: Date;
  updatedAt: Date;
  expertProfile: { name: string };
  tasks: Array<{ id: string; title: string; status: string; assigneeName: string | null; dueDate: Date | null; completedAt: Date | null }>;
}): HandoverPack {
  return {
    id: row.id,
    expertProfileId: row.expertProfileId,
    expertName: row.expertProfile.name,
    targetRole: row.targetRole,
    status: (row.status === 'READY_FOR_REVIEW' || row.status === 'COMPLETE' ? row.status : 'IN_PROGRESS') as HandoverPack['status'],
    targetDate: formatDate(row.targetDate),
    coverageScore: row.coverageScore,
    validatedCount: row.validatedCount,
    tasks: row.tasks.map(mapHandoverTaskRow),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function computeCoverageScore(tasks: Array<{ status: string }>): number {
  if (!tasks.length) return 0;
  const done = tasks.filter((task) => task.status === 'DONE').length;
  return Math.round((done / tasks.length) * 100);
}

export class PrismaKnowledgeRecordRepository implements KnowledgeRecordRepository {
  constructor(private readonly db: PrismaClient = getPrismaClient()) {}

  async list(query?: KnowledgeRecordQuery): Promise<KnowledgeRecord[]> {
    const rows = await this.db.knowledgeRecord.findMany({
      where: buildWhere(query),
      include: RECORD_INCLUDE,
      orderBy: { createdAt: 'desc' }
    });

    const mapped = rows.map(mapDbRecord);
    return applyClientSideKeyword(mapped, query?.keyword);
  }

  async getById(id: string): Promise<KnowledgeRecord | undefined> {
    const row = await this.db.knowledgeRecord.findUnique({
      where: { id },
      include: RECORD_INCLUDE
    });

    return row ? mapDbRecord(row) : undefined;
  }

  async create(input: CreateKnowledgeRecordInput): Promise<KnowledgeRecord> {
    const row = await this.db.$transaction(async (tx) => {
      const created = await tx.knowledgeRecord.create({
        data: {
          type: input.type,
          title: input.title,
          summary: getSummary(input.body),
          body: input.body,
          author: input.author,
          approvalState: 'DRAFT',
          confidence: input.confidence,
          asset: input.asset,
          system: input.system,
          task: input.task,
          symptom: input.symptom,
          environment: input.environment,
          tags: input.tags,
          sourceExpertId: input.sourceExpertId,
          handoverPackId: input.handoverPackId,
          currentVersion: 1,
          typePayload: toTypePayload(input)
        }
      });

      const createdMapped = mapDbRecord({ ...created, relatedFrom: [], sourceExpert: null, handoverPack: null });

      await tx.knowledgeRecordVersion.create({
        data: {
          knowledgeRecordId: created.id,
          versionNumber: 1,
          editedBy: input.author,
          changeNote: 'Initial version',
          snapshot: createdMapped as unknown as Prisma.InputJsonValue
        }
      });

      await tx.auditEvent.create({
        data: {
          knowledgeRecordId: created.id,
          actorUserId: input.actor?.actorUserId,
          actorName: input.actor?.actorName ?? input.author,
          actorRole: input.actor?.actorRole,
          eventType: 'RECORD_CREATED',
          toStatus: 'DRAFT'
        }
      });

      return tx.knowledgeRecord.findUniqueOrThrow({
        where: { id: created.id },
        include: RECORD_INCLUDE
      });
    });

    return mapDbRecord(row);
  }

  async updateRecord(input: UpdateKnowledgeRecordInput): Promise<KnowledgeRecord | undefined> {
    const existing = await this.db.knowledgeRecord.findUnique({
      where: { id: input.id },
      include: RECORD_INCLUDE
    });
    if (!existing) return undefined;
    const existingMapped = mapDbRecord(existing);
    if (!hasMeaningfulEditChange(existingMapped, input)) {
      return existingMapped;
    }

    const approvedChangeReason = existing.approvalState === 'APPROVED' ? input.changeReason?.trim() : undefined;
    if (existing.approvalState === 'APPROVED' && !approvedChangeReason) {
      throw new Error('Change reason is required when editing an APPROVED record.');
    }

    const nextVersion = existing.currentVersion + 1;
    const nextStatus: ApprovalState = existing.approvalState === 'APPROVED' ? 'UNDER_REVIEW' : (existing.approvalState as ApprovalState);

    const row = await this.db.$transaction(async (tx) => {
      const updated = await tx.knowledgeRecord.update({
        where: { id: input.id },
        data: {
          title: input.title,
          summary: getSummary(input.body),
          body: input.body,
          confidence: input.confidence,
          asset: input.asset,
          system: input.system,
          task: input.task,
          symptom: input.symptom,
          environment: input.environment,
          tags: input.tags,
          sourceExpertId: input.sourceExpertId,
          handoverPackId: input.handoverPackId,
          approvalState: nextStatus,
          currentVersion: nextVersion,
          typePayload: toTypePayloadForRecord(existing.type as KnowledgeRecordType, input.body, existing.typePayload)
        },
        include: RECORD_INCLUDE
      });

      const mapped = mapDbRecord(updated);

      await tx.knowledgeRecordVersion.create({
        data: {
          knowledgeRecordId: updated.id,
          versionNumber: nextVersion,
          editedBy: input.editorName,
          changeNote: input.changeNote?.trim() || 'Edited record',
          changeReason: approvedChangeReason,
          snapshot: cloneSnapshot(mapped)
        }
      });

      if (existing.approvalState === 'APPROVED') {
        await tx.auditEvent.create({
          data: {
            knowledgeRecordId: updated.id,
            actorUserId: input.actor?.actorUserId,
            actorName: input.actor?.actorName ?? input.editorName,
            actorRole: input.actor?.actorRole,
            eventType: 'STATUS_CHANGED',
            fromStatus: 'APPROVED',
            toStatus: 'UNDER_REVIEW',
            metadata: {
              changeReason: approvedChangeReason
            }
          }
        });
      }

      return updated;
    });

    return mapDbRecord(row);
  }

  async applyReviewDecision(input: ReviewDecisionInput): Promise<KnowledgeRecord | undefined> {
    const existing = await this.db.knowledgeRecord.findUnique({
      where: { id: input.id }
    });
    if (!existing) return undefined;
    if (input.actor.actorRole !== 'REVIEWER' && input.actor.actorRole !== 'ADMIN') {
      throw new Error('Role is not permitted to apply this review decision.');
    }
    if (existing.approvalState !== 'UNDER_REVIEW') {
      throw new Error(`Invalid review decision transition: ${existing.approvalState} -> ${input.decision}`);
    }
    if (input.decision === 'REQUEST_CHANGES' && !input.reviewerRationale?.trim()) {
      throw new Error('Reviewer rationale is required when requesting changes.');
    }

    const targetStatus = getTargetStatusForReviewDecision(input.decision);
    const shouldValidateNow = targetStatus === 'APPROVED';

    const row = await this.db.$transaction(async (tx) => {
      const existingCommentEvents = await tx.auditEvent.findMany({
        where: {
          knowledgeRecordId: input.id,
          eventType: { in: ['REVIEW_COMMENT_ADDED', 'REVIEW_COMMENT_STATUS_CHANGED'] }
        },
        orderBy: { createdAt: 'asc' }
      });
      const unresolvedCommentIds = getUnresolvedReviewComments(deriveReviewComments(mapReviewCommentAuditRows(existingCommentEvents))).map(
        (comment) => comment.id
      );

      const updated = await tx.knowledgeRecord.update({
        where: { id: input.id },
        data: {
          approvalState: targetStatus,
          reviewer: input.reviewerName,
          lastValidatedAt: shouldValidateNow ? new Date() : existing.lastValidatedAt
        }
      });

      await tx.auditEvent.create({
        data: {
          knowledgeRecordId: input.id,
          actorUserId: input.actor.actorUserId,
          actorName: input.actor.actorName ?? input.reviewerName,
          actorRole: input.actor.actorRole,
          eventType: 'REVIEW_DECISION',
          fromStatus: existing.approvalState,
          toStatus: targetStatus,
          metadata: {
            reviewDecision: input.decision,
            reviewerRationale: input.reviewerRationale
          }
        }
      });

      for (const comment of input.comments ?? []) {
        await tx.auditEvent.create({
          data: {
            knowledgeRecordId: input.id,
            actorUserId: input.actor.actorUserId,
            actorName: input.actor.actorName ?? input.reviewerName,
            actorRole: input.actor.actorRole,
            eventType: 'REVIEW_COMMENT_ADDED',
            metadata: {
              reviewCommentId: randomUUID(),
              reviewCommentSection: comment.section,
              reviewCommentText: comment.text,
              reviewCommentStatus: 'OPEN'
            }
          }
        });
      }

      if (input.decision === 'APPROVE') {
        for (const commentId of unresolvedCommentIds) {
          await tx.auditEvent.create({
            data: {
              knowledgeRecordId: input.id,
              actorUserId: input.actor.actorUserId,
              actorName: input.actor.actorName ?? input.reviewerName,
              actorRole: input.actor.actorRole,
              eventType: 'REVIEW_COMMENT_STATUS_CHANGED',
              metadata: {
                reviewCommentId: commentId,
                reviewCommentStatus: 'RESOLVED',
                reviewCommentAction: 'RESOLVED'
              }
            }
          });
        }
      }

      return tx.knowledgeRecord.findUniqueOrThrow({
        where: { id: updated.id },
        include: RECORD_INCLUDE
      });
    });

    return mapDbRecord(row);
  }

  async addReviewComment(input: AddReviewCommentInput): Promise<KnowledgeRecord | undefined> {
    const existing = await this.db.knowledgeRecord.findUnique({
      where: { id: input.id },
      include: RECORD_INCLUDE
    });
    if (!existing) return undefined;
    if (existing.approvalState !== 'UNDER_REVIEW') {
      throw new Error(`Invalid review comment transition: ${existing.approvalState} -> REVIEW_COMMENT_ADDED`);
    }
    if (input.actor.actorRole !== 'REVIEWER' && input.actor.actorRole !== 'ADMIN') {
      throw new Error('Role is not permitted to add review comments.');
    }

    await this.db.auditEvent.create({
      data: {
        knowledgeRecordId: input.id,
        actorUserId: input.actor.actorUserId,
        actorName: input.actor.actorName ?? input.reviewerName,
        actorRole: input.actor.actorRole,
        eventType: 'REVIEW_COMMENT_ADDED',
        metadata: {
          reviewCommentId: randomUUID(),
          reviewCommentSection: input.comment.section,
          reviewCommentText: input.comment.text,
          reviewCommentStatus: 'OPEN'
        }
      }
    });

    return mapDbRecord(existing);
  }

  async resubmitForReview(input: ResubmitForReviewInput): Promise<KnowledgeRecord | undefined> {
    const existing = await this.db.knowledgeRecord.findUnique({
      where: { id: input.id }
    });
    if (!existing) return undefined;

    if (!input.actor.actorRole) {
      throw new Error('Actor role is required for review resubmission.');
    }

    const unresolved = await this.getLatestUnresolvedReviewComment(input.id);
    assertCanResubmitForReview(input.actor.actorRole, existing.approvalState as ApprovalState, Boolean(unresolved));
    const reviewComments = await this.listReviewComments(input.id);
    const unresolvedCommentIds = new Set(getUnresolvedReviewComments(reviewComments).map((comment) => comment.id));
    const addressedCommentIds = (input.addressedCommentIds ?? []).filter((commentId) => unresolvedCommentIds.has(commentId));

    const row = await this.db.$transaction(async (tx) => {
      for (const commentId of addressedCommentIds) {
        await tx.auditEvent.create({
          data: {
            knowledgeRecordId: input.id,
            actorUserId: input.actor.actorUserId,
            actorName: input.actor.actorName ?? input.editorName,
            actorRole: input.actor.actorRole,
            eventType: 'REVIEW_COMMENT_STATUS_CHANGED',
            metadata: {
              reviewCommentId: commentId,
              reviewCommentStatus: 'ADDRESSED',
              reviewCommentAction: 'ADDRESSED',
              reviewCommentResponseNote: input.editorResponseNote?.trim()
            }
          }
        });
      }

      const updated = await tx.knowledgeRecord.update({
        where: { id: input.id },
        data: {
          approvalState: 'UNDER_REVIEW'
        }
      });

      await tx.auditEvent.create({
        data: {
          knowledgeRecordId: input.id,
          actorUserId: input.actor.actorUserId,
          actorName: input.actor.actorName ?? input.editorName,
          actorRole: input.actor.actorRole,
          eventType: 'REVIEW_RESUBMITTED',
          fromStatus: existing.approvalState,
          toStatus: 'UNDER_REVIEW',
          metadata: {
            editorResponseNote: input.editorResponseNote?.trim(),
            relatedReviewDecisionEventId: unresolved?.requestChangesEvent.id ?? input.relatedReviewDecisionEventId
          }
        }
      });

      return tx.knowledgeRecord.findUniqueOrThrow({
        where: { id: updated.id },
        include: RECORD_INCLUDE
      });
    });

    return mapDbRecord(row);
  }

  async updateStatus(id: string, status: ApprovalState, reviewer?: string, actor?: AuditActorInput): Promise<KnowledgeRecord | undefined> {
    const existing = await this.db.knowledgeRecord.findUnique({ where: { id } });
    if (!existing) return undefined;

    const currentStatus = existing.approvalState as ApprovalState;
    if (!canTransitionStatus(currentStatus, status)) {
      throw new Error(`Invalid status transition: ${currentStatus} -> ${status}`);
    }

    const row = await this.db.$transaction(async (tx) => {
      const updated = await tx.knowledgeRecord.update({
        where: { id },
        data: {
          approvalState: status,
          reviewer: reviewer ?? existing.reviewer,
          lastValidatedAt: status === 'APPROVED' ? new Date() : existing.lastValidatedAt
        }
      });

      await tx.auditEvent.create({
        data: {
          knowledgeRecordId: id,
          actorUserId: actor?.actorUserId,
          actorName: actor?.actorName ?? reviewer ?? 'Unknown actor',
          actorRole: actor?.actorRole,
          eventType: 'STATUS_CHANGED',
          fromStatus: existing.approvalState,
          toStatus: status
        }
      });

      return tx.knowledgeRecord.findUniqueOrThrow({
        where: { id: updated.id },
        include: RECORD_INCLUDE
      });
    });

    return mapDbRecord(row);
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const [totalRecords, approvedRecords, draftRecords, expertInterviewsCaptured, shadowingRecordsCaptured, atRiskExperts, openHandoverPacks] = await Promise.all([
      this.db.knowledgeRecord.count(),
      this.db.knowledgeRecord.count({ where: { approvalState: 'APPROVED' } }),
      this.db.knowledgeRecord.count({ where: { approvalState: 'DRAFT' } }),
      this.db.knowledgeRecord.count({ where: { type: 'EXPERT_INTERVIEW' } }),
      this.db.knowledgeRecord.count({ where: { type: 'SHADOWING_RECORD' } }),
      this.db.expertProfile.count({ where: { riskLevel: 'HIGH' } }),
      this.db.handoverPack.count({ where: { status: { in: ['IN_PROGRESS', 'READY_FOR_REVIEW'] } } })
    ]);

    return { totalRecords, approvedRecords, draftRecords, expertInterviewsCaptured, shadowingRecordsCaptured, atRiskExperts, openHandoverPacks };
  }

  async getRiskHotspots(limit: number): Promise<RiskHotspot[]> {
    const rows = await this.db.knowledgeRecord.findMany({
      select: { asset: true, task: true, approvalState: true }
    });

    const groups = new Map<string, { asset: string; task: string; total: number; approved: number }>();

    for (const row of rows) {
      const key = `${row.asset}::${row.task}`;
      const group = groups.get(key) ?? { asset: row.asset, task: row.task, total: 0, approved: 0 };
      group.total += 1;
      if (row.approvalState === 'APPROVED') group.approved += 1;
      groups.set(key, group);
    }

    return [...groups.entries()]
      .map(([key, value]) => {
        const lowCoverage = value.approved === 0 ? 60 : value.approved === 1 ? 30 : 10;
        const lowVolume = value.total <= 1 ? 30 : value.total === 2 ? 15 : 5;
        const riskScore = lowCoverage + lowVolume;
        const reason = value.approved === 0 ? 'No approved records' : value.total <= 1 ? 'Only one related record' : 'Coverage is moderate';

        return {
          key,
          asset: value.asset,
          task: value.task,
          totalRecords: value.total,
          approvedRecords: value.approved,
          riskScore,
          reason
        };
      })
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, limit);
  }

  async listReviewQueue(): Promise<KnowledgeRecord[]> {
    const rows = await this.db.knowledgeRecord.findMany({
      where: { approvalState: { in: ['DRAFT', 'UNDER_REVIEW'] } },
      include: RECORD_INCLUDE,
      orderBy: { createdAt: 'desc' }
    });
    return rows.map(mapDbRecord);
  }

  async getDistinctValues(field: 'asset' | 'system' | 'task' | 'symptom'): Promise<string[]> {
    const rows = await this.db.knowledgeRecord.findMany({
      select: { asset: true, system: true, task: true, symptom: true }
    });

    return [...new Set(rows.map((row) => row[field]))]
      .filter((value): value is string => typeof value === 'string' && value.length > 0)
      .sort();
  }

  async listAuditEvents(recordId: string): Promise<AuditEvent[]> {
    const rows = await this.db.auditEvent.findMany({
      where: { knowledgeRecordId: recordId },
      orderBy: { createdAt: 'desc' }
    });

    return rows.map(mapDbAuditEvent);
  }

  async getLatestUnresolvedReviewComment(recordId: string): Promise<UnresolvedReviewComment | undefined> {
    const rows = await this.db.auditEvent.findMany({
      where: {
        knowledgeRecordId: recordId,
        eventType: { in: ['REVIEW_DECISION', 'REVIEW_RESUBMITTED'] }
      },
      orderBy: { createdAt: 'desc' }
    });
    const events = rows.map(mapDbAuditEvent);
    return resolveLatestUnresolvedReviewComment(events);
  }

  async listReviewComments(recordId: string): Promise<ReviewCommentThread[]> {
    const rows = await this.db.auditEvent.findMany({
      where: {
        knowledgeRecordId: recordId,
        eventType: { in: ['REVIEW_COMMENT_ADDED', 'REVIEW_COMMENT_STATUS_CHANGED'] }
      },
      orderBy: { createdAt: 'asc' }
    });
    return deriveReviewComments(mapReviewCommentAuditRows(rows));
  }

  async listVersions(recordId: string): Promise<RecordVersion[]> {
    const rows = await this.db.knowledgeRecordVersion.findMany({
      where: { knowledgeRecordId: recordId },
      orderBy: { versionNumber: 'desc' }
    });

    return rows.map((row) => ({
      id: row.id,
      recordId: row.knowledgeRecordId,
      versionNumber: row.versionNumber,
      editedBy: row.editedBy,
      changeNote: row.changeNote ?? undefined,
      changeReason: row.changeReason ?? undefined,
      snapshot: JSON.parse(JSON.stringify(row.snapshot)) as KnowledgeRecord,
      createdAt: row.createdAt.toISOString()
    }));
  }

  async listExpertProfiles(): Promise<ExpertProfile[]> {
    const rows = await this.db.expertProfile.findMany({
      orderBy: [{ riskLevel: 'desc' }, { yearsExperience: 'desc' }, { createdAt: 'desc' }]
    });
    return rows.map(mapExpertProfileRow);
  }

  async createExpertProfile(input: CreateExpertProfileInput): Promise<ExpertProfile> {
    const row = await this.db.expertProfile.create({
      data: {
        name: input.name,
        roleFocus: input.roleFocus,
        domains: input.domains,
        assets: input.assets,
        yearsExperience: input.yearsExperience,
        retirementWindowStart: input.retirementWindowStart ? new Date(input.retirementWindowStart) : undefined,
        retirementWindowEnd: input.retirementWindowEnd ? new Date(input.retirementWindowEnd) : undefined,
        riskLevel: input.riskLevel ?? 'MEDIUM',
        notes: input.notes
      }
    });

    return mapExpertProfileRow(row);
  }

  async listHandoverPacks(): Promise<HandoverPack[]> {
    const rows = await this.db.handoverPack.findMany({
      include: {
        expertProfile: { select: { name: true } },
        tasks: { orderBy: { createdAt: 'asc' } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return rows.map(mapHandoverPackRow);
  }

  async createHandoverPack(input: CreateHandoverPackInput): Promise<HandoverPack | undefined> {
    const expert = await this.db.expertProfile.findUnique({
      where: { id: input.expertProfileId },
      select: { id: true }
    });
    if (!expert) return undefined;

    const row = await this.db.$transaction(async (tx) => {
      const pack = await tx.handoverPack.create({
        data: {
          expertProfileId: input.expertProfileId,
          targetRole: input.targetRole,
          targetDate: input.targetDate ? new Date(input.targetDate) : undefined,
          status: 'IN_PROGRESS'
        }
      });

      if (input.taskTitles.length > 0) {
        await tx.handoverTask.createMany({
          data: input.taskTitles.map((title) => ({
            handoverPackId: pack.id,
            title,
            status: 'OPEN'
          }))
        });
      }

      const withTasks = await tx.handoverPack.findUniqueOrThrow({
        where: { id: pack.id },
        include: {
          expertProfile: { select: { name: true } },
          tasks: { orderBy: { createdAt: 'asc' } }
        }
      });
      const coverageScore = computeCoverageScore(withTasks.tasks);
      const validatedCount = withTasks.tasks.filter((task) => task.status === 'DONE').length;
      await tx.handoverPack.update({
        where: { id: pack.id },
        data: {
          coverageScore,
          validatedCount
        }
      });
      return tx.handoverPack.findUniqueOrThrow({
        where: { id: pack.id },
        include: {
          expertProfile: { select: { name: true } },
          tasks: { orderBy: { createdAt: 'asc' } }
        }
      });
    });

    return mapHandoverPackRow(row);
  }

  async updateHandoverTaskStatus(input: UpdateHandoverTaskStatusInput): Promise<HandoverPack | undefined> {
    const existingTask = await this.db.handoverTask.findFirst({
      where: {
        id: input.taskId,
        handoverPackId: input.handoverPackId
      },
      select: {
        id: true
      }
    });
    if (!existingTask) return undefined;

    const row = await this.db.$transaction(async (tx) => {
      await tx.handoverTask.update({
        where: { id: input.taskId },
        data: {
          status: input.status,
          assigneeName: input.assigneeName,
          completedAt: input.status === 'DONE' ? new Date() : null
        }
      });

      const packWithTasks = await tx.handoverPack.findUniqueOrThrow({
        where: { id: input.handoverPackId },
        include: {
          expertProfile: { select: { name: true } },
          tasks: { orderBy: { createdAt: 'asc' } }
        }
      });
      const coverageScore = computeCoverageScore(packWithTasks.tasks);
      const validatedCount = packWithTasks.tasks.filter((task) => task.status === 'DONE').length;
      const nextStatus: HandoverPack['status'] =
        coverageScore === 100 ? 'COMPLETE' : coverageScore >= 75 ? 'READY_FOR_REVIEW' : 'IN_PROGRESS';

      await tx.handoverPack.update({
        where: { id: input.handoverPackId },
        data: {
          coverageScore,
          validatedCount,
          status: nextStatus
        }
      });

      return tx.handoverPack.findUniqueOrThrow({
        where: { id: input.handoverPackId },
        include: {
          expertProfile: { select: { name: true } },
          tasks: { orderBy: { createdAt: 'asc' } }
        }
      });
    });

    return mapHandoverPackRow(row);
  }
}
