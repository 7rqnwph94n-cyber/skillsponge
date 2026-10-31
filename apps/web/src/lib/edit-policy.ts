import { UserRole } from './domain';

export const EDITOR_ROLES: UserRole[] = ['SENIOR_TECHNICIAN', 'SUPERVISOR', 'REVIEWER', 'ADMIN'];

export function canEditRecord(role: UserRole): boolean {
  return EDITOR_ROLES.includes(role);
}

export function assertCanEditRecord(role: UserRole): void {
  if (!canEditRecord(role)) {
    throw new Error('Role is not permitted to edit knowledge records.');
  }
}
