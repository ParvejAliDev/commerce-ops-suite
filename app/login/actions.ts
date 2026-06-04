'use server';

import { redirect } from 'next/navigation';

import {
  authenticateUser,
  startUserSession,
} from '../../src/modules/auth/current-user';

export async function loginAction(formData: FormData): Promise<void> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    redirect('/login?error=missing_credentials');
  }

  const user = await authenticateUser(email, password);
  if (!user) {
    redirect('/login?error=invalid_credentials');
  }

  await startUserSession(user);
  redirect('/orders');
}
