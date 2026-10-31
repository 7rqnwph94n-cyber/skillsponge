import { AuditEvent, ReviewCommentSection, ReviewCommentStatus, ReviewCommentThread } from './domain';

export interface ReviewCommentInput {
  section: ReviewCommentSection;
  text: string;
}

export const REVIEW_COMMENT_SECTIONS: ReviewCommentSection[] = ['TITLE', 'BODY', 'TAXONOMY', 'TAGS', 'CONFIDENCE', 'TYPE_PAYLOAD'];

export function isReviewCommentSection(value: string): value is ReviewCommentSection {
  return REVIEW_COMMENT_SECTIONS.includes(value as ReviewCommentSection);
}

export function deriveReviewComments(events: AuditEvent[]): ReviewCommentThread[] {
  const ordered = [...events].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  const comments = new Map<string, ReviewCommentThread>();

  for (const event of ordered) {
    if (event.eventType === 'REVIEW_COMMENT_ADDED') {
      const id = event.metadata?.reviewCommentId;
      const section = event.metadata?.reviewCommentSection;
      const text = event.metadata?.reviewCommentText;
      if (!id || !section || !text) continue;

      comments.set(id, {
        id,
        recordId: event.recordId,
        section,
        text,
        status: 'OPEN',
        createdAt: event.createdAt,
        createdBy: event.actorName,
        createdByRole: event.actorRole
      });
      continue;
    }

    if (event.eventType === 'REVIEW_COMMENT_STATUS_CHANGED') {
      const id = event.metadata?.reviewCommentId;
      const status = event.metadata?.reviewCommentStatus;
      if (!id || !status) continue;
      const existing = comments.get(id);
      if (!existing) continue;

      if (status === 'ADDRESSED') {
        comments.set(id, {
          ...existing,
          status,
          addressedAt: event.createdAt,
          addressedBy: event.actorName,
          addressedByRole: event.actorRole,
          addressedNote: event.metadata?.reviewCommentResponseNote
        });
      } else if (status === 'RESOLVED') {
        comments.set(id, {
          ...existing,
          status,
          resolvedAt: event.createdAt,
          resolvedBy: event.actorName,
          resolvedByRole: event.actorRole
        });
      }
    }
  }

  return [...comments.values()].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function getUnresolvedReviewComments(comments: ReviewCommentThread[]): ReviewCommentThread[] {
  return comments.filter((comment) => comment.status !== 'RESOLVED');
}
