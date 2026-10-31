import { notFound } from 'next/navigation';
import { requireAnyRole } from '@/lib/authz';
import { getJobLogById, verifyJobLogIntegrity, listJobLogAuditEvents } from '@/lib/job-log-service';
import { listKnowledgeRecords } from '@/lib/knowledge-service';
import { JobLogWorkspace } from '@/features/job-logs/components/job-log-workspace';
import type { ProcedureRecord } from '@/lib/domain';

export default async function JobLogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireAnyRole(['TECHNICIAN', 'SENIOR_TECHNICIAN', 'SUPERVISOR', 'REVIEWER', 'ADMIN']);
  const { id } = await params;

  const [jobLog, integrityValid, auditEvents, allProcedures] = await Promise.all([
    getJobLogById(id),
    verifyJobLogIntegrity(id),
    listJobLogAuditEvents(id),
    listKnowledgeRecords({ type: 'PROCEDURE', status: 'APPROVED' })
  ]);

  if (!jobLog) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

  // Map procedures to a simpler shape for the client component
  const availableProcedures = (allProcedures as ProcedureRecord[]).map((p) => ({
    id: p.id,
    title: p.title,
    asset: p.context.asset,
    steps: p.steps
  }));

  return (
    <JobLogWorkspace
      jobLog={jobLog}
      integrityValid={integrityValid}
      auditEvents={auditEvents}
      baseUrl={baseUrl}
      actorRole={actor.role}
      availableProcedures={availableProcedures}
    />
  );
}
