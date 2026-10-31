import { UserRole } from './domain';

export interface NavItem {
  href: string;
  label: string;
  roles: UserRole[];
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', roles: ['TECHNICIAN', 'SENIOR_TECHNICIAN', 'SUPERVISOR', 'REVIEWER', 'ADMIN'] },
  { href: '/knowledge-records', label: 'Knowledge Records', roles: ['TECHNICIAN', 'SENIOR_TECHNICIAN', 'SUPERVISOR', 'REVIEWER', 'ADMIN'] },
  { href: '/procedures', label: 'Procedures', roles: ['TECHNICIAN', 'SENIOR_TECHNICIAN', 'SUPERVISOR', 'REVIEWER', 'ADMIN'] },
  { href: '/job-logs', label: 'Job Logs', roles: ['TECHNICIAN', 'SENIOR_TECHNICIAN', 'SUPERVISOR', 'REVIEWER', 'ADMIN'] },
  { href: '/experts', label: 'Experts', roles: ['SENIOR_TECHNICIAN', 'SUPERVISOR', 'REVIEWER', 'ADMIN'] },
  { href: '/handover-packs', label: 'Handover Packs', roles: ['SENIOR_TECHNICIAN', 'SUPERVISOR', 'REVIEWER', 'ADMIN'] },
  { href: '/continuity-risk', label: 'Continuity & Risk Views', roles: ['SUPERVISOR', 'REVIEWER', 'ADMIN'] },
  { href: '/audit-trail', label: 'Audit Trail', roles: ['SUPERVISOR', 'REVIEWER', 'ADMIN'] },
  { href: '/capture-knowledge', label: 'Capture Knowledge', roles: ['TECHNICIAN', 'SENIOR_TECHNICIAN', 'SUPERVISOR'] },
  { href: '/search', label: 'Search', roles: ['TECHNICIAN', 'SENIOR_TECHNICIAN', 'SUPERVISOR', 'REVIEWER', 'ADMIN'] },
  { href: '/review-queue', label: 'Review Queue', roles: ['REVIEWER', 'SUPERVISOR', 'ADMIN'] },
  { href: '/admin', label: 'Admin', roles: ['ADMIN'] }
];

export function getNavForRole(role: UserRole) {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
