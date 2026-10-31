import { notFound } from 'next/navigation';
import { requireAnyRole } from '@/lib/authz';
import { getJobLogById, verifyJobLogIntegrity, listJobLogAuditEvents } from '@/lib/job-log-service';
import { JobLogReviewPanel } from '@/features/job-logs/components/job-log-review-panel';

export default async function JobLogReviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAnyRole(['REVIEWER', 'SUPERVISOR', 'ADMIN']);
  const { id } = await params;

  const [jobLog, integrityValid, auditEvents] = await Promise.all([
    getJobLogById(id),
    verifyJobLogIntegrity(id),
    listJobLogAuditEvents(id)
  ]);

  if (!jobLog) notFound();

  return (
    <JobLogReviewPanel
      jobLog={jobLog}
      integrityValid={integrityValid}
      auditEvents={auditEvents}
    />
  );
}
