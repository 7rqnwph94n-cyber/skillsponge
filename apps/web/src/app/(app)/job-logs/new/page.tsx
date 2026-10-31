import { requireAnyRole } from '@/lib/authz';
import { PageHeader } from '@/components/ui/page-header';
import { CreateJobLogForm } from '@/features/job-logs/components/create-job-log-form';

export default async function NewJobLogPage() {
  await requireAnyRole(['TECHNICIAN', 'SENIOR_TECHNICIAN', 'SUPERVISOR']);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Job Log"
        description="Start a new field job record. All details are hashed at creation for tamper-evident traceability."
      />
      <CreateJobLogForm />
    </div>
  );
}
