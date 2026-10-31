'use server';

import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';
import { signIn, signOut } from '@/auth';

export async function loginAction(formData: FormData) {
  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!username || !password) {
    redirect('/login?error=CredentialsSignin');
  }

  try {
    const credentials = new FormData();
    credentials.set('username', username);
    credentials.set('password', password);
    credentials.set('redirectTo', '/dashboard');
    await signIn('credentials', credentials);
  } catch (error) {
    if (error instanceof AuthError) {
      redirect('/login?error=CredentialsSignin');
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: '/login' });
}
