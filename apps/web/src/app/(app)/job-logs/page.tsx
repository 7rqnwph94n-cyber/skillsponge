import Link from 'next/link';
import { requireAnyRole } from '@/lib/authz';
import { listJobLogs } from '@/lib/job-log-service';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { JobLogsList } from '@/features/job-logs/components/job-logs-list';
import type { JobLogStatus } from '@/lib/job-log-domain';

export default async function JobLogsPage({ searchParams }: { searchParams: Promise<{ status?: string; keyword?: string }> }) {
  await requireAnyRole(['TECHNICIAN', 'SENIOR_TECHNICIAN', 'SUPERVISOR', 'REVIEWER', 'ADMIN']);
  const params = await searchParams;

  const statusFilter = params.status && params.status !== 'ALL' ? (params.status as JobLogStatus) : undefined;
  const jobLogs = await listJobLogs({ status: statusFilter, keyword: params.keyword });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Job Logs"
        description="Field job records with tamper-evident hashing and QR traceability."
        actions={
          <Button asChild>
            <Link href="/job-logs/new">
              <Plus className="h-4 w-4" />
              New Job Log
            </Link>
          </Button>
        }
      />
      <JobLogsList jobLogs={jobLogs} currentStatus={params.status ?? 'ALL'} />
    </div>
  );
}
