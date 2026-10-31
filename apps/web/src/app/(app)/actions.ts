'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAnyRole } from '@/lib/authz';
import {
  applyReviewDecision,
  addReviewComment,
  changeKnowledgeRecordStatus,
  createExpertProfile,
  createHandoverPack,
  createKnowledgeRecord,
  getKnowledgeRecordById,
  getLatestUnresolvedReviewComment,
  resubmitKnowledgeRecordForReview,
  updateHandoverTaskStatus,
  updateKnowledgeRecord
} from '@/lib/knowledge-service';
import { ApprovalState } from '@/lib/domain';
import { assertCanApplyStatusChange } from '@/lib/status-policy';
import { assertCanEditRecord, EDITOR_ROLES } from '@/lib/edit-policy';

function parseTags(raw: FormDataEntryValue | null): string[] {
  if (!raw || typeof raw !== 'string') return [];
  return raw
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function parseCsv(raw: FormDataEntryValue | null): string[] {
  if (!raw || typeof raw !== 'string') return [];
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function parseOptionalReference(formData: FormData, key: string, clearOnBlank: boolean): string | undefined | null {
  const raw = formData.get(key);
  if (raw === null) {
    return undefined;
  }
  const normalized = String(raw).trim();
  if (!normalized) {
    return clearOnBlank ? null : undefined;
  }
  return normalized;
}

export async function createKnowledgeRecordAction(formData: FormData) {
  const actor = await requireAnyRole(['TECHNICIAN', 'SENIOR_TECHNICIAN', 'SUPERVISOR']);
  const type = String(formData.get('type') ?? 'FIELD_NOTE') as 'PROCEDURE' | 'FIELD_NOTE' | 'FAILURE_PATTERN' | 'LESSON_LEARNED';

  const created = await createKnowledgeRecord({
    type,
    title: String(formData.get('title') ?? '').trim(),
    asset: String(formData.get('asset') ?? '').trim(),
    system: String(formData.get('system') ?? '').trim(),
    task: String(formData.get('task') ?? '').trim(),
    symptom: String(formData.get('symptom') ?? '').trim(),
    environment: String(formData.get('environment') ?? '').trim(),
    tags: parseTags(formData.get('tags')),
    confidence: String(formData.get('confidence') ?? 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH',
    body: String(formData.get('body') ?? '').trim(),
    sourceExpertId: parseOptionalReference(formData, 'sourceExpertId', false) ?? undefined,
    handoverPackId: parseOptionalReference(formData, 'handoverPackId', false) ?? undefined,
    author: actor.name,
    actor: {
      actorUserId: actor.id,
      actorName: actor.name,
      actorRole: actor.role
    }
  });

  revalidatePath('/dashboard');
  revalidatePath('/search');
  revalidatePath('/knowledge-records');
  revalidatePath('/review-queue');

  redirect(`/knowledge-records/${created.id}?created=1`);
}

export async function updateKnowledgeStatusAction(formData: FormData) {
  const actor = await requireAnyRole(['REVIEWER', 'SUPERVISOR', 'ADMIN']);
  const id = String(formData.get('id') ?? '').trim();
  const status = String(formData.get('status') ?? '').trim() as ApprovalState;
  const decision = String(formData.get('decision') ?? '').trim();
  const reviewerRationale = String(formData.get('reviewerRationale') ?? '').trim();
  const commentSection = String(formData.get('commentSection') ?? '').trim();
  const commentText = String(formData.get('commentText') ?? '').trim();

  if (!id) {
    return;
  }

  const record = await getKnowledgeRecordById(id);
  if (!record) {
    throw new Error('Record not found.');
  }

  if (decision) {
    try {
      const updated = await applyReviewDecision({
        id,
        decision: decision as 'APPROVE' | 'REQUEST_CHANGES',
        reviewerName: actor.name,
        reviewerRationale,
        comments: commentText
          ? [
              {
                section: (commentSection || 'BODY') as 'TITLE' | 'BODY' | 'TAXONOMY' | 'TAGS' | 'CONFIDENCE' | 'TYPE_PAYLOAD',
                text: commentText
              }
            ]
          : [],
        actor: {
          actorUserId: actor.id,
          actorName: actor.name,
          actorRole: actor.role
        }
      });

      if (!updated) {
        throw new Error('Record not found.');
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'Reviewer rationale is required when requesting changes.') {
        redirect(`/review-queue?error=review-rationale-required`);
      }
      if (
        error instanceof Error &&
        (error.message === 'Role is not permitted to apply this review decision.' || error.message.startsWith('Invalid review decision transition:'))
      ) {
        redirect('/review-queue?error=review-decision-not-allowed');
      }
      throw error;
    }
  } else {
    if (!status) {
      return;
    }

    if (status === 'UNDER_REVIEW' && record.approvalState === 'DRAFT') {
      const unresolved = await getLatestUnresolvedReviewComment(id);
      if (unresolved) {
        redirect('/review-queue?error=resubmission-required');
      }
    }

    assertCanApplyStatusChange(actor.role, record.approvalState, status);

    await changeKnowledgeRecordStatus(id, status, actor.name, {
      actorUserId: actor.id,
      actorName: actor.name,
      actorRole: actor.role
    });
  }

  revalidatePath('/dashboard');
  revalidatePath('/search');
  revalidatePath('/knowledge-records');
  revalidatePath('/review-queue');
  revalidatePath(`/knowledge-records/${id}`);
  redirect('/review-queue?updated=1');
}

export async function addReviewCommentAction(formData: FormData) {
  const actor = await requireAnyRole(['REVIEWER', 'ADMIN']);
  const id = String(formData.get('id') ?? '').trim();
  const section = String(formData.get('commentSection') ?? '').trim();
  const text = String(formData.get('commentText') ?? '').trim();

  if (!id) return;

  try {
    const updated = await addReviewComment({
      id,
      reviewerName: actor.name,
      comment: {
        section: section as 'TITLE' | 'BODY' | 'TAXONOMY' | 'TAGS' | 'CONFIDENCE' | 'TYPE_PAYLOAD',
        text
      },
      actor: {
        actorUserId: actor.id,
        actorName: actor.name,
        actorRole: actor.role
      }
    });
    if (!updated) {
      throw new Error('Record not found.');
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'Role is not permitted to add review comments.') {
      redirect('/review-queue?error=review-comment-not-allowed');
    }
    throw error;
  }

  revalidatePath('/review-queue');
  revalidatePath(`/knowledge-records/${id}`);
  revalidatePath(`/knowledge-records/${id}/edit`);
  redirect(`/knowledge-records/${id}?updated=1`);
}

export async function resubmitKnowledgeRecordForReviewAction(formData: FormData) {
  const actor = await requireAnyRole(EDITOR_ROLES);
  const id = String(formData.get('id') ?? '').trim();
  const editorResponseNote = String(formData.get('editorResponseNote') ?? '').trim();
  const addressedCommentIds = formData
    .getAll('addressedCommentIds')
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (!id) {
    return;
  }

  try {
    const updated = await resubmitKnowledgeRecordForReview({
      id,
      editorName: actor.name,
      editorResponseNote,
      addressedCommentIds,
      actor: {
        actorUserId: actor.id,
        actorName: actor.name,
        actorRole: actor.role
      }
    });

    if (!updated) {
      throw new Error('Record not found.');
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'Role is not permitted to resubmit this record for review.') {
      redirect(`/knowledge-records/${id}/edit?error=resubmission-not-allowed`);
    }
    throw error;
  }

  revalidatePath('/dashboard');
  revalidatePath('/search');
  revalidatePath('/knowledge-records');
  revalidatePath('/review-queue');
  revalidatePath(`/knowledge-records/${id}`);
  redirect(`/review-queue?updated=1&resubmitted=1`);
}

export async function updateKnowledgeRecordAction(formData: FormData) {
  const actor = await requireAnyRole(EDITOR_ROLES);
  const id = String(formData.get('id') ?? '').trim();

  if (!id) {
    throw new Error('Record id is required.');
  }
  assertCanEditRecord(actor.role);

  let updated;
  try {
    updated = await updateKnowledgeRecord({
      id,
      title: String(formData.get('title') ?? '').trim(),
      asset: String(formData.get('asset') ?? '').trim(),
      system: String(formData.get('system') ?? '').trim(),
      task: String(formData.get('task') ?? '').trim(),
      symptom: String(formData.get('symptom') ?? '').trim(),
      environment: String(formData.get('environment') ?? '').trim(),
      tags: parseTags(formData.get('tags')),
      confidence: String(formData.get('confidence') ?? 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH',
      body: String(formData.get('body') ?? '').trim(),
      sourceExpertId: parseOptionalReference(formData, 'sourceExpertId', true),
      handoverPackId: parseOptionalReference(formData, 'handoverPackId', true),
      changeNote: String(formData.get('changeNote') ?? '').trim(),
      changeReason: String(formData.get('changeReason') ?? '').trim(),
      editorName: actor.name,
      actor: {
        actorUserId: actor.id,
        actorName: actor.name,
        actorRole: actor.role
      }
    });
  } catch (error) {
      if (error instanceof Error && error.message === 'Change reason is required when editing an APPROVED record.') {
        redirect(`/knowledge-records/${id}/edit?error=approved-change-reason-required`);
      }
    throw error;
  }

  if (!updated) {
    throw new Error('Record not found.');
  }

  revalidatePath('/dashboard');
  revalidatePath('/search');
  revalidatePath('/knowledge-records');
  revalidatePath('/review-queue');
  revalidatePath(`/knowledge-records/${id}`);

  redirect(`/knowledge-records/${id}?updated=1`);
}

export async function createExpertProfileAction(formData: FormData) {
  await requireAnyRole(['SUPERVISOR', 'REVIEWER', 'ADMIN']);
  await createExpertProfile({
    name: String(formData.get('name') ?? '').trim(),
    roleFocus: String(formData.get('roleFocus') ?? '').trim(),
    domains: parseCsv(formData.get('domains')),
    assets: parseCsv(formData.get('assets')),
    yearsExperience: Number(formData.get('yearsExperience') ?? 0),
    retirementWindowStart: String(formData.get('retirementWindowStart') ?? '').trim() || undefined,
    retirementWindowEnd: String(formData.get('retirementWindowEnd') ?? '').trim() || undefined,
    riskLevel: String(formData.get('riskLevel') ?? 'MEDIUM').trim() as 'LOW' | 'MEDIUM' | 'HIGH',
    notes: String(formData.get('notes') ?? '').trim() || undefined
  });

  revalidatePath('/dashboard');
  revalidatePath('/handover-packs');
  redirect('/handover-packs?updated=1');
}

export async function createHandoverPackAction(formData: FormData) {
  await requireAnyRole(['SUPERVISOR', 'REVIEWER', 'ADMIN']);
  await createHandoverPack({
    expertProfileId: String(formData.get('expertProfileId') ?? '').trim(),
    targetRole: String(formData.get('targetRole') ?? '').trim(),
    targetDate: String(formData.get('targetDate') ?? '').trim() || undefined,
    taskTitles: parseCsv(formData.get('taskTitles'))
  });

  revalidatePath('/dashboard');
  revalidatePath('/handover-packs');
  redirect('/handover-packs?updated=1');
}

export async function updateHandoverTaskStatusAction(formData: FormData) {
  await requireAnyRole(['SUPERVISOR', 'REVIEWER', 'ADMIN']);
  await updateHandoverTaskStatus({
    handoverPackId: String(formData.get('handoverPackId') ?? '').trim(),
    taskId: String(formData.get('taskId') ?? '').trim(),
    status: String(formData.get('status') ?? 'OPEN').trim() as 'OPEN' | 'IN_PROGRESS' | 'DONE',
    assigneeName: String(formData.get('assigneeName') ?? '').trim() || undefined
  });

  revalidatePath('/dashboard');
  revalidatePath('/handover-packs');
  redirect('/handover-packs?updated=1');
}
