import Link from 'next/link';
import { addReviewCommentAction, updateKnowledgeStatusAction } from '@/app/(app)/actions';
import { KnowledgeRecord, UserRole } from '@/lib/domain';
import { getTypeLabel } from '@/lib/knowledge-service';
import { getReviewQueueLabel, ReviewQueueContext } from '@/lib/review-queue-label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

export function ReviewQueueTable({
  records,
  actorRole,
  reviewContextByRecordId,
}: {
  records: KnowledgeRecord[];
  actorRole: UserRole;
  reviewContextByRecordId: Record<string, ReviewQueueContext>;
}) {
  const isSupervisor = actorRole === 'SUPERVISOR';
  const isReviewerOrAdmin = actorRole === 'REVIEWER' || actorRole === 'ADMIN';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Items awaiting review</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {records.map((record) => {
          const context = reviewContextByRecordId[record.id];
          return (
            <div key={record.id} className="rounded-md border p-4">
              <Badge variant="outline" className="mb-2 text-[10px] uppercase">{getReviewQueueLabel(context)}</Badge>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Link href={`/knowledge-records/${record.id}`} className="font-medium hover:text-primary transition-colors">
                    {record.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">{getTypeLabel(record.type)} &middot; {record.context.asset} &middot; {record.author}</p>
                  {context?.latestReviewerRationale && <p className="mt-1 text-xs text-yellow-500">Latest requested changes: {context.latestReviewerRationale}</p>}
                  {context?.openCommentCount ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Open section comments: {context.openCommentCount}
                      {context.openCommentSections?.length ? ` (${context.openCommentSections.join(', ')})` : ''}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {isSupervisor && record.approvalState === 'DRAFT' && (
                    <form action={updateKnowledgeStatusAction}>
                      <input type="hidden" name="id" value={record.id} />
                      <input type="hidden" name="status" value="UNDER_REVIEW" />
                      <Button variant="outline" size="sm" type="submit">Move to review</Button>
                    </form>
                  )}
                  {isReviewerOrAdmin && record.approvalState === 'UNDER_REVIEW' && (
                    <div className="grid gap-2 md:grid-cols-2">
                      <form action={updateKnowledgeStatusAction} className="space-y-2 rounded-md border p-2">
                        <input type="hidden" name="id" value={record.id} />
                        <input type="hidden" name="decision" value="APPROVE" />
                        <Input name="reviewerRationale" placeholder="Optional approval rationale" className="text-xs" />
                        <Button type="submit" size="sm" className="w-full">Approve</Button>
                      </form>
                      <form action={updateKnowledgeStatusAction} className="space-y-2 rounded-md border border-yellow-500/30 p-2">
                        <input type="hidden" name="id" value={record.id} />
                        <input type="hidden" name="decision" value="REQUEST_CHANGES" />
                        <select name="commentSection" className="w-full rounded-md border bg-background px-2 py-1 text-xs" defaultValue="BODY">
                          <option value="BODY">Body</option>
                          <option value="TITLE">Title</option>
                          <option value="TAXONOMY">Taxonomy</option>
                          <option value="TAGS">Tags</option>
                          <option value="CONFIDENCE">Confidence</option>
                          <option value="TYPE_PAYLOAD">Type-specific payload</option>
                        </select>
                        <Textarea name="commentText" rows={2} className="text-xs" placeholder="Optional section comment" />
                        <Textarea name="reviewerRationale" required rows={2} className="text-xs" placeholder="Required: what must be changed" />
                        <Button variant="outline" type="submit" size="sm" className="w-full text-yellow-500 border-yellow-500/30">Request changes</Button>
                      </form>
                    </div>
                  )}
                  {isReviewerOrAdmin && record.approvalState === 'UNDER_REVIEW' && (
                    <form action={addReviewCommentAction} className="space-y-2 rounded-md border p-2">
                      <input type="hidden" name="id" value={record.id} />
                      <select name="commentSection" defaultValue="BODY" className="w-full rounded-md border bg-background px-2 py-1 text-xs">
                        <option value="BODY">Body</option>
                        <option value="TITLE">Title</option>
                        <option value="TAXONOMY">Taxonomy</option>
                        <option value="TAGS">Tags</option>
                        <option value="CONFIDENCE">Confidence</option>
                        <option value="TYPE_PAYLOAD">Type-specific payload</option>
                      </select>
                      <Textarea name="commentText" required rows={2} className="text-xs" placeholder="Add section comment without decision" />
                      <Button variant="outline" type="submit" size="sm" className="w-full">Add comment</Button>
                    </form>
                  )}
                  {isReviewerOrAdmin && (
                    <form action={updateKnowledgeStatusAction}>
                      <input type="hidden" name="id" value={record.id} />
                      <input type="hidden" name="status" value="ARCHIVED" />
                      <Button variant="outline" size="sm" type="submit" className="text-red-400 border-red-500/30">Archive</Button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {!records.length && <p className="text-sm text-muted-foreground">No draft or under-review records.</p>}
      </CardContent>
    </Card>
  );
}
