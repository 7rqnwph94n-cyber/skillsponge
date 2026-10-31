import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Client } from 'pg';
import { PrismaKnowledgeRecordRepository } from './prisma-knowledge-repository';
import { UpdateKnowledgeRecordInput } from './knowledge-repository';
import { ApprovalState } from './domain';
import { createKnowledgeService } from './knowledge-service';

function baseTestDatabaseUrl(): string | undefined {
  return process.env.TEST_DATABASE_URL?.trim();
}

function databaseUrl(baseUrl: string, databaseName: string): string {
  const url = new URL(baseUrl);
  url.pathname = `/${databaseName}`;
  url.searchParams.delete('schema');
  return url.toString();
}

function adminUrl(baseUrl: string): string {
  const url = new URL(baseUrl);
  url.pathname = '/postgres';
  url.searchParams.delete('schema');
  return url.toString();
}

function dbPush(targetDatabaseUrl: string) {
  execFileSync(
    'npx',
    ['prisma', 'db', 'push', '--url', targetDatabaseUrl],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL: targetDatabaseUrl
      },
      stdio: 'pipe'
    }
  );
}

async function withRepository<T>(fn: (ctx: { repo: PrismaKnowledgeRecordRepository; db: PrismaClient }) => Promise<T>): Promise<T> {
  const baseUrl = baseTestDatabaseUrl();
  if (!baseUrl) {
    throw new Error('TEST_DATABASE_URL is required for Prisma integration tests.');
  }

  const dbName = `test_${randomUUID().replaceAll('-', '')}`;
  const isolatedUrl = databaseUrl(baseUrl, dbName);
  const admin = new Client({ connectionString: adminUrl(baseUrl) });
  let db: PrismaClient | undefined;
  try {
    await admin.connect();
    await admin.query(`CREATE DATABASE "${dbName}"`);
    dbPush(isolatedUrl);

    db = new PrismaClient({
      adapter: new PrismaPg({ connectionString: isolatedUrl })
    });
    const repo = new PrismaKnowledgeRecordRepository(db);

    return await fn({ repo, db });
  } finally {
    try {
      await db?.$disconnect();
      await admin.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1`, [dbName]);
      await admin.query(`DROP DATABASE IF EXISTS "${dbName}"`);
    } finally {
      await admin.end().catch(() => undefined);
    }
  }
}

async function createRecordWithStatus(repo: PrismaKnowledgeRecordRepository, status: ApprovalState) {
  const created = await repo.create({
    type: 'PROCEDURE',
    title: `Repo Test ${status}`,
    asset: 'CMP-07',
    system: 'Pneumatics',
    task: 'Hot-start diagnostics',
    symptom: 'No pressure build',
    environment: 'Plant A',
    tags: ['repo-test'],
    confidence: 'MEDIUM',
    body: 'Initial body',
    author: 'Integration Author',
    actor: {
      actorName: 'Integration Author',
      actorRole: 'SUPERVISOR'
    }
  });

  if (status === 'DRAFT') {
    return created;
  }

  await repo.updateStatus(created.id, 'UNDER_REVIEW', 'Reviewer One', {
    actorName: 'Reviewer One',
    actorRole: 'REVIEWER'
  });

  if (status === 'UNDER_REVIEW') {
    const underReview = await repo.getById(created.id);
    assert.ok(underReview);
    return underReview;
  }

  await repo.updateStatus(created.id, 'APPROVED', 'Reviewer One', {
    actorName: 'Reviewer One',
    actorRole: 'REVIEWER'
  });

  const approved = await repo.getById(created.id);
  assert.ok(approved);
  return approved;
}

function updateInput(recordId: string, override?: Partial<UpdateKnowledgeRecordInput>): UpdateKnowledgeRecordInput {
  return {
    id: recordId,
    title: 'Updated title',
    asset: 'CMP-07',
    system: 'Pneumatics',
    task: 'Hot-start diagnostics',
    symptom: 'No pressure build',
    environment: 'Plant A',
    tags: ['repo-test', 'updated'],
    confidence: 'HIGH',
    body: 'Updated body',
    changeNote: 'Updated from integration test',
    editorName: 'Integration Editor',
    changeReason: 'Field validation triggered re-review',
    actor: {
      actorName: 'Integration Editor',
      actorRole: 'ADMIN'
    },
    ...override
  };
}

const canRun = Boolean(baseTestDatabaseUrl());

test('1) editing a DRAFT record creates a persisted version and updates currentVersion', { skip: !canRun }, async () => {
  await withRepository(async ({ repo }) => {
    const record = await createRecordWithStatus(repo, 'DRAFT');
    const updated = await repo.updateRecord(updateInput(record.id));
    assert.ok(updated);
    assert.equal(updated.approvalState, 'DRAFT');
    assert.equal(updated.currentVersion, 2);

    const versions = await repo.listVersions(record.id);
    assert.equal(versions.length, 2);
    assert.equal(versions[0].versionNumber, 2);
  });
});

test('2) editing an UNDER_REVIEW record creates a persisted version', { skip: !canRun }, async () => {
  await withRepository(async ({ repo }) => {
    const record = await createRecordWithStatus(repo, 'UNDER_REVIEW');
    const updated = await repo.updateRecord(updateInput(record.id, { actor: { actorName: 'Reviewer One', actorRole: 'REVIEWER' } }));
    assert.ok(updated);
    assert.equal(updated.approvalState, 'UNDER_REVIEW');
    assert.equal(updated.currentVersion, 2);

    const versions = await repo.listVersions(record.id);
    assert.equal(versions.length, 2);
    assert.equal(versions[0].versionNumber, 2);
  });
});

test('3) editing an APPROVED record requires reason, creates new version, and moves to UNDER_REVIEW', { skip: !canRun }, async () => {
  await withRepository(async ({ repo }) => {
    const record = await createRecordWithStatus(repo, 'APPROVED');

    await assert.rejects(() => repo.updateRecord(updateInput(record.id, { changeReason: '   ' })), {
      message: 'Change reason is required when editing an APPROVED record.'
    });

    const updated = await repo.updateRecord(updateInput(record.id));
    assert.ok(updated);
    assert.equal(updated.approvalState, 'UNDER_REVIEW');
    assert.equal(updated.currentVersion, 2);
  });
});

test('4) approved-edit audit event is persisted with the version write', { skip: !canRun }, async () => {
  await withRepository(async ({ repo }) => {
    const record = await createRecordWithStatus(repo, 'APPROVED');
    await repo.updateRecord(updateInput(record.id));

    const versions = await repo.listVersions(record.id);
    const audits = await repo.listAuditEvents(record.id);
    const approvedEditAudit = audits.find((event) => event.fromStatus === 'APPROVED' && event.toStatus === 'UNDER_REVIEW');

    assert.equal(versions[0].versionNumber, 2);
    assert.equal(versions[0].changeReason, 'Field validation triggered re-review');
    assert.ok(approvedEditAudit);
    assert.equal(approvedEditAudit.metadata?.changeReason, 'Field validation triggered re-review');
  });
});

test('5) no-op edit does not create version or audit noise', { skip: !canRun }, async () => {
  await withRepository(async ({ repo }) => {
    const record = await createRecordWithStatus(repo, 'APPROVED');
    const versionsBefore = await repo.listVersions(record.id);
    const auditsBefore = await repo.listAuditEvents(record.id);

    const noOpInput = updateInput(record.id, {
      title: record.title,
      asset: record.context.asset,
      system: record.context.system,
      task: record.context.task,
      symptom: record.context.symptom,
      environment: record.context.environment,
      tags: [...record.tags],
      confidence: record.confidence,
      body: record.body
    });

    const updated = await repo.updateRecord(noOpInput);
    assert.ok(updated);
    assert.equal(updated.currentVersion, 1);
    assert.equal(updated.approvalState, 'APPROVED');

    const versionsAfter = await repo.listVersions(record.id);
    const auditsAfter = await repo.listAuditEvents(record.id);
    assert.equal(versionsAfter.length, versionsBefore.length);
    assert.equal(auditsAfter.length, auditsBefore.length);
  });
});

test('6) currentVersion increments correctly across persisted edits', { skip: !canRun }, async () => {
  await withRepository(async ({ repo }) => {
    const record = await createRecordWithStatus(repo, 'UNDER_REVIEW');
    const first = await repo.updateRecord(updateInput(record.id, { body: 'First update body' }));
    assert.ok(first);
    assert.equal(first.currentVersion, 2);

    const second = await repo.updateRecord(updateInput(record.id, { body: 'Second update body', title: 'Second update title' }));
    assert.ok(second);
    assert.equal(second.currentVersion, 3);

    const persisted = await repo.getById(record.id);
    assert.ok(persisted);
    assert.equal(persisted.currentVersion, 3);
  });
});

test('7) version history ordering is descending in persisted queries', { skip: !canRun }, async () => {
  await withRepository(async ({ repo }) => {
    const record = await createRecordWithStatus(repo, 'UNDER_REVIEW');
    await repo.updateRecord(updateInput(record.id, { body: 'First update body' }));
    await repo.updateRecord(updateInput(record.id, { body: 'Second update body', title: 'Second update title' }));

    const versions = await repo.listVersions(record.id);
    assert.equal(versions.length, 3);
    assert.equal(versions[0].versionNumber, 3);
    assert.equal(versions[1].versionNumber, 2);
    assert.equal(versions[2].versionNumber, 1);
  });
});

test('8) reviewer can approve an UNDER_REVIEW record', { skip: !canRun }, async () => {
  await withRepository(async ({ repo }) => {
    const record = await createRecordWithStatus(repo, 'UNDER_REVIEW');
    const updated = await repo.applyReviewDecision({
      id: record.id,
      decision: 'APPROVE',
      reviewerName: 'Reviewer One',
      reviewerRationale: 'Technically sound and reproducible.',
      actor: {
        actorName: 'Reviewer One',
        actorRole: 'REVIEWER'
      }
    });

    assert.ok(updated);
    assert.equal(updated.approvalState, 'APPROVED');
  });
});

test('9) reviewer can request changes with rationale', { skip: !canRun }, async () => {
  await withRepository(async ({ repo }) => {
    const record = await createRecordWithStatus(repo, 'UNDER_REVIEW');
    const updated = await repo.applyReviewDecision({
      id: record.id,
      decision: 'REQUEST_CHANGES',
      reviewerName: 'Reviewer One',
      reviewerRationale: 'Please clarify the sequence around line purge timing.',
      actor: {
        actorName: 'Reviewer One',
        actorRole: 'REVIEWER'
      }
    });

    assert.ok(updated);
    assert.equal(updated.approvalState, 'DRAFT');
  });
});

test('10) reject/request-changes without rationale fails at service layer', { skip: !canRun }, async () => {
  await withRepository(async ({ repo }) => {
    const record = await createRecordWithStatus(repo, 'UNDER_REVIEW');

    const fromService = (await import('./knowledge-service')).createKnowledgeService(repo);
    await assert.rejects(
      () =>
        fromService.applyReviewDecision({
          id: record.id,
          decision: 'REQUEST_CHANGES',
          reviewerName: 'Reviewer One',
          reviewerRationale: '   ',
          actor: {
            actorName: 'Reviewer One',
            actorRole: 'REVIEWER'
          }
        }),
      { message: 'Reviewer rationale is required when requesting changes.' }
    );
  });
});

test('11) review decision audit metadata stores decision and rationale', { skip: !canRun }, async () => {
  await withRepository(async ({ repo }) => {
    const record = await createRecordWithStatus(repo, 'UNDER_REVIEW');
    await repo.applyReviewDecision({
      id: record.id,
      decision: 'REQUEST_CHANGES',
      reviewerName: 'Reviewer One',
      reviewerRationale: 'Need clearer fault symptom boundaries.',
      actor: {
        actorName: 'Reviewer One',
        actorRole: 'REVIEWER'
      }
    });

    const audits = await repo.listAuditEvents(record.id);
    const decisionAudit = audits.find((event) => event.eventType === 'REVIEW_DECISION');
    assert.ok(decisionAudit);
    assert.equal(decisionAudit.fromStatus, 'UNDER_REVIEW');
    assert.equal(decisionAudit.toStatus, 'DRAFT');
    assert.equal(decisionAudit.metadata?.reviewDecision, 'REQUEST_CHANGES');
    assert.equal(decisionAudit.metadata?.reviewerRationale, 'Need clearer fault symptom boundaries.');
  });
});

test('12) permitted editor can resubmit requested-changes draft to UNDER_REVIEW', { skip: !canRun }, async () => {
  await withRepository(async ({ repo }) => {
    const record = await createRecordWithStatus(repo, 'UNDER_REVIEW');
    await repo.applyReviewDecision({
      id: record.id,
      decision: 'REQUEST_CHANGES',
      reviewerName: 'Reviewer One',
      reviewerRationale: 'Clarify startup timing and symptom boundaries.',
      actor: {
        actorName: 'Reviewer One',
        actorRole: 'REVIEWER'
      }
    });

    const service = createKnowledgeService(repo);
    const updated = await service.resubmitKnowledgeRecordForReview({
      id: record.id,
      editorName: 'Supervisor One',
      editorResponseNote: 'Updated startup timing and fault symptom wording.',
      actor: {
        actorName: 'Supervisor One',
        actorRole: 'SUPERVISOR'
      }
    });

    assert.ok(updated);
    assert.equal(updated.approvalState, 'UNDER_REVIEW');
  });
});

test('13) unauthorized resubmission is blocked', { skip: !canRun }, async () => {
  await withRepository(async ({ repo }) => {
    const record = await createRecordWithStatus(repo, 'UNDER_REVIEW');
    await repo.applyReviewDecision({
      id: record.id,
      decision: 'REQUEST_CHANGES',
      reviewerName: 'Reviewer One',
      reviewerRationale: 'Need clearer confidence guidance.',
      actor: {
        actorName: 'Reviewer One',
        actorRole: 'REVIEWER'
      }
    });

    const service = createKnowledgeService(repo);
    await assert.rejects(
      () =>
        service.resubmitKnowledgeRecordForReview({
          id: record.id,
          editorName: 'Tech One',
          actor: {
            actorName: 'Tech One',
            actorRole: 'TECHNICIAN'
          }
        }),
      { message: 'Role is not permitted to resubmit this record for review.' }
    );
  });
});

test('14) resubmission audit event is written with optional editor note', { skip: !canRun }, async () => {
  await withRepository(async ({ repo }) => {
    const record = await createRecordWithStatus(repo, 'UNDER_REVIEW');
    await repo.applyReviewDecision({
      id: record.id,
      decision: 'REQUEST_CHANGES',
      reviewerName: 'Reviewer One',
      reviewerRationale: 'Include environment constraints.',
      actor: {
        actorName: 'Reviewer One',
        actorRole: 'REVIEWER'
      }
    });

    const service = createKnowledgeService(repo);
    await service.resubmitKnowledgeRecordForReview({
      id: record.id,
      editorName: 'Admin One',
      editorResponseNote: 'Added outdoor ambient constraints and checks.',
      actor: {
        actorName: 'Admin One',
        actorRole: 'ADMIN'
      }
    });

    const audits = await repo.listAuditEvents(record.id);
    const resubAudit = audits.find((event) => event.eventType === 'REVIEW_RESUBMITTED');
    assert.ok(resubAudit);
    assert.equal(resubAudit.fromStatus, 'DRAFT');
    assert.equal(resubAudit.toStatus, 'UNDER_REVIEW');
    assert.equal(resubAudit.metadata?.editorResponseNote, 'Added outdoor ambient constraints and checks.');
    assert.ok(resubAudit.metadata?.relatedReviewDecisionEventId);
  });
});

test('15) latest unresolved reviewer rationale is surfaced correctly', { skip: !canRun }, async () => {
  await withRepository(async ({ repo }) => {
    const record = await createRecordWithStatus(repo, 'UNDER_REVIEW');
    await repo.applyReviewDecision({
      id: record.id,
      decision: 'REQUEST_CHANGES',
      reviewerName: 'Reviewer One',
      reviewerRationale: 'Need clearer lockout steps.',
      actor: {
        actorName: 'Reviewer One',
        actorRole: 'REVIEWER'
      }
    });

    const service = createKnowledgeService(repo);
    await service.resubmitKnowledgeRecordForReview({
      id: record.id,
      editorName: 'Supervisor One',
      editorResponseNote: 'Expanded lockout checklist in body.',
      actor: {
        actorName: 'Supervisor One',
        actorRole: 'SUPERVISOR'
      }
    });

    const unresolved = await service.getLatestUnresolvedReviewComment(record.id);
    assert.ok(unresolved);
    assert.equal(unresolved.requestChangesEvent.metadata?.reviewerRationale, 'Need clearer lockout steps.');
    assert.equal(unresolved.latestResubmissionEvent?.metadata?.editorResponseNote, 'Expanded lockout checklist in body.');
  });
});

test('16) reviewer can create a section-scoped review comment', { skip: !canRun }, async () => {
  await withRepository(async ({ repo }) => {
    const record = await createRecordWithStatus(repo, 'UNDER_REVIEW');
    const service = createKnowledgeService(repo);
    await service.addReviewComment({
      id: record.id,
      reviewerName: 'Reviewer One',
      comment: {
        section: 'BODY',
        text: 'Clarify purge timing with exact seconds.'
      },
      actor: {
        actorName: 'Reviewer One',
        actorRole: 'REVIEWER'
      }
    });

    const comments = await service.listReviewComments(record.id);
    assert.equal(comments.length, 1);
    assert.equal(comments[0].section, 'BODY');
    assert.equal(comments[0].status, 'OPEN');
  });
});

test('17) request changes with comments and resubmission addressed markers persist', { skip: !canRun }, async () => {
  await withRepository(async ({ repo }) => {
    const record = await createRecordWithStatus(repo, 'UNDER_REVIEW');
    const service = createKnowledgeService(repo);
    await service.applyReviewDecision({
      id: record.id,
      decision: 'REQUEST_CHANGES',
      reviewerName: 'Reviewer One',
      reviewerRationale: 'Need title and body clarifications.',
      comments: [
        { section: 'TITLE', text: 'Use explicit lockout title wording.' },
        { section: 'BODY', text: 'Add exact timing for purge and cooldown.' }
      ],
      actor: {
        actorName: 'Reviewer One',
        actorRole: 'REVIEWER'
      }
    });

    const comments = await service.listReviewComments(record.id);
    const bodyComment = comments.find((comment) => comment.section === 'BODY');
    assert.ok(bodyComment);

    await service.resubmitKnowledgeRecordForReview({
      id: record.id,
      editorName: 'Supervisor One',
      editorResponseNote: 'Updated body sequence and timing details.',
      addressedCommentIds: bodyComment ? [bodyComment.id] : [],
      actor: {
        actorName: 'Supervisor One',
        actorRole: 'SUPERVISOR'
      }
    });

    const afterResubmit = await service.listReviewComments(record.id);
    const addressed = afterResubmit.find((comment) => comment.id === bodyComment?.id);
    assert.ok(addressed);
    assert.equal(addressed.status, 'ADDRESSED');

    const unresolved = afterResubmit.filter((comment) => comment.status !== 'RESOLVED');
    assert.ok(unresolved.length >= 1);
  });
});

test('18) reviewer can approve even when comments are open and approval resolves them', { skip: !canRun }, async () => {
  await withRepository(async ({ repo }) => {
    const record = await createRecordWithStatus(repo, 'UNDER_REVIEW');
    const service = createKnowledgeService(repo);
    await service.addReviewComment({
      id: record.id,
      reviewerName: 'Reviewer One',
      comment: { section: 'BODY', text: 'Add explicit safety language.' },
      actor: {
        actorName: 'Reviewer One',
        actorRole: 'REVIEWER'
      }
    });

    const approved = await service.applyReviewDecision({
      id: record.id,
      decision: 'APPROVE',
      reviewerName: 'Reviewer One',
      actor: {
        actorName: 'Reviewer One',
        actorRole: 'REVIEWER'
      }
    });
    assert.ok(approved);
    assert.equal(approved.approvalState, 'APPROVED');

    const comments = await service.listReviewComments(record.id);
    assert.equal(comments[0].status, 'RESOLVED');
  });
});

test('19) record linkage to source expert and handover pack persists across create/update', { skip: !canRun }, async () => {
  await withRepository(async ({ repo }) => {
    const expert = await repo.createExpertProfile({
      name: 'Maria Kline',
      roleFocus: 'Senior Pneumatics Technician',
      domains: ['Hot-start diagnostics'],
      assets: ['CMP-07'],
      yearsExperience: 31,
      riskLevel: 'HIGH'
    });
    const pack = await repo.createHandoverPack({
      expertProfileId: expert.id,
      targetRole: 'SENIOR_TECHNICIAN',
      taskTitles: ['Capture walkthrough']
    });
    assert.ok(pack);

    const created = await repo.create({
      type: 'PROCEDURE',
      title: 'Linked knowledge',
      asset: 'CMP-07',
      system: 'Pneumatics',
      task: 'Hot-start diagnostics',
      symptom: 'No pressure build',
      environment: 'Plant A',
      tags: ['linked'],
      confidence: 'MEDIUM',
      body: 'Linked record body',
      sourceExpertId: expert.id,
      handoverPackId: pack.id,
      author: 'Integration Author',
      actor: {
        actorName: 'Integration Author',
        actorRole: 'SUPERVISOR'
      }
    });

    assert.equal(created.sourceExpertId, expert.id);
    assert.equal(created.sourceExpertName, 'Maria Kline');
    assert.equal(created.handoverPackId, pack.id);

    const updated = await repo.updateRecord(updateInput(created.id, {
      sourceExpertId: null,
      handoverPackId: null
    }));
    assert.ok(updated);
    assert.equal(updated.sourceExpertId, undefined);
    assert.equal(updated.handoverPackId, undefined);
  });
});
