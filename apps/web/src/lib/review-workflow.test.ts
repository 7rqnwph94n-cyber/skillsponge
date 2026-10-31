import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ApprovalState,
  AuditEvent,
  DashboardMetrics,
  ExpertProfile,
  HandoverPack,
  KnowledgeRecord,
  KnowledgeRecordQuery,
  RecordVersion,
  ReviewCommentThread,
  UnresolvedReviewComment,
  RiskHotspot
} from './domain';
import { createKnowledgeService } from './knowledge-service';
import {
  AddReviewCommentInput,
  AuditActorInput,
  CreateKnowledgeRecordInput,
  CreateExpertProfileInput,
  CreateHandoverPackInput,
  KnowledgeRecordRepository,
  ResubmitForReviewInput,
  ReviewDecisionInput,
  UpdateHandoverTaskStatusInput,
  UpdateKnowledgeRecordInput
} from './knowledge-repository';
import { getTargetStatusForReviewDecision } from './review-decision-policy';
import { deriveReviewComments, getUnresolvedReviewComments } from './review-comments';

function makeUnderReviewRecord(): KnowledgeRecord {
  return {
    id: 'kr_review_1',
    type: 'PROCEDURE',
    title: 'Review target',
    summary: 'Summary',
    body: 'Body',
    author: 'Author',
    reviewer: 'Initial Reviewer',
    approvalState: 'UNDER_REVIEW',
    confidence: 'MEDIUM',
    currentVersion: 2,
    createdAt: '2026-03-10',
    tags: ['review'],
    relatedRecordIds: [],
    context: {
      asset: 'CMP-07',
      system: 'Pneumatics',
      task: 'Diagnostics',
      symptom: 'No pressure',
      environment: 'Plant A'
    },
    steps: ['step one']
  };
}

class InMemoryReviewRepository implements KnowledgeRecordRepository {
  private record: KnowledgeRecord;
  private audits: AuditEvent[] = [];
  private timestampCounter = 0;

  constructor(record: KnowledgeRecord) {
    this.record = structuredClone(record);
  }

  private nextCreatedAt() {
    this.timestampCounter += 1;
    return new Date(1700000000000 + this.timestampCounter).toISOString();
  }

  async list(_query?: KnowledgeRecordQuery): Promise<KnowledgeRecord[]> {
    return [structuredClone(this.record)];
  }

  async getById(id: string): Promise<KnowledgeRecord | undefined> {
    return id === this.record.id ? structuredClone(this.record) : undefined;
  }

  async create(_input: CreateKnowledgeRecordInput): Promise<KnowledgeRecord> {
    throw new Error('Not used');
  }

  async updateRecord(_input: UpdateKnowledgeRecordInput): Promise<KnowledgeRecord | undefined> {
    throw new Error('Not used');
  }

  async applyReviewDecision(input: ReviewDecisionInput): Promise<KnowledgeRecord | undefined> {
    if (input.id !== this.record.id) return undefined;

    const nextStatus = getTargetStatusForReviewDecision(input.decision);
    const previous = this.record.approvalState;
    this.record = {
      ...this.record,
      approvalState: nextStatus,
      reviewer: input.reviewerName
    };

    this.audits.unshift({
      id: `audit_${this.audits.length + 1}`,
      recordId: input.id,
      actorName: input.actor.actorName,
      actorRole: input.actor.actorRole,
      eventType: 'REVIEW_DECISION',
      fromStatus: previous,
      toStatus: nextStatus,
      metadata: {
        reviewDecision: input.decision,
        reviewerRationale: input.reviewerRationale
      },
      createdAt: this.nextCreatedAt()
    });

    for (const comment of input.comments ?? []) {
      const id = `comment_${this.audits.length + 1}`;
      this.audits.unshift({
        id: `audit_${this.audits.length + 1}`,
        recordId: input.id,
        actorName: input.actor.actorName,
        actorRole: input.actor.actorRole,
        eventType: 'REVIEW_COMMENT_ADDED',
        metadata: {
          reviewCommentId: id,
          reviewCommentSection: comment.section,
          reviewCommentText: comment.text,
          reviewCommentStatus: 'OPEN'
        },
        createdAt: this.nextCreatedAt()
      });
    }

    if (input.decision === 'APPROVE') {
      const unresolved = getUnresolvedReviewComments(deriveReviewComments(this.audits));
      for (const comment of unresolved) {
        this.audits.unshift({
          id: `audit_${this.audits.length + 1}`,
          recordId: input.id,
          actorName: input.actor.actorName,
          actorRole: input.actor.actorRole,
          eventType: 'REVIEW_COMMENT_STATUS_CHANGED',
          metadata: {
            reviewCommentId: comment.id,
            reviewCommentStatus: 'RESOLVED',
            reviewCommentAction: 'RESOLVED'
          },
          createdAt: this.nextCreatedAt()
        });
      }
    }

    return structuredClone(this.record);
  }

  async addReviewComment(input: AddReviewCommentInput): Promise<KnowledgeRecord | undefined> {
    if (input.id !== this.record.id) return undefined;
    this.audits.unshift({
      id: `audit_${this.audits.length + 1}`,
      recordId: input.id,
      actorName: input.actor.actorName,
      actorRole: input.actor.actorRole,
      eventType: 'REVIEW_COMMENT_ADDED',
      metadata: {
        reviewCommentId: `comment_${this.audits.length + 1}`,
        reviewCommentSection: input.comment.section,
        reviewCommentText: input.comment.text,
        reviewCommentStatus: 'OPEN'
      },
      createdAt: this.nextCreatedAt()
    });
    return structuredClone(this.record);
  }

  async resubmitForReview(input: ResubmitForReviewInput): Promise<KnowledgeRecord | undefined> {
    if (input.id !== this.record.id) return undefined;
    const previous = this.record.approvalState;
    this.record = {
      ...this.record,
      approvalState: 'UNDER_REVIEW'
    };

    for (const commentId of input.addressedCommentIds ?? []) {
      this.audits.unshift({
        id: `audit_${this.audits.length + 1}`,
        recordId: input.id,
        actorName: input.actor.actorName,
        actorRole: input.actor.actorRole,
        eventType: 'REVIEW_COMMENT_STATUS_CHANGED',
        metadata: {
          reviewCommentId: commentId,
          reviewCommentStatus: 'ADDRESSED',
          reviewCommentAction: 'ADDRESSED',
          reviewCommentResponseNote: input.editorResponseNote
        },
        createdAt: this.nextCreatedAt()
      });
    }

    this.audits.unshift({
      id: `audit_${this.audits.length + 1}`,
      recordId: input.id,
      actorName: input.actor.actorName,
      actorRole: input.actor.actorRole,
      eventType: 'REVIEW_RESUBMITTED',
      fromStatus: previous,
      toStatus: 'UNDER_REVIEW',
      metadata: {
        editorResponseNote: input.editorResponseNote,
        relatedReviewDecisionEventId: input.relatedReviewDecisionEventId
      },
      createdAt: this.nextCreatedAt()
    });
    return structuredClone(this.record);
  }

  async updateStatus(_id: string, _status: ApprovalState, _reviewer?: string, _actor?: AuditActorInput): Promise<KnowledgeRecord | undefined> {
    throw new Error('Not used');
  }

  async listAuditEvents(recordId: string): Promise<AuditEvent[]> {
    if (recordId !== this.record.id) return [];
    return structuredClone(this.audits);
  }

  async listVersions(_recordId: string): Promise<RecordVersion[]> {
    return [];
  }

  async getLatestUnresolvedReviewComment(recordId: string): Promise<UnresolvedReviewComment | undefined> {
    if (recordId !== this.record.id) return undefined;
    const latestRequestIndex = this.audits.findIndex(
      (event) => event.eventType === 'REVIEW_DECISION' && event.metadata?.reviewDecision === 'REQUEST_CHANGES'
    );
    if (latestRequestIndex === -1) return undefined;
    const latestRequest = this.audits[latestRequestIndex];
    const newerEvents = this.audits.slice(0, latestRequestIndex);
    const latestResubmission = newerEvents.find((event) => event.eventType === 'REVIEW_RESUBMITTED');
    return {
      requestChangesEvent: structuredClone(latestRequest),
      latestResubmissionEvent: latestResubmission ? structuredClone(latestResubmission) : undefined
    };
  }

  async listReviewComments(recordId: string): Promise<ReviewCommentThread[]> {
    if (recordId !== this.record.id) return [];
    return structuredClone(deriveReviewComments(this.audits));
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    return {
      totalRecords: 1,
      approvedRecords: this.record.approvalState === 'APPROVED' ? 1 : 0,
      draftRecords: this.record.approvalState === 'DRAFT' ? 1 : 0,
      expertInterviewsCaptured: 0,
      shadowingRecordsCaptured: 0,
      atRiskExperts: 0,
      openHandoverPacks: 0
    };
  }

  async getRiskHotspots(_limit: number): Promise<RiskHotspot[]> {
    return [];
  }

  async listReviewQueue(): Promise<KnowledgeRecord[]> {
    return [structuredClone(this.record)];
  }

  async getDistinctValues(_field: 'asset' | 'system' | 'task' | 'symptom'): Promise<string[]> {
    return [];
  }

  async listExpertProfiles(): Promise<ExpertProfile[]> {
    return [];
  }

  async createExpertProfile(_input: CreateExpertProfileInput): Promise<ExpertProfile> {
    throw new Error('Not used');
  }

  async listHandoverPacks(): Promise<HandoverPack[]> {
    return [];
  }

  async createHandoverPack(_input: CreateHandoverPackInput): Promise<HandoverPack | undefined> {
    throw new Error('Not used');
  }

  async updateHandoverTaskStatus(_input: UpdateHandoverTaskStatusInput): Promise<HandoverPack | undefined> {
    throw new Error('Not used');
  }
}

function reviewInput(decision: 'APPROVE' | 'REQUEST_CHANGES', reviewerRationale?: string): ReviewDecisionInput {
  return {
    id: 'kr_review_1',
    decision,
    reviewerName: 'Reviewer One',
    reviewerRationale,
    actor: {
      actorUserId: 'u_reviewer',
      actorName: 'Reviewer One',
      actorRole: 'REVIEWER'
    }
  };
}

function resubmitInput(note?: string): ResubmitForReviewInput {
  return {
    id: 'kr_review_1',
    editorName: 'Supervisor One',
    editorResponseNote: note,
    addressedCommentIds: [],
    actor: {
      actorUserId: 'u_supervisor',
      actorName: 'Supervisor One',
      actorRole: 'SUPERVISOR'
    }
  };
}

test('1) reviewer can approve under-review record', async () => {
  const service = createKnowledgeService(new InMemoryReviewRepository(makeUnderReviewRecord()));
  const updated = await service.applyReviewDecision(reviewInput('APPROVE'));
  assert.ok(updated);
  assert.equal(updated.approvalState, 'APPROVED');
});

test('2) reviewer can request changes with rationale', async () => {
  const service = createKnowledgeService(new InMemoryReviewRepository(makeUnderReviewRecord()));
  const updated = await service.applyReviewDecision(reviewInput('REQUEST_CHANGES', 'Need clearer task sequence.'));
  assert.ok(updated);
  assert.equal(updated.approvalState, 'DRAFT');
});

test('3) reject/request changes without rationale fails', async () => {
  const service = createKnowledgeService(new InMemoryReviewRepository(makeUnderReviewRecord()));
  await assert.rejects(() => service.applyReviewDecision(reviewInput('REQUEST_CHANGES', '  ')), {
    message: 'Reviewer rationale is required when requesting changes.'
  });
});

test('4) rejected record returns to DRAFT', async () => {
  const service = createKnowledgeService(new InMemoryReviewRepository(makeUnderReviewRecord()));
  const updated = await service.applyReviewDecision(reviewInput('REQUEST_CHANGES', 'Tagging and confidence need correction.'));
  assert.ok(updated);
  assert.equal(updated.approvalState, 'DRAFT');
});

test('5) audit trail records reviewer decision and rationale', async () => {
  const repository = new InMemoryReviewRepository(makeUnderReviewRecord());
  const service = createKnowledgeService(repository);
  await service.applyReviewDecision(reviewInput('REQUEST_CHANGES', 'Need machine context clarification.'));

  const events = await service.listAuditEvents('kr_review_1');
  assert.equal(events.length, 1);
  assert.equal(events[0].eventType, 'REVIEW_DECISION');
  assert.equal(events[0].metadata?.reviewDecision, 'REQUEST_CHANGES');
  assert.equal(events[0].metadata?.reviewerRationale, 'Need machine context clarification.');
  assert.equal(events[0].fromStatus, 'UNDER_REVIEW');
  assert.equal(events[0].toStatus, 'DRAFT');
});

test('6) permitted editor can resubmit requested-changes draft to UNDER_REVIEW', async () => {
  const repository = new InMemoryReviewRepository(makeUnderReviewRecord());
  const service = createKnowledgeService(repository);
  await service.applyReviewDecision(reviewInput('REQUEST_CHANGES', 'Add exact line purge timing.'));

  const updated = await service.resubmitKnowledgeRecordForReview(resubmitInput('Added 45-second purge step and context.'));
  assert.ok(updated);
  assert.equal(updated.approvalState, 'UNDER_REVIEW');
});

test('7) unauthorized resubmission is blocked', async () => {
  const repository = new InMemoryReviewRepository(makeUnderReviewRecord());
  const service = createKnowledgeService(repository);
  await service.applyReviewDecision(reviewInput('REQUEST_CHANGES', 'Clarify tags and confidence.'));

  const forged = resubmitInput();
  forged.actor.actorRole = 'TECHNICIAN';
  await assert.rejects(() => service.resubmitKnowledgeRecordForReview(forged), {
    message: 'Role is not permitted to resubmit this record for review.'
  });
});

test('8) latest unresolved reviewer rationale is surfaced through service', async () => {
  const repository = new InMemoryReviewRepository(makeUnderReviewRecord());
  const service = createKnowledgeService(repository);
  await service.applyReviewDecision(reviewInput('REQUEST_CHANGES', 'Need clearer safety warning language.'));
  await service.resubmitKnowledgeRecordForReview(resubmitInput('Added warning and lockout confirmation.'));

  const unresolved = await service.getLatestUnresolvedReviewComment('kr_review_1');
  assert.ok(unresolved);
  assert.equal(unresolved.requestChangesEvent.metadata?.reviewerRationale, 'Need clearer safety warning language.');
  assert.equal(unresolved.latestResubmissionEvent?.metadata?.editorResponseNote, 'Added warning and lockout confirmation.');
});

test('9) reviewer can create a section-scoped comment thread item', async () => {
  const repository = new InMemoryReviewRepository(makeUnderReviewRecord());
  const service = createKnowledgeService(repository);
  await service.addReviewComment({
    id: 'kr_review_1',
    reviewerName: 'Reviewer One',
    comment: {
      section: 'BODY',
      text: 'Add lockout/tagout verification detail.'
    },
    actor: {
      actorUserId: 'u_reviewer',
      actorName: 'Reviewer One',
      actorRole: 'REVIEWER'
    }
  });

  const comments = await service.listReviewComments('kr_review_1');
  assert.equal(comments.length, 1);
  assert.equal(comments[0].section, 'BODY');
  assert.equal(comments[0].status, 'OPEN');
});

test('10) request changes can persist section comments with decision', async () => {
  const repository = new InMemoryReviewRepository(makeUnderReviewRecord());
  const service = createKnowledgeService(repository);
  await service.applyReviewDecision({
    ...reviewInput('REQUEST_CHANGES', 'Fix sequence and safety language.'),
    comments: [
      { section: 'TITLE', text: 'Title should reflect lockout precheck.' },
      { section: 'BODY', text: 'Clarify exact purge timing.' }
    ]
  });

  const comments = await service.listReviewComments('kr_review_1');
  assert.equal(comments.length, 2);
  assert.equal(comments[0].status, 'OPEN');
});

test('11) resubmission can mark selected comments addressed', async () => {
  const repository = new InMemoryReviewRepository(makeUnderReviewRecord());
  const service = createKnowledgeService(repository);
  await service.applyReviewDecision({
    ...reviewInput('REQUEST_CHANGES', 'Fix sequence.'),
    comments: [{ section: 'BODY', text: 'Clarify purge timing.' }]
  });

  const commentsBefore = await service.listReviewComments('kr_review_1');
  const input = resubmitInput('Updated purge timing.');
  input.addressedCommentIds = [commentsBefore[0].id];
  await service.resubmitKnowledgeRecordForReview(input);

  const commentsAfter = await service.listReviewComments('kr_review_1');
  assert.equal(commentsAfter[0].status, 'ADDRESSED');
  assert.equal(commentsAfter[0].addressedNote, 'Updated purge timing.');
});

test('12) unresolved comments remain visible until reviewer resolves via approval', async () => {
  const repository = new InMemoryReviewRepository(makeUnderReviewRecord());
  const service = createKnowledgeService(repository);
  await service.applyReviewDecision({
    ...reviewInput('REQUEST_CHANGES', 'Fix sequence.'),
    comments: [{ section: 'BODY', text: 'Clarify purge timing.' }]
  });

  const commentsBefore = await service.listReviewComments('kr_review_1');
  assert.equal(commentsBefore[0].status, 'OPEN');

  await service.resubmitKnowledgeRecordForReview(resubmitInput('Updated wording.'));
  const afterResubmit = await service.listReviewComments('kr_review_1');
  assert.notEqual(afterResubmit[0].status, 'RESOLVED');
});

test('13) reviewer can still approve or request changes independently of comment state', async () => {
  const repository = new InMemoryReviewRepository(makeUnderReviewRecord());
  const service = createKnowledgeService(repository);
  await service.addReviewComment({
    id: 'kr_review_1',
    reviewerName: 'Reviewer One',
    comment: { section: 'BODY', text: 'Clarify purge timing.' },
    actor: {
      actorUserId: 'u_reviewer',
      actorName: 'Reviewer One',
      actorRole: 'REVIEWER'
    }
  });

  const requestedChanges = await service.applyReviewDecision(reviewInput('REQUEST_CHANGES', 'Please revise and resubmit.'));
  assert.equal(requestedChanges?.approvalState, 'DRAFT');
  await service.resubmitKnowledgeRecordForReview(resubmitInput('Adjusted per comment.'));

  const approved = await service.applyReviewDecision(reviewInput('APPROVE', 'Now acceptable.'));
  assert.equal(approved?.approvalState, 'APPROVED');

  const comments = await service.listReviewComments('kr_review_1');
  assert.equal(comments[0].status, 'RESOLVED');
});
