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
  ReviewCommentThread,
  RecordVersion,
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
import { hasMeaningfulEditChange } from './edit-change';

function makeRecord(status: ApprovalState): KnowledgeRecord {
  return {
    id: `kr_${status.toLowerCase()}`,
    type: 'PROCEDURE',
    title: `Title ${status}`,
    summary: `Summary ${status}`,
    body: `Body ${status}`,
    author: 'Author One',
    reviewer: status === 'DRAFT' ? undefined : 'Reviewer One',
    approvalState: status,
    confidence: 'MEDIUM',
    currentVersion: 1,
    createdAt: '2026-03-01',
    lastValidatedAt: status === 'APPROVED' ? '2026-03-02' : undefined,
    tags: ['alpha', 'beta'],
    relatedRecordIds: [],
    context: {
      asset: 'CMP-07',
      system: 'Pneumatics',
      task: 'Hot-start diagnostics',
      symptom: 'No pressure build',
      environment: 'Plant A'
    },
    steps: ['step 1']
  };
}

class InMemoryWorkflowRepository implements KnowledgeRecordRepository {
  private records = new Map<string, KnowledgeRecord>();
  private versions = new Map<string, RecordVersion[]>();
  private audits = new Map<string, AuditEvent[]>();

  seed(record: KnowledgeRecord) {
    this.records.set(record.id, structuredClone(record));
    this.versions.set(record.id, [
      {
        id: `${record.id}_v1`,
        recordId: record.id,
        versionNumber: 1,
        editedBy: record.author,
        changeNote: 'Initial version',
        snapshot: structuredClone(record),
        createdAt: '2026-03-01T00:00:00.000Z'
      }
    ]);
    this.audits.set(record.id, []);
  }

  async list(_query?: KnowledgeRecordQuery): Promise<KnowledgeRecord[]> {
    return [...this.records.values()].map((record) => structuredClone(record));
  }

  async getById(id: string): Promise<KnowledgeRecord | undefined> {
    const record = this.records.get(id);
    return record ? structuredClone(record) : undefined;
  }

  async create(_input: CreateKnowledgeRecordInput): Promise<KnowledgeRecord> {
    throw new Error('Not used in this test suite');
  }

  async updateRecord(input: UpdateKnowledgeRecordInput): Promise<KnowledgeRecord | undefined> {
    const existing = this.records.get(input.id);
    if (!existing) return undefined;

    if (!hasMeaningfulEditChange(existing, input)) {
      return structuredClone(existing);
    }

    const nextVersion = existing.currentVersion + 1;
    const approvedChangeReason = existing.approvalState === 'APPROVED' ? input.changeReason?.trim() : undefined;
    if (existing.approvalState === 'APPROVED' && !approvedChangeReason) {
      throw new Error('Change reason is required when editing an APPROVED record.');
    }

    const nextStatus: ApprovalState = existing.approvalState === 'APPROVED' ? 'UNDER_REVIEW' : existing.approvalState;

    const updated: KnowledgeRecord = {
      ...existing,
      title: input.title,
      summary: input.body.length > 160 ? `${input.body.slice(0, 157)}...` : input.body,
      body: input.body,
      confidence: input.confidence,
      currentVersion: nextVersion,
      approvalState: nextStatus,
      context: {
        asset: input.asset,
        system: input.system,
        task: input.task,
        symptom: input.symptom,
        environment: input.environment
      },
      tags: input.tags
    };

    this.records.set(input.id, structuredClone(updated));

    const priorVersions = this.versions.get(input.id) ?? [];
    const nextHistory: RecordVersion[] = [
      {
        id: `${input.id}_v${nextVersion}`,
        recordId: input.id,
        versionNumber: nextVersion,
        editedBy: input.editorName,
        changeNote: input.changeNote || 'Edited record',
        changeReason: approvedChangeReason,
        snapshot: structuredClone(updated),
        createdAt: new Date().toISOString()
      },
      ...priorVersions
    ];
    this.versions.set(input.id, nextHistory);

    if (existing.approvalState === 'APPROVED') {
      const currentAudit = this.audits.get(input.id) ?? [];
      currentAudit.unshift({
        id: `${input.id}_audit_${currentAudit.length + 1}`,
        recordId: input.id,
        actorName: input.actor.actorName,
        actorRole: input.actor.actorRole,
        eventType: 'STATUS_CHANGED',
        fromStatus: 'APPROVED',
        toStatus: 'UNDER_REVIEW',
        metadata: {
          changeReason: approvedChangeReason
        },
        createdAt: new Date().toISOString()
      });
      this.audits.set(input.id, currentAudit);
    }

    return structuredClone(updated);
  }

  async updateStatus(_id: string, _status: ApprovalState, _reviewer?: string, _actor?: AuditActorInput): Promise<KnowledgeRecord | undefined> {
    throw new Error('Not used in this test suite');
  }

  async applyReviewDecision(_input: ReviewDecisionInput): Promise<KnowledgeRecord | undefined> {
    throw new Error('Not used in this test suite');
  }

  async addReviewComment(_input: AddReviewCommentInput): Promise<KnowledgeRecord | undefined> {
    throw new Error('Not used in this test suite');
  }

  async resubmitForReview(_input: ResubmitForReviewInput): Promise<KnowledgeRecord | undefined> {
    throw new Error('Not used in this test suite');
  }

  async listAuditEvents(recordId: string): Promise<AuditEvent[]> {
    return structuredClone(this.audits.get(recordId) ?? []);
  }

  async listVersions(recordId: string): Promise<RecordVersion[]> {
    return structuredClone(this.versions.get(recordId) ?? []);
  }

  async getLatestUnresolvedReviewComment(_recordId: string): Promise<undefined> {
    return undefined;
  }

  async listReviewComments(_recordId: string): Promise<ReviewCommentThread[]> {
    return [];
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    return {
      totalRecords: this.records.size,
      approvedRecords: 0,
      draftRecords: 0,
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
    return [];
  }

  async getDistinctValues(_field: 'asset' | 'system' | 'task' | 'symptom'): Promise<string[]> {
    return [];
  }

  async listExpertProfiles(): Promise<ExpertProfile[]> {
    return [];
  }

  async createExpertProfile(_input: CreateExpertProfileInput): Promise<ExpertProfile> {
    throw new Error('Not used in this test suite');
  }

  async listHandoverPacks(): Promise<HandoverPack[]> {
    return [];
  }

  async createHandoverPack(_input: CreateHandoverPackInput): Promise<HandoverPack | undefined> {
    throw new Error('Not used in this test suite');
  }

  async updateHandoverTaskStatus(_input: UpdateHandoverTaskStatusInput): Promise<HandoverPack | undefined> {
    throw new Error('Not used in this test suite');
  }
}

function makeUpdateInput(id: string, actorRole: UpdateKnowledgeRecordInput['actor']['actorRole']): UpdateKnowledgeRecordInput {
  return {
    id,
    title: 'Updated title',
    asset: 'CMP-07',
    system: 'Pneumatics',
    task: 'Hot-start diagnostics',
    symptom: 'No pressure build',
    environment: 'Plant A',
    tags: ['alpha', 'beta', 'updated'],
    confidence: 'HIGH',
    body: 'Updated body',
    changeNote: 'Adjusted with new field findings',
    changeReason: 'Updated after new field validation findings',
    editorName: 'Editor Person',
    actor: {
      actorUserId: 'u_editor',
      actorName: 'Editor Person',
      actorRole
    }
  };
}

test('1) Draft edit creates new version, stays DRAFT, increments currentVersion', async () => {
  const repo = new InMemoryWorkflowRepository();
  const record = makeRecord('DRAFT');
  repo.seed(record);
  const service = createKnowledgeService(repo);

  const updated = await service.updateKnowledgeRecord(makeUpdateInput(record.id, 'SUPERVISOR'));
  assert.ok(updated);
  assert.equal(updated.approvalState, 'DRAFT');
  assert.equal(updated.currentVersion, 2);

  const versions = await service.listRecordVersions(record.id);
  assert.equal(versions.length, 2);
  assert.equal(versions[0].versionNumber, 2);
});

test('2) Under-review edit creates new version, stays UNDER_REVIEW, increments currentVersion', async () => {
  const repo = new InMemoryWorkflowRepository();
  const record = makeRecord('UNDER_REVIEW');
  repo.seed(record);
  const service = createKnowledgeService(repo);

  const updated = await service.updateKnowledgeRecord(makeUpdateInput(record.id, 'REVIEWER'));
  assert.ok(updated);
  assert.equal(updated.approvalState, 'UNDER_REVIEW');
  assert.equal(updated.currentVersion, 2);

  const versions = await service.listRecordVersions(record.id);
  assert.equal(versions.length, 2);
  assert.equal(versions[0].versionNumber, 2);
});

test('3) Approved edit creates version, sets UNDER_REVIEW, writes audit, increments currentVersion', async () => {
  const repo = new InMemoryWorkflowRepository();
  const record = makeRecord('APPROVED');
  repo.seed(record);
  const service = createKnowledgeService(repo);

  const updated = await service.updateKnowledgeRecord(makeUpdateInput(record.id, 'ADMIN'));
  assert.ok(updated);
  assert.equal(updated.approvalState, 'UNDER_REVIEW');
  assert.equal(updated.currentVersion, 2);

  const versions = await service.listRecordVersions(record.id);
  assert.equal(versions[0].versionNumber, 2);

  const events = await service.listAuditEvents(record.id);
  assert.equal(events.length, 1);
  assert.equal(events[0].eventType, 'STATUS_CHANGED');
  assert.equal(events[0].fromStatus, 'APPROVED');
  assert.equal(events[0].toStatus, 'UNDER_REVIEW');
  assert.equal(events[0].metadata?.changeReason, 'Updated after new field validation findings');
  assert.equal(versions[0].changeReason, 'Updated after new field validation findings');
});

test('4) Unauthorized edit blocked and forged input does not bypass role restrictions', async () => {
  const repo = new InMemoryWorkflowRepository();
  const record = makeRecord('DRAFT');
  repo.seed(record);
  const service = createKnowledgeService(repo);

  await assert.rejects(() => service.updateKnowledgeRecord(makeUpdateInput(record.id, 'TECHNICIAN')));

  const forged = makeUpdateInput(record.id, 'TECHNICIAN');
  forged.editorName = 'Admin Name';
  forged.actor.actorName = 'Admin Name';
  await assert.rejects(() => service.updateKnowledgeRecord(forged));
});

test('5) No-op edit does not create duplicate version or audit entry', async () => {
  const repo = new InMemoryWorkflowRepository();
  const record = makeRecord('APPROVED');
  repo.seed(record);
  const service = createKnowledgeService(repo);

  const noOp: UpdateKnowledgeRecordInput = {
    id: record.id,
    title: record.title,
    asset: record.context.asset,
    system: record.context.system,
    task: record.context.task,
    symptom: record.context.symptom,
    environment: record.context.environment,
    tags: [...record.tags],
    confidence: record.confidence,
    body: record.body,
    changeReason: '',
    editorName: 'Editor Person',
    actor: {
      actorUserId: 'u_editor',
      actorName: 'Editor Person',
      actorRole: 'ADMIN'
    }
  };

  const updated = await service.updateKnowledgeRecord(noOp);
  assert.ok(updated);
  assert.equal(updated.currentVersion, 1);
  assert.equal(updated.approvalState, 'APPROVED');

  const versions = await service.listRecordVersions(record.id);
  const events = await service.listAuditEvents(record.id);
  assert.equal(versions.length, 1);
  assert.equal(events.length, 0);
});

test('6) Approved edit without reason is rejected', async () => {
  const repo = new InMemoryWorkflowRepository();
  const record = makeRecord('APPROVED');
  repo.seed(record);
  const service = createKnowledgeService(repo);

  const missingReason = makeUpdateInput(record.id, 'ADMIN');
  missingReason.changeReason = '   ';

  await assert.rejects(() => service.updateKnowledgeRecord(missingReason), {
    message: 'Change reason is required when editing an APPROVED record.'
  });
});

test('7) Version integrity: immutable snapshots, descending order, reconstructable fields', async () => {
  const repo = new InMemoryWorkflowRepository();
  const record = makeRecord('UNDER_REVIEW');
  repo.seed(record);
  const service = createKnowledgeService(repo);

  await service.updateKnowledgeRecord(makeUpdateInput(record.id, 'REVIEWER'));
  const second = makeUpdateInput(record.id, 'REVIEWER');
  second.title = 'Second update title';
  second.body = 'Second update body';
  await service.updateKnowledgeRecord(second);

  const versions = await service.listRecordVersions(record.id);
  assert.equal(versions.length, 3);
  assert.equal(versions[0].versionNumber, 3);
  assert.equal(versions[1].versionNumber, 2);
  assert.equal(versions[2].versionNumber, 1);

  const latestTitleBeforeMutation = versions[1].snapshot.title;
  versions[1].snapshot.title = 'mutated in test';

  const versionsAgain = await service.listRecordVersions(record.id);
  assert.equal(versionsAgain[1].snapshot.title, latestTitleBeforeMutation);
  assert.ok(versionsAgain[2].snapshot.body);
  assert.ok(versionsAgain[2].snapshot.context.asset);
  assert.ok(versionsAgain[2].snapshot.approvalState);
});

test('8) Missing record and invalid input fail cleanly', async () => {
  const repo = new InMemoryWorkflowRepository();
  const service = createKnowledgeService(repo);

  const missing = await service.updateKnowledgeRecord(makeUpdateInput('missing_id', 'ADMIN'));
  assert.equal(missing, undefined);

  const repoWithRecord = new InMemoryWorkflowRepository();
  const record = makeRecord('DRAFT');
  repoWithRecord.seed(record);
  const svc = createKnowledgeService(repoWithRecord);

  const invalid = makeUpdateInput(record.id, 'ADMIN');
  invalid.title = '   ';
  await assert.rejects(() => svc.updateKnowledgeRecord(invalid));
});
