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
  RiskHotspot
} from './domain';
import { createKnowledgeService } from './knowledge-service';
import {
  AddReviewCommentInput,
  AuditActorInput,
  CreateExpertProfileInput,
  CreateHandoverPackInput,
  CreateKnowledgeRecordInput,
  KnowledgeRecordRepository,
  ResubmitForReviewInput,
  ReviewDecisionInput,
  UpdateHandoverTaskStatusInput,
  UpdateKnowledgeRecordInput
} from './knowledge-repository';

class InMemoryHandoverRepository implements KnowledgeRecordRepository {
  private experts: ExpertProfile[] = [];
  private packs: HandoverPack[] = [];

  async list(_query?: KnowledgeRecordQuery): Promise<KnowledgeRecord[]> {
    return [];
  }

  async getById(_id: string): Promise<KnowledgeRecord | undefined> {
    return undefined;
  }

  async create(_input: CreateKnowledgeRecordInput): Promise<KnowledgeRecord> {
    throw new Error('Not used');
  }

  async updateRecord(_input: UpdateKnowledgeRecordInput): Promise<KnowledgeRecord | undefined> {
    throw new Error('Not used');
  }

  async applyReviewDecision(_input: ReviewDecisionInput): Promise<KnowledgeRecord | undefined> {
    throw new Error('Not used');
  }

  async addReviewComment(_input: AddReviewCommentInput): Promise<KnowledgeRecord | undefined> {
    throw new Error('Not used');
  }

  async resubmitForReview(_input: ResubmitForReviewInput): Promise<KnowledgeRecord | undefined> {
    throw new Error('Not used');
  }

  async updateStatus(_id: string, _status: ApprovalState, _reviewer?: string, _actor?: AuditActorInput): Promise<KnowledgeRecord | undefined> {
    throw new Error('Not used');
  }

  async listAuditEvents(_recordId: string): Promise<AuditEvent[]> {
    return [];
  }

  async getLatestUnresolvedReviewComment() {
    return undefined;
  }

  async listReviewComments(_recordId: string): Promise<ReviewCommentThread[]> {
    return [];
  }

  async listVersions(_recordId: string): Promise<RecordVersion[]> {
    return [];
  }

  async listExpertProfiles(): Promise<ExpertProfile[]> {
    return structuredClone(this.experts);
  }

  async createExpertProfile(input: CreateExpertProfileInput): Promise<ExpertProfile> {
    const created: ExpertProfile = {
      id: `expert_${this.experts.length + 1}`,
      name: input.name,
      roleFocus: input.roleFocus,
      domains: input.domains,
      assets: input.assets,
      yearsExperience: input.yearsExperience,
      retirementWindowStart: input.retirementWindowStart,
      retirementWindowEnd: input.retirementWindowEnd,
      riskLevel: input.riskLevel ?? 'MEDIUM',
      notes: input.notes,
      createdAt: new Date().toISOString()
    };
    this.experts.unshift(created);
    return structuredClone(created);
  }

  async listHandoverPacks(): Promise<HandoverPack[]> {
    return structuredClone(this.packs);
  }

  async createHandoverPack(input: CreateHandoverPackInput): Promise<HandoverPack | undefined> {
    const expert = this.experts.find((candidate) => candidate.id === input.expertProfileId);
    if (!expert) return undefined;
    const tasks = input.taskTitles.map((title, index) => ({
      id: `task_${index + 1}`,
      title,
      status: 'OPEN' as const
    }));
    const created: HandoverPack = {
      id: `pack_${this.packs.length + 1}`,
      expertProfileId: input.expertProfileId,
      expertName: expert.name,
      targetRole: input.targetRole,
      status: 'IN_PROGRESS',
      targetDate: input.targetDate,
      coverageScore: 0,
      validatedCount: 0,
      tasks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.packs.unshift(created);
    return structuredClone(created);
  }

  async updateHandoverTaskStatus(input: UpdateHandoverTaskStatusInput): Promise<HandoverPack | undefined> {
    const pack = this.packs.find((candidate) => candidate.id === input.handoverPackId);
    if (!pack) return undefined;
    const task = pack.tasks.find((candidate) => candidate.id === input.taskId);
    if (!task) return undefined;
    task.status = input.status;
    task.assigneeName = input.assigneeName;
    task.completedAt = input.status === 'DONE' ? new Date().toISOString() : undefined;
    pack.validatedCount = pack.tasks.filter((candidate) => candidate.status === 'DONE').length;
    pack.coverageScore = Math.round((pack.validatedCount / pack.tasks.length) * 100);
    pack.status = pack.coverageScore === 100 ? 'COMPLETE' : pack.coverageScore >= 75 ? 'READY_FOR_REVIEW' : 'IN_PROGRESS';
    pack.updatedAt = new Date().toISOString();
    return structuredClone(pack);
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    return {
      totalRecords: 0,
      approvedRecords: 0,
      draftRecords: 0,
      expertInterviewsCaptured: 0,
      shadowingRecordsCaptured: 0,
      atRiskExperts: this.experts.filter((expert) => expert.riskLevel === 'HIGH').length,
      openHandoverPacks: this.packs.filter((pack) => pack.status !== 'COMPLETE').length
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
}

test('1) create expert profile and handover pack updates dashboard risk metrics', async () => {
  const service = createKnowledgeService(new InMemoryHandoverRepository());
  const expert = await service.createExpertProfile({
    name: 'Maria Kline',
    roleFocus: 'Senior Pneumatics Technician',
    domains: ['Hot-start diagnostics'],
    assets: ['CMP-07'],
    yearsExperience: 30,
    riskLevel: 'HIGH'
  });
  assert.equal(expert.riskLevel, 'HIGH');

  const pack = await service.createHandoverPack({
    expertProfileId: expert.id,
    targetRole: 'SENIOR_TECHNICIAN',
    taskTitles: ['Capture walkthrough clips', 'Run shadowing sign-off']
  });
  assert.ok(pack);
  assert.equal(pack.status, 'IN_PROGRESS');

  const metrics = await service.getDashboardMetrics();
  assert.equal(metrics.atRiskExperts, 1);
  assert.equal(metrics.openHandoverPacks, 1);
});

test('2) updating handover task status drives coverage and completion state', async () => {
  const service = createKnowledgeService(new InMemoryHandoverRepository());
  const expert = await service.createExpertProfile({
    name: 'Evan Singh',
    roleFocus: 'Reliability Reviewer',
    domains: ['Review governance'],
    assets: ['CMP-07'],
    yearsExperience: 18
  });
  const pack = await service.createHandoverPack({
    expertProfileId: expert.id,
    targetRole: 'REVIEWER',
    taskTitles: ['Capture decision playbook']
  });
  assert.ok(pack);

  const updated = await service.updateHandoverTaskStatus({
    handoverPackId: pack.id,
    taskId: pack.tasks[0].id,
    status: 'DONE',
    assigneeName: 'Riley Shaw'
  });
  assert.ok(updated);
  assert.equal(updated.coverageScore, 100);
  assert.equal(updated.status, 'COMPLETE');
});
