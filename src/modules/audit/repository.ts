import { getSql } from '../../lib/db';
import type { AuditEntry } from './index';

type AuditRow = AuditEntry & {
  id: number;
};

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
): Promise<AuditRow[]> {
  const sql = getSql();

  return sql<AuditRow[]>`
    select
      id,
      actor_email as "actorEmail",
      action,
      target_type as "targetType",
      target_id as "targetId",
      coalesce(details, '') as details,
      to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') as "createdAt"
    from audit_logs
    where target_type = ${targetType}
      and target_id = ${targetId}
    order by created_at desc, id desc
  `;
}

export async function listRecentAuditEntries(limit = 20): Promise<AuditRow[]> {
  const sql = getSql();

  return sql<AuditRow[]>`
    select
      id,
      actor_email as "actorEmail",
      action,
      target_type as "targetType",
      target_id as "targetId",
      coalesce(details, '') as details,
      to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') as "createdAt"
    from audit_logs
    order by created_at desc, id desc
    limit ${limit}
  `;
}
