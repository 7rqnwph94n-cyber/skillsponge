import { PageHeader } from '@/components/ui/page-header';
import { ReviewQueueTable } from '@/features/review-queue/components/review-queue-table';
import { getLatestUnresolvedReviewComment, listReviewComments, listReviewQueue } from '@/lib/knowledge-service';
import { getUnresolvedReviewComments } from '@/lib/review-comments';
import { ReviewQueueContext } from '@/lib/review-queue-label';
import { requireAnyRole } from '@/lib/authz';

interface ReviewQueuePageProps {
  searchParams?: Promise<{
    updated?: string;
    resubmitted?: string;
    error?: string;
  }>;
}

export default async function ReviewQueuePage({ searchParams }: ReviewQueuePageProps) {
  const actor = await requireAnyRole(['REVIEWER', 'SUPERVISOR', 'ADMIN']);
  const resolvedSearchParams = await searchParams;
  const records = await listReviewQueue();
  const reviewContextByRecordId = Object.fromEntries(
    await Promise.all(
      records.map(async (record) => {
        const unresolved = await getLatestUnresolvedReviewComment(record.id);
        const openComments = getUnresolvedReviewComments(await listReviewComments(record.id));
        const context: ReviewQueueContext = {
          latestReviewerRationale: unresolved?.requestChangesEvent.metadata?.reviewerRationale,
          isResubmission: record.approvalState === 'UNDER_REVIEW' && Boolean(unresolved?.latestResubmissionEvent),
          openCommentCount: openComments.length,
          openCommentSections: [...new Set(openComments.map((comment) => comment.section))]
        };
        return [
          record.id,
          context
        ] as [string, ReviewQueueContext];
      })
    )
  );

  return (
    <div className="space-y-4">
      {resolvedSearchParams?.updated === '1' && (
        <div className="panel border-emerald-700 bg-emerald-900/20 p-3 text-sm text-emerald-300">
          {resolvedSearchParams?.resubmitted === '1' ? 'Record resubmitted for review.' : 'Review decision saved.'}
        </div>
      )}
      {resolvedSearchParams?.error === 'review-rationale-required' && (
        <div className="panel border-rose-700 bg-rose-900/20 p-3 text-sm text-rose-300">
          Reviewer rationale is required when requesting changes.
        </div>
      )}
      {resolvedSearchParams?.error === 'review-decision-not-allowed' && (
        <div className="panel border-rose-700 bg-rose-900/20 p-3 text-sm text-rose-300">
          This review decision is not allowed for your role or the record state.
        </div>
      )}
      {resolvedSearchParams?.error === 'review-comment-not-allowed' && (
        <div className="panel border-rose-700 bg-rose-900/20 p-3 text-sm text-rose-300">
          Review comments can only be added by reviewer/admin while the record is under review.
        </div>
      )}
      {resolvedSearchParams?.error === 'resubmission-required' && (
        <div className="panel border-rose-700 bg-rose-900/20 p-3 text-sm text-rose-300">
          This record has open requested changes. Use the explicit resubmission action from the record detail or edit page.
        </div>
      )}
      <PageHeader title="Review Queue" description="Move records to review, approve trusted content, or archive obsolete content." />
      <ReviewQueueTable records={records} actorRole={actor.role} reviewContextByRecordId={reviewContextByRecordId} />
    </div>
  );
}
