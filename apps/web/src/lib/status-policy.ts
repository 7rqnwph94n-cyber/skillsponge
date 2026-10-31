import { ApprovalState, UserRole } from './domain';
import { canTransitionStatus } from './knowledge-repository';

export function canRoleRequestStatusChange(actorRole: UserRole, currentStatus: ApprovalState, targetStatus: ApprovalState): boolean {
  if (actorRole === 'SUPERVISOR') {
    return currentStatus === 'DRAFT' && targetStatus === 'UNDER_REVIEW';
  }

  if (actorRole === 'REVIEWER' || actorRole === 'ADMIN') {
    return targetStatus === 'APPROVED' || targetStatus === 'ARCHIVED';
  }

  return false;
}

export function canApplyStatusChange(actorRole: UserRole, currentStatus: ApprovalState, targetStatus: ApprovalState): boolean {
  return canRoleRequestStatusChange(actorRole, currentStatus, targetStatus) && canTransitionStatus(currentStatus, targetStatus);
}

export function assertCanApplyStatusChange(actorRole: UserRole, currentStatus: ApprovalState, targetStatus: ApprovalState): void {
  if (!canRoleRequestStatusChange(actorRole, currentStatus, targetStatus)) {
    throw new Error('Role is not permitted for requested status change.');
  }

  if (!canTransitionStatus(currentStatus, targetStatus)) {
    throw new Error(`Invalid status transition: ${currentStatus} -> ${targetStatus}`);
  }
}
