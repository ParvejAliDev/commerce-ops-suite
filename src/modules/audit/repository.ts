import { and, desc, eq } from 'drizzle-orm';

import { auditLogs } from '../../db/schema';
import { getDb } from '../../lib/db';
import { serializeTimestamp, type TimestampInput } from '../../lib/timestamps';
import type { AuditEntry } from './index';

type AuditRecord = AuditEntry & {
  id: number;
};

type AuditRow = Omit<AuditRecord, 'createdAt' | 'details'> & {
  createdAt: TimestampInput;
  details: string | null;
};

const auditSelection = {
  action: auditLogs.action,
  actorEmail: auditLogs.actorEmail,
  createdAt: auditLogs.createdAt,
  details: auditLogs.details,
  id: auditLogs.id,
  targetId: auditLogs.targetId,
  targetType: auditLogs.targetType,
} as const;

function mapAuditRow(row: AuditRow): AuditRecord {
  return {
    ...row,
    createdAt: serializeTimestamp(row.createdAt),
    details: row.details ?? '',
  };
}

export async function recordAuditEntry(input: {
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
}): Promise<void> {
  const db = getDb();

  await db.insert(auditLogs).values({
    action: input.action,
    actorEmail: input.actorEmail,
    details: input.details,
    targetId: input.targetId,
    targetType: input.targetType,
  });
}

export async function listAuditEntriesForTarget(
  targetType: string,
  targetId: string,
): Promise<AuditRecord[]> {
  const db = getDb();
  const rows = await db
    .select(auditSelection)
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.targetType, targetType),
        eq(auditLogs.targetId, targetId),
      ),
    )
    .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id));

  return rows.map(mapAuditRow);
}

export async function listRecentAuditEntries(
  limit = 20,
): Promise<AuditRecord[]> {
  const db = getDb();
  const rows = await db
    .select(auditSelection)
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
    .limit(limit);

  return rows.map(mapAuditRow);
}
