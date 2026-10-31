import assert from 'node:assert/strict';
import test from 'node:test';
import { KnowledgeRecord, RecordVersion } from './domain';
import { buildVersionDiff } from './review-diff';

function makeSnapshot(overrides?: Partial<KnowledgeRecord>): KnowledgeRecord {
  return {
    id: 'kr_diff_1',
    type: 'PROCEDURE',
    title: 'Base title',
    summary: 'Base summary',
    body: 'Base body',
    author: 'Author',
    approvalState: 'UNDER_REVIEW',
    confidence: 'MEDIUM',
    currentVersion: 2,
    createdAt: '2026-03-01',
    tags: ['alpha', 'beta'],
    relatedRecordIds: [],
    context: {
      asset: 'CMP-07',
      system: 'Pneumatics',
      task: 'Hot-start diagnostics',
      symptom: 'No pressure',
      environment: 'Plant A'
    },
    steps: ['Step 1'],
    ...overrides
  };
}

function makeVersion(versionNumber: number, snapshot: KnowledgeRecord): RecordVersion {
  return {
    id: `v_${versionNumber}`,
    recordId: snapshot.id,
    versionNumber,
    editedBy: 'Editor',
    snapshot,
    createdAt: new Date().toISOString()
  };
}

test('1) diff returns changed fields for title, body, context, tags, and confidence', () => {
  const previous = makeVersion(1, makeSnapshot());
  const current = makeVersion(
    2,
    makeSnapshot({
      title: 'Updated title',
      body: 'Updated body',
      confidence: 'HIGH',
      tags: ['alpha', 'gamma'],
      context: {
        asset: 'CMP-08',
        system: 'Pneumatics',
        task: 'Hot-start diagnostics',
        symptom: 'Pressure oscillation',
        environment: 'Plant B'
      },
      steps: ['Step 1', 'Step 2']
    })
  );

  const diff = buildVersionDiff(current, previous);
  assert.equal(diff.hasChanges, true);
  const labels = diff.fields.map((field) => field.label);
  assert.ok(labels.includes('Title'));
  assert.ok(labels.includes('Body'));
  assert.ok(labels.includes('Confidence'));
  assert.ok(labels.includes('Asset'));
  assert.ok(labels.includes('Symptom'));
  assert.ok(labels.includes('Environment'));
  assert.ok(labels.includes('Tags'));
  assert.ok(labels.includes('Procedure steps'));
});

test('2) diff returns no changes when snapshots match', () => {
  const snapshot = makeSnapshot();
  const previous = makeVersion(1, snapshot);
  const current = makeVersion(2, makeSnapshot());

  const diff = buildVersionDiff(current, previous);
  assert.equal(diff.hasChanges, false);
  assert.equal(diff.fields.length, 0);
});
