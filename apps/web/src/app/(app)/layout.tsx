import { ReactNode } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { requireAuth } from '@/lib/authz';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const actor = await requireAuth();
  return <AppShell actor={actor}>{children}</AppShell>;
}
