import { PageHeader } from '@/components/ui/page-header';
import { ShadowingLog } from '@/features/shadowing-records/components/shadowing-log';
import { ShadowingRecord } from '@/lib/domain';
import { listKnowledgeRecords } from '@/lib/knowledge-service';
import { requireAnyRole } from '@/lib/authz';

export default async function ShadowingRecordsPage() {
  await requireAnyRole(['TECHNICIAN', 'SENIOR_TECHNICIAN', 'SUPERVISOR', 'REVIEWER', 'ADMIN']);
  const records = (await listKnowledgeRecords({ type: 'SHADOWING_RECORD' })).filter(
    (item): item is ShadowingRecord => item.type === 'SHADOWING_RECORD'
  );

  return (
    <div>
      <PageHeader title="Shadowing Records" description="Track mentoring sessions, competency transfer, and practical outcomes." />
      <ShadowingLog records={records} />
    </div>
  );
}
