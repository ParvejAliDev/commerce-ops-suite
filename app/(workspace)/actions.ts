'use server';

import { redirect } from 'next/navigation';

import { endCurrentUserSession } from '@/src/modules/auth/logout';

export async function logoutAction(): Promise<void> {
  await endCurrentUserSession();
  redirect('/login');
}
