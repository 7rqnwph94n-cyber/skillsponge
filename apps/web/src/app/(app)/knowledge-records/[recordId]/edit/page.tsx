import Link from 'next/link';
import { notFound } from 'next/navigation';
import { resubmitKnowledgeRecordForReviewAction } from '@/app/(app)/actions';
import { PageHeader } from '@/components/ui/page-header';
import { EditRecordForm } from '@/features/knowledge-records/components/edit-record-form';
import { requireAnyRole } from '@/lib/authz';
import { EDITOR_ROLES } from '@/lib/edit-policy';
import { getKnowledgeRecordById, getLatestUnresolvedReviewComment, listExpertProfiles, listHandoverPacks, listReviewComments } from '@/lib/knowledge-service';
import { canResubmitForReview } from '@/lib/review-resubmission-policy';
import { getUnresolvedReviewComments } from '@/lib/review-comments';

interface EditRecordPageProps {
  params: Promise<{ recordId: string }>;
  searchParams?: Promise<{ error?: string; resubmitted?: string }>;
}

export default async function EditRecordPage({ params, searchParams }: EditRecordPageProps) {
  const actor = await requireAnyRole(EDITOR_ROLES);
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const record = await getKnowledgeRecordById(resolvedParams.recordId);
  if (!record) {
    notFound();
  }
  const [unresolvedReviewComment, reviewComments, expertProfiles, handoverPacks] = await Promise.all([
    getLatestUnresolvedReviewComment(record.id),
    listReviewComments(record.id),
    listExpertProfiles(),
    listHandoverPacks()
  ]);
  const openSectionComments = getUnresolvedReviewComments(reviewComments);
  const canActorResubmit = canResubmitForReview(actor.role, record.approvalState, Boolean(unresolvedReviewComment));

  return (
    <div className="space-y-4">
      {resolvedSearchParams?.error === 'approved-change-reason-required' && (
        <div className="panel border-rose-700 bg-rose-900/20 p-3 text-sm text-rose-300">
          Change reason is required when editing an approved record.
        </div>
      )}
      {resolvedSearchParams?.error === 'resubmission-not-allowed' && (
        <div className="panel border-rose-700 bg-rose-900/20 p-3 text-sm text-rose-300">
          Resubmission is only allowed from draft when there is open requested changes feedback.
        </div>
      )}
      {resolvedSearchParams?.resubmitted === '1' && (
        <div className="panel border-emerald-700 bg-emerald-900/20 p-3 text-sm text-emerald-300">
          Record resubmitted for review.
        </div>
      )}
      <Link href={`/knowledge-records/${record.id}`} className="inline-block text-sm text-slate-300 hover:text-emerald-300">
        Back to record
      </Link>
      <PageHeader title="Edit Knowledge Record" description="Create a new version and route it through review when required." />
      {unresolvedReviewComment && (
        <section className="panel p-4">
          <h3 className="text-lg font-semibold">Open review comments</h3>
          <p className="mt-2 text-sm text-amber-300">{unresolvedReviewComment.requestChangesEvent.metadata?.reviewerRationale ?? 'Reviewer requested changes.'}</p>
          {openSectionComments.length > 0 && (
            <ul className="mt-3 space-y-2 text-sm">
              {openSectionComments.map((comment) => (
                <li key={comment.id} className="rounded bg-slate-900 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-400">{comment.section}</p>
                  <p className="mt-1 text-slate-300">{comment.text}</p>
                  <p className="mt-1 text-xs text-slate-500">Status: {comment.status}</p>
                </li>
              ))}
            </ul>
          )}
          {canActorResubmit && (
            <form action={resubmitKnowledgeRecordForReviewAction} className="mt-3 space-y-2 rounded border border-amber-700 p-3">
              <input type="hidden" name="id" value={record.id} />
              {openSectionComments.length > 0 && (
                <div className="space-y-1 rounded bg-slate-900 p-3 text-sm">
                  <p className="font-medium text-slate-200">Mark addressed comments</p>
                  {openSectionComments.map((comment) => (
                    <label key={comment.id} className="flex items-center gap-2 text-slate-300">
                      <input type="checkbox" name="addressedCommentIds" value={comment.id} />
                      <span>{comment.section}: {comment.text}</span>
                    </label>
                  ))}
                </div>
              )}
              <textarea
                name="editorResponseNote"
                rows={2}
                className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                placeholder="Optional: what I changed"
              />
              <button className="rounded bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950">Resubmit for review</button>
            </form>
          )}
        </section>
      )}
      <EditRecordForm record={record} expertProfiles={expertProfiles} handoverPacks={handoverPacks} />
    </div>
  );
}
