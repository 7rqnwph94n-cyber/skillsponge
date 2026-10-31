import { ApprovalState, ReviewDecision, UserRole } from './domain';

const REVIEW_DECISION_ROLES: UserRole[] = ['REVIEWER', 'ADMIN'];

export function canApplyReviewDecision(actorRole: UserRole, currentStatus: ApprovalState): boolean {
  return REVIEW_DECISION_ROLES.includes(actorRole) && currentStatus === 'UNDER_REVIEW';
}

export function getTargetStatusForReviewDecision(decision: ReviewDecision): ApprovalState {
  return decision === 'APPROVE' ? 'APPROVED' : 'DRAFT';
}

export function requiresRationale(decision: ReviewDecision): boolean {
  return decision === 'REQUEST_CHANGES';
}

export function assertCanApplyReviewDecision(actorRole: UserRole, currentStatus: ApprovalState, decision: ReviewDecision): void {
  if (!canApplyReviewDecision(actorRole, currentStatus)) {
    throw new Error('Role is not permitted to apply this review decision.');
  }

  if (!['APPROVE', 'REQUEST_CHANGES'].includes(decision)) {
    throw new Error('Invalid review decision.');
  }
}
