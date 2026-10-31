import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireAnyRole } from '@/lib/authz';
import { getKnowledgeRecordById, getLatestUnresolvedReviewComment, getRelatedRecords, listAuditEvents, listRecordVersions, listReviewComments } from '@/lib/knowledge-service';
import { RecordDetail } from '@/features/knowledge-records/components/record-detail';
import { Button } from '@/components/ui/button';

interface RecordDetailPageProps {
  params: Promise<{ recordId: string }>;
  searchParams?: Promise<{ created?: string; updated?: string }>;
}

export default async function RecordDetailPage({ params, searchParams }: RecordDetailPageProps) {
  const actor = await requireAnyRole(['TECHNICIAN', 'SENIOR_TECHNICIAN', 'SUPERVISOR', 'REVIEWER', 'ADMIN']);
  const { recordId } = await params;
  const query = (await searchParams) ?? {};
  const record = await getKnowledgeRecordById(recordId);

  if (!record) notFound();

  const [related, auditEvents, versions, unresolvedReviewComment, reviewComments] = await Promise.all([
    getRelatedRecords(record),
    listAuditEvents(record.id),
    listRecordVersions(record.id),
    getLatestUnresolvedReviewComment(record.id),
    listReviewComments(record.id)
  ]);

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" className="pl-0">
        <Link href="/knowledge-records">
          <ArrowLeft className="h-4 w-4" />
          Back to records
        </Link>
      </Button>

      {query.created === '1' && <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">Record created successfully.</div>}
      {query.updated === '1' && <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">Record updated and version history refreshed.</div>}

      <RecordDetail
        record={record}
        related={related}
        auditEvents={auditEvents}
        versions={versions}
        unresolvedReviewComment={unresolvedReviewComment}
        reviewComments={reviewComments}
        actorRole={actor.role}
      />
    </div>
  );
}
