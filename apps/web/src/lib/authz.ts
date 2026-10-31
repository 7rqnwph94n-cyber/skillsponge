import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { UserRole } from '@/lib/domain';

export interface AuthActor {
  id: string;
  name: string;
  role: UserRole;
}

export async function requireAuth(): Promise<AuthActor> {
  const session = await auth();

  if (!session?.user?.id || !session.user.role || !session.user.name) {
    redirect('/login');
  }

  return {
    id: session.user.id,
    name: session.user.name,
    role: session.user.role
  };
}

export async function requireAnyRole(allowedRoles: UserRole[]): Promise<AuthActor> {
  const actor = await requireAuth();
  if (!allowedRoles.includes(actor.role)) {
    redirect('/dashboard?denied=1');
  }
  return actor;
}
