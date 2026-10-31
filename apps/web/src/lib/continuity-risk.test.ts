import assert from 'node:assert/strict';
import test from 'node:test';
import { buildContinuityRiskRows } from './continuity-risk';
import { ExpertProfile, HandoverPack, KnowledgeRecord } from './domain';

const experts: ExpertProfile[] = [
  {
    id: 'exp_high',
    name: 'Maria Kline',
    roleFocus: 'Senior Tech',
    domains: ['Hot-start diagnostics'],
    assets: ['CMP-07'],
    yearsExperience: 30,
    riskLevel: 'HIGH',
    createdAt: '2026-01-01'
  },
  {
    id: 'exp_med',
    name: 'Evan Singh',
    roleFocus: 'Reviewer',
    domains: ['Review governance'],
    assets: ['CNC-12'],
    yearsExperience: 18,
    riskLevel: 'MEDIUM',
    createdAt: '2026-01-01'
  }
];

const packs: HandoverPack[] = [
  {
    id: 'pack_1',
    expertProfileId: 'exp_high',
    expertName: 'Maria Kline',
    targetRole: 'SENIOR_TECHNICIAN',
    status: 'IN_PROGRESS',
    coverageScore: 40,
    validatedCount: 1,
    tasks: [],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-02'
  }
];

const records = [
  {
    id: 'rec_1',
    type: 'PROCEDURE',
    title: 'Approved fix',
    summary: 'Summary',
    body: 'Body',
    author: 'Author',
    approvalState: 'APPROVED',
    confidence: 'HIGH',
    currentVersion: 1,
    createdAt: '2026-01-01',
    tags: [],
    relatedRecordIds: [],
    context: { asset: 'CMP-07', system: 'Pneumatics', task: 'Hot-start diagnostics', symptom: 'No pressure', environment: 'Plant A' },
    steps: [],
    sourceExpertId: 'exp_high'
  },
  {
    id: 'rec_2',
    type: 'FIELD_NOTE',
    title: 'Draft note',
    summary: 'Summary',
    body: 'Body',
    author: 'Author',
    approvalState: 'DRAFT',
    confidence: 'MEDIUM',
    currentVersion: 1,
    createdAt: '2026-01-01',
    tags: [],
    relatedRecordIds: [],
    context: { asset: 'CMP-07', system: 'Pneumatics', task: 'Hot-start diagnostics', symptom: 'No pressure', environment: 'Plant A' },
    observation: 'Obs',
    immediateAction: 'Act',
    sourceExpertId: 'exp_high'
  }
] satisfies KnowledgeRecord[];

test('1) continuity risk rows prioritize high risk and flag low coverage', () => {
  const rows = buildContinuityRiskRows(experts, packs, records);

  assert.equal(rows.length, 2);
  assert.equal(rows[0].expertId, 'exp_high');
  assert.equal(rows[0].linkedRecords, 2);
  assert.equal(rows[0].approvedLinkedRecords, 1);
  assert.equal(rows[0].flaggedReason, 'Low handover coverage');
  assert.equal(rows[1].expertId, 'exp_med');
  assert.equal(rows[1].flaggedReason, 'No handover pack');
});
