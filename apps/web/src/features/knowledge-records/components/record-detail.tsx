import Link from 'next/link';
import { addReviewCommentAction, resubmitKnowledgeRecordForReviewAction, updateKnowledgeStatusAction } from '@/app/(app)/actions';
import { AuditEvent, KnowledgeRecord, RecordVersion, ReviewCommentThread, UnresolvedReviewComment, UserRole } from '@/lib/domain';
import { canResubmitForReview } from '@/lib/review-resubmission-policy';
import { getUnresolvedReviewComments } from '@/lib/review-comments';
import { buildVersionDiff } from '@/lib/review-diff';
import { getTypeLabel } from '@/lib/knowledge-service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/utils';

function recordTypeSection(record: KnowledgeRecord) {
  if (record.type === 'PROCEDURE') {
    return (
      <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
        {record.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    );
  }
  if (record.type === 'FIELD_NOTE') {
    return (
      <div className="space-y-3 text-sm">
        <div>
          <p className="font-semibold text-slate-900">Observation</p>
          <p className="mt-1 text-slate-700">{record.observation}</p>
        </div>
        <div>
          <p className="font-semibold text-slate-900">Immediate action</p>
          <p className="mt-1 text-slate-700">{record.immediateAction}</p>
        </div>
      </div>
    );
  }
  if (record.type === 'FAILURE_PATTERN') {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="font-semibold text-slate-900">Pattern signals</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {record.patternSignals.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold text-slate-900">Likely causes</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {record.likelyCauses.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
  if (record.type === 'LESSON_LEARNED') {
    return (
      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
        {record.lessonPoints.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }
  if (record.type === 'EXPERT_INTERVIEW') {
    return (
      <div className="space-y-3 text-sm">
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="font-semibold text-slate-900">What novices miss</p>
          <p className="mt-1 text-slate-700">{record.answers.whatNoviceMisses}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="font-semibold text-slate-900">Top danger signs</p>
          <p className="mt-1 text-slate-700">{record.answers.topThreeDangerSigns}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="font-semibold text-slate-900">First check before opening</p>
          <p className="mt-1 text-slate-700">{record.answers.firstCheckBeforeOpening}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-2 text-sm">
      <p><span className="font-semibold text-slate-900">Senior technician:</span> {record.seniorTechnician}</p>
      <p><span className="font-semibold text-slate-900">Junior technician:</span> {record.juniorTechnician}</p>
      <p><span className="font-semibold text-slate-900">Competency score:</span> {record.competencyScore}/5</p>
      <p><span className="font-semibold text-slate-900">Session outcome:</span> {record.sessionOutcome}</p>
    </div>
  );
}

function eventLabel(eventType: AuditEvent['eventType']): string {
  if (eventType === 'RECORD_CREATED') return 'Record created';
  if (eventType === 'STATUS_CHANGED') return 'Status changed';
  if (eventType === 'REVIEW_DECISION') return 'Reviewer decision';
  if (eventType === 'REVIEW_RESUBMITTED') return 'Resubmitted for review';
  if (eventType === 'REVIEW_COMMENT_ADDED') return 'Comment added';
  return 'Comment status updated';
}

export function RecordDetail({
  record,
  related,
  auditEvents,
  versions,
  unresolvedReviewComment,
  reviewComments,
  actorRole
}: {
  record: KnowledgeRecord;
  related: KnowledgeRecord[];
  auditEvents: AuditEvent[];
  versions: RecordVersion[];
  unresolvedReviewComment?: UnresolvedReviewComment;
  reviewComments: ReviewCommentThread[];
  actorRole: UserRole;
}) {
  const openSectionComments = getUnresolvedReviewComments(reviewComments);
  const currentVersion = versions[0];
  const previousVersion = versions[1];
  const versionDiff = buildVersionDiff(currentVersion, previousVersion);
  const canEditorAct = actorRole === 'SENIOR_TECHNICIAN' || actorRole === 'SUPERVISOR' || actorRole === 'REVIEWER' || actorRole === 'ADMIN';
  const canReviewerDecide = (actorRole === 'REVIEWER' || actorRole === 'ADMIN') && record.approvalState === 'UNDER_REVIEW';
  const canReviewerComment = canReviewerDecide;
  const canResubmit = canResubmitForReview(actorRole, record.approvalState, Boolean(unresolvedReviewComment));
  const reviewer = record.reviewer ?? 'Unassigned reviewer';

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge state={record.approvalState} />
            <Badge variant="outline">Version {record.currentVersion}</Badge>
            <Badge variant="outline">Type: {getTypeLabel(record.type)}</Badge>
          </div>
          <h1 className="mt-3 text-2xl font-bold text-slate-950">{record.title}</h1>
          <p className="mt-2 text-sm text-slate-600">{record.summary}</p>
          <p className="mt-3 text-sm text-slate-500">Last approved by {reviewer} on {formatDate(record.lastValidatedAt ?? record.createdAt)}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {canEditorAct && (
              <>
                <Button asChild variant="outline">
                  <Link href={`/knowledge-records/${record.id}/edit`}>Edit</Link>
                </Button>
                {canResubmit && (
                  <form action={resubmitKnowledgeRecordForReviewAction}>
                    <input type="hidden" name="id" value={record.id} />
                    <Button type="submit">Resubmit for Review</Button>
                  </form>
                )}
              </>
            )}
            {canReviewerDecide && (
              <>
                <form action={updateKnowledgeStatusAction}>
                  <input type="hidden" name="id" value={record.id} />
                  <input type="hidden" name="decision" value="APPROVE" />
                  <Input name="reviewerRationale" placeholder="Optional approval rationale" className="mb-2 h-10" />
                  <Button type="submit" className="w-full">Approve</Button>
                </form>
                <form action={updateKnowledgeStatusAction}>
                  <input type="hidden" name="id" value={record.id} />
                  <input type="hidden" name="decision" value="REQUEST_CHANGES" />
                  <Input name="reviewerRationale" required placeholder="Required reviewer rationale" className="mb-2 h-10" />
                  <Button type="submit" variant="destructive" className="w-full">Request Changes</Button>
                </form>
              </>
            )}
            <Button asChild variant="industrial">
              <Link href={`/knowledge-records/${record.id}#versions`}>View Versions</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/search?keyword=${encodeURIComponent(record.title)}`}>Link to Expert/Handover</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          <Tabs defaultValue="content">
            <TabsList>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="comments">Section Comments ({openSectionComments.length})</TabsTrigger>
              <TabsTrigger value="diff">Before/After Diff</TabsTrigger>
            </TabsList>
            <TabsContent value="content" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Record Content</CardTitle>
                  <CardDescription>{record.context.asset} • {record.context.system} • {record.context.task}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Body</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{record.body}</p>
                  </div>
                  <Separator />
                  {recordTypeSection(record)}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Related Records</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {related.map((item) => (
                    <Link key={item.id} href={`/knowledge-records/${item.id}`} className="block rounded-md border border-slate-200 p-3 text-sm hover:bg-slate-50">
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <p className="text-slate-500">{getTypeLabel(item.type)} • {item.context.asset}</p>
                    </Link>
                  ))}
                  {!related.length && <p className="text-sm text-slate-500">No related records linked yet.</p>}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comments">
              <Card>
                <CardHeader>
                  <CardTitle>Section-scoped review comments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {unresolvedReviewComment?.requestChangesEvent.metadata?.reviewerRationale && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      Latest requested changes: {unresolvedReviewComment.requestChangesEvent.metadata.reviewerRationale}
                    </div>
                  )}
                  {openSectionComments.map((comment) => (
                    <div key={comment.id} className="rounded-lg border border-slate-200 p-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{comment.section}</Badge>
                        <Badge variant={comment.status === 'RESOLVED' ? 'approved' : comment.status === 'ADDRESSED' ? 'review' : 'changes'}>
                          {comment.status}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-slate-700">{comment.text}</p>
                    </div>
                  ))}
                  {canReviewerComment && (
                    <form action={addReviewCommentAction} className="space-y-2 rounded-lg border border-slate-200 p-3">
                      <input type="hidden" name="id" value={record.id} />
                      <Label htmlFor="commentSection">Section</Label>
                      <select id="commentSection" name="commentSection" defaultValue="BODY" className="h-11 w-full rounded-md border border-slate-300 px-3">
                        <option value="TITLE">Title</option>
                        <option value="BODY">Body</option>
                        <option value="TAXONOMY">Taxonomy</option>
                        <option value="TAGS">Tags</option>
                        <option value="CONFIDENCE">Confidence</option>
                        <option value="TYPE_PAYLOAD">Type-specific payload</option>
                      </select>
                      <Label htmlFor="commentText">Comment</Label>
                      <Textarea id="commentText" name="commentText" required placeholder="Add governance feedback for this section" />
                      <Button type="submit" variant="outline">Add Review Comment</Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="diff">
              <Card>
                <CardHeader>
                  <CardTitle>Version comparison</CardTitle>
                  <CardDescription>Current version vs previous version</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {versionDiff.hasChanges ? (
                    versionDiff.fields.map((field) => (
                      <div key={field.label} className="grid gap-2 rounded-lg border border-slate-200 p-3 lg:grid-cols-2">
                        <div className="rounded-md border border-red-200 bg-red-50 p-2">
                          <p className="text-xs font-semibold uppercase text-red-700">Before • {field.label}</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-red-900">{field.before || '(empty)'}</p>
                        </div>
                        <div className="rounded-md border border-green-200 bg-green-50 p-2">
                          <p className="text-xs font-semibold uppercase text-green-700">After • {field.label}</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-green-900">{field.after || '(empty)'}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No previous version available for comparison.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:h-fit">
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="font-semibold text-slate-900">Author:</span> {record.author}</p>
              <p><span className="font-semibold text-slate-900">Reviewer:</span> {reviewer}</p>
              <p><span className="font-semibold text-slate-900">Asset:</span> {record.context.asset}</p>
              <p><span className="font-semibold text-slate-900">System:</span> {record.context.system}</p>
              <p><span className="font-semibold text-slate-900">Task:</span> {record.context.task}</p>
              <p><span className="font-semibold text-slate-900">Symptom:</span> {record.context.symptom}</p>
              <p><span className="font-semibold text-slate-900">Source expert:</span> {record.sourceExpertName ?? 'Not linked'}</p>
              <p><span className="font-semibold text-slate-900">Handover pack:</span> {record.handoverPackId ?? 'Not linked'}</p>
              <p><span className="font-semibold text-slate-900">Tags:</span> {record.tags.join(', ') || 'None'}</p>
            </CardContent>
          </Card>

          {record.approvalState === 'APPROVED' && (
            <Card>
              <CardHeader>
                <CardTitle>Approved Edit Rationale</CardTitle>
                <CardDescription>Required for any edit to approved content.</CardDescription>
              </CardHeader>
              <CardContent>
                <Label htmlFor="approved-change-reason">Change reason</Label>
                <Textarea id="approved-change-reason" disabled value="Captured on edit screen before version write." />
              </CardContent>
            </Card>
          )}

          <Card id="versions">
            <CardHeader>
              <CardTitle>Version History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {versions.map((version) => (
                <div key={version.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                  <p className="font-semibold text-slate-900">Version {version.versionNumber}</p>
                  <p className="text-slate-600">{version.editedBy} • {formatDate(version.createdAt)}</p>
                  {version.changeReason && <p className="mt-1 text-slate-600">Reason: {version.changeReason}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
          <CardDescription>Immutable event log for this record.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {auditEvents.map((event) => (
            <div key={event.id} className="rounded-lg border border-slate-200 p-3 text-sm">
              <p className="font-semibold text-slate-900">{eventLabel(event.eventType)}</p>
              <p className="text-slate-600">
                {event.actorName}
                {event.actorRole ? ` (${event.actorRole.replace('_', ' ')})` : ''}
                {' • '}
                {new Date(event.createdAt).toLocaleString('en-GB')}
              </p>
              {(event.fromStatus || event.toStatus) && <p className="text-slate-500">{event.fromStatus ?? 'Unknown'} {'->'} {event.toStatus ?? 'Unknown'}</p>}
              {event.metadata?.reviewerRationale && <p className="text-slate-500">Rationale: {event.metadata.reviewerRationale}</p>}
              {event.metadata?.changeReason && <p className="text-slate-500">Change reason: {event.metadata.changeReason}</p>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
