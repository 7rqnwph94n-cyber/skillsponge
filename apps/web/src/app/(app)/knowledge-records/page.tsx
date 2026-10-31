import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { requireAnyRole } from '@/lib/authz';
import { getFilterOptions, listExpertProfiles, listKnowledgeRecords } from '@/lib/knowledge-service';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { KnowledgeRecordsList } from '@/features/knowledge-records/components/knowledge-records-list';

interface KnowledgeRecordsPageProps {
  searchParams?: Promise<Record<string, string | undefined>>;
}

export default async function KnowledgeRecordsPage({ searchParams }: KnowledgeRecordsPageProps) {
  await requireAnyRole(['TECHNICIAN', 'SENIOR_TECHNICIAN', 'SUPERVISOR', 'REVIEWER', 'ADMIN']);
  const params = (await searchParams) ?? {};
  const [records, options, experts] = await Promise.all([listKnowledgeRecords(), getFilterOptions(), listExpertProfiles()]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Knowledge Records"
        description="Find procedures, field notes, failure patterns, lessons, and expert capture records in under three clicks."
        actions={
          <Button asChild>
            <Link href="/capture-knowledge">
              <PlusCircle className="h-4 w-4" />
              New Record
            </Link>
          </Button>
        }
      />
      {params.created === '1' && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Record created successfully and saved in draft. <Link href="/review-queue" className="font-semibold underline">Open review queue</Link>
        </div>
      )}
      <KnowledgeRecordsList records={records} options={options} experts={experts} />
    </div>
  );
}
