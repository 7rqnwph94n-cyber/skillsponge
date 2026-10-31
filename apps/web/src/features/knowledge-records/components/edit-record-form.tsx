import { updateKnowledgeRecordAction } from '@/app/(app)/actions';
import { ExpertProfile, HandoverPack, KnowledgeRecord } from '@/lib/domain';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export function EditRecordForm({
  record,
  expertProfiles,
  handoverPacks,
}: {
  record: KnowledgeRecord;
  expertProfiles: ExpertProfile[];
  handoverPacks: HandoverPack[];
}) {
  const requiresApprovedEditReason = record.approvalState === 'APPROVED';

  return (
    <form action={updateKnowledgeRecordAction} className="space-y-4">
      <input type="hidden" name="id" value={record.id} />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Edit record</CardTitle>
          <p className="text-sm text-muted-foreground">Saving creates a new version. If currently approved, it is moved to under review.</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm space-y-1.5">
              <span className="font-medium">Title</span>
              <Input name="title" defaultValue={record.title} required />
            </label>
            <label className="text-sm space-y-1.5">
              <span className="font-medium">Confidence</span>
              <select name="confidence" defaultValue={record.confidence} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Context</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <Input name="asset" required defaultValue={record.context.asset} placeholder="Asset" />
            <Input name="system" required defaultValue={record.context.system} placeholder="System" />
            <Input name="task" required defaultValue={record.context.task} placeholder="Task" />
            <Input name="symptom" required defaultValue={record.context.symptom} placeholder="Symptom" />
            <Input name="environment" required defaultValue={record.context.environment} placeholder="Environment" className="md:col-span-2" />
            <Input name="tags" defaultValue={record.tags.join(', ')} placeholder="Tags (comma separated)" className="md:col-span-2" />
            <label className="text-sm space-y-1.5 md:col-span-2">
              <span className="font-medium">Source expert (optional)</span>
              <select name="sourceExpertId" defaultValue={record.sourceExpertId ?? ''} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option value="">None</option>
                {expertProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>{profile.name} ({profile.roleFocus})</option>
                ))}
              </select>
            </label>
            <label className="text-sm space-y-1.5 md:col-span-2">
              <span className="font-medium">Linked handover pack (optional)</span>
              <select name="handoverPackId" defaultValue={record.handoverPackId ?? ''} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option value="">None</option>
                {handoverPacks.map((pack) => (
                  <option key={pack.id} value={pack.id}>{pack.expertName} &rarr; {pack.targetRole} ({pack.status.replaceAll('_', ' ')})</option>
                ))}
              </select>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <label className="text-sm space-y-1.5 block">
            <span className="font-medium">Body</span>
            <Textarea name="body" defaultValue={record.body} required rows={10} />
          </label>
          <label className="text-sm space-y-1.5 block">
            <span className="font-medium">Change note</span>
            <Input name="changeNote" placeholder="What changed and why?" />
          </label>
          {requiresApprovedEditReason && (
            <label className="text-sm space-y-1.5 block">
              <span className="font-medium text-yellow-500">Reason for editing approved record</span>
              <Input name="changeReason" required placeholder="Why does this approved method need to change?" className="border-yellow-500/30" />
            </label>
          )}
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" size="lg">Save new version</Button>
    </form>
  );
}
