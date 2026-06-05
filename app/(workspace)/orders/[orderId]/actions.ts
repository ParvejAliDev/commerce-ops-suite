'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { recordAuditEntry } from '@/src/modules/audit/repository';
import { canUpdateOrders } from '@/src/modules/auth/access';
import { requireOrdersAccess } from '@/src/modules/auth/current-user';
import {
  addOrderNote,
  getOrderByExternalId,
  orderStatuses,
  updateOrderStatus,
  type OrderLifecycleStatus,
} from '@/src/modules/orders';

const orderLifecycleStatuses = orderStatuses.filter(
  (status): status is OrderLifecycleStatus => status !== 'all',
);

function parseOrderLifecycleStatus(value: string): OrderLifecycleStatus | null {
  return orderLifecycleStatuses.includes(value as OrderLifecycleStatus)
    ? (value as OrderLifecycleStatus)
    : null;
}

export async function updateOrderStatusAction(
  formData: FormData,
): Promise<void> {
  const user = await requireOrdersAccess();
  if (!canUpdateOrders(user)) {
    redirect('/login?error=forbidden');
  }

  const externalId = String(formData.get('orderId') ?? '').trim();
  const nextStatusValue = String(formData.get('nextStatus') ?? '').trim();
  const note = String(formData.get('note') ?? '').trim();
  const nextStatus = parseOrderLifecycleStatus(nextStatusValue);

  if (!externalId || !nextStatus) {
    redirect('/orders');
  }

  const order = await getOrderByExternalId(externalId);
  if (!order) {
    redirect('/orders');
  }

  const didUpdate = await updateOrderStatus({
    orderId: order.id,
    currentStatus: order.status,
    nextStatus,
    actorEmail: user.email,
    note,
  });

  if (didUpdate) {
    await recordAuditEntry({
      actorEmail: user.email,
      action: 'order.status_updated',
      targetType: 'order',
      targetId: externalId,
      details: `${order.status} -> ${nextStatus}`,
    });
  }

  revalidatePath('/orders');
  revalidatePath(`/orders/${externalId}`);
  redirect(`/orders/${externalId}`);
}

export async function addOrderNoteAction(formData: FormData): Promise<void> {
  const user = await requireOrdersAccess();
  if (!canUpdateOrders(user)) {
    redirect('/login?error=forbidden');
  }

  const externalId = String(formData.get('orderId') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();
  if (!externalId || !body) {
    redirect('/orders');
  }

  const order = await getOrderByExternalId(externalId);
  if (!order) {
    redirect('/orders');
  }

  await addOrderNote({
    orderId: order.id,
    actorEmail: user.email,
    body,
  });

  await recordAuditEntry({
    actorEmail: user.email,
    action: 'order.note_added',
    targetType: 'order',
    targetId: externalId,
    details: body.slice(0, 120),
  });

  revalidatePath(`/orders/${externalId}`);
  redirect(`/orders/${externalId}`);
}
