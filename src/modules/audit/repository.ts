import { getSql } from '../../lib/db';
import { serializeTimestamp, type TimestampInput } from '../../lib/timestamps';
import type { AuditEntry } from './index';

type AuditRecord = AuditEntry & {
  id: number;
};

type AuditRow = Omit<AuditRecord, 'createdAt'> & {
  createdAt: TimestampInput;
};

function mapAuditRow(row: AuditRow): AuditRecord {
  return {
    ...row,
    createdAt: serializeTimestamp(row.createdAt),
  };
}

export async function recordAuditEntry(input: {
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
}): Promise<void> {
  const sql = getSql();

  await sql`
    insert into audit_logs (
      actor_email,
      action,
      target_type,
      target_id,
      details
    )
    values (
      ${input.actorEmail},
      ${input.action},
      ${input.targetType},
      ${input.targetId},
      ${input.details}
    )
  `;
}

export async function listAuditEntriesForTarget(
  targetType: string,
  targetId: string,
): Promise<AuditRecord[]> {
  const sql = getSql();

  const rows = await sql<AuditRow[]>`
    select
      id,
      actor_email as "actorEmail",
      action,
      target_type as "targetType",
      target_id as "targetId",
      coalesce(details, '') as details,
      created_at as "createdAt"
    from audit_logs
    where target_type = ${targetType}
      and target_id = ${targetId}
    order by created_at desc, id desc
  `;

  return rows.map(mapAuditRow);
}

export async function listRecentAuditEntries(
  limit = 20,
): Promise<AuditRecord[]> {
  const sql = getSql();

  const rows = await sql<AuditRow[]>`
    select
      id,
      actor_email as "actorEmail",
      action,
      target_type as "targetType",
      target_id as "targetId",
      coalesce(details, '') as details,
      created_at as "createdAt"
    from audit_logs
    order by created_at desc, id desc
    limit ${limit}
  `;

  return rows.map(mapAuditRow);
}
