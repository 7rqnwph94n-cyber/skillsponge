import { PageHeader } from '@/components/ui/page-header';
import { AdminOverview } from '@/features/admin/components/admin-overview';
import { requireAnyRole } from '@/lib/authz';

export default async function AdminPage() {
  await requireAnyRole(['ADMIN']);
  return (
    <div>
      <PageHeader title="Admin" description="Configure roles, taxonomy, and policy settings for the MVP." />
      <AdminOverview />
    </div>
  );
}
