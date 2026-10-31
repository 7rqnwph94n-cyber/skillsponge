import { ApprovalState, UserRole } from './domain';
import { EDITOR_ROLES } from './edit-policy';

export function canResubmitForReview(actorRole: UserRole, currentStatus: ApprovalState, hasOpenRequestChanges: boolean): boolean {
  return EDITOR_ROLES.includes(actorRole) && currentStatus === 'DRAFT' && hasOpenRequestChanges;
}

export function assertCanResubmitForReview(actorRole: UserRole, currentStatus: ApprovalState, hasOpenRequestChanges: boolean): void {
  if (!canResubmitForReview(actorRole, currentStatus, hasOpenRequestChanges)) {
    throw new Error('Role is not permitted to resubmit this record for review.');
  }
}
