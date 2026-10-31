import { ApprovalState, UserRole } from './domain';

const REVIEW_COMMENT_ROLES: UserRole[] = ['REVIEWER', 'ADMIN'];

export function canAddReviewComment(actorRole: UserRole, currentStatus: ApprovalState): boolean {
  return REVIEW_COMMENT_ROLES.includes(actorRole) && currentStatus === 'UNDER_REVIEW';
}

export function assertCanAddReviewComment(actorRole: UserRole, currentStatus: ApprovalState): void {
  if (!canAddReviewComment(actorRole, currentStatus)) {
    throw new Error('Role is not permitted to add review comments.');
  }
}
