import { createKnowledgeRecordAction } from '@/app/(app)/actions';
import { ExpertProfile, HandoverPack } from '@/lib/domain';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export function CaptureWorkbench({ expertProfiles, handoverPacks }: { expertProfiles: ExpertProfile[]; handoverPacks: HandoverPack[] }) {
  return (
    <form action={createKnowledgeRecordAction} className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Capture knowledge</CardTitle>
          <p className="text-sm text-muted-foreground">Create a new field record. This saves immediately and enters the review workflow.</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm space-y-1.5">
              <span className="font-medium">Title</span>
              <Input name="title" required placeholder="Clear, specific record title" />
            </label>
            <label className="text-sm space-y-1.5">
              <span className="font-medium">Type</span>
              <select name="type" defaultValue="FIELD_NOTE" className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option value="FIELD_NOTE">Field Note</option>
                <option value="PROCEDURE">Procedure</option>
                <option value="FAILURE_PATTERN">Failure Pattern</option>
                <option value="LESSON_LEARNED">Lesson Learned</option>
              </select>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Context tags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <Input name="asset" required placeholder="Asset / machine" />
            <Input name="system" required placeholder="System / subsystem" />
            <Input name="task" required placeholder="Task" />
            <Input name="symptom" required placeholder="Symptom / fault" />
            <Input name="environment" required placeholder="Environment / site" className="md:col-span-2" />
            <Input name="tags" placeholder="Tags (comma separated)" className="md:col-span-2" />
            <label className="text-sm space-y-1.5 md:col-span-2">
              <span className="font-medium">Source expert (optional)</span>
              <select name="sourceExpertId" defaultValue="" className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option value="">None</option>
                {expertProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>{profile.name} ({profile.roleFocus})</option>
                ))}
              </select>
            </label>
            <label className="text-sm space-y-1.5 md:col-span-2">
              <span className="font-medium">Linked handover pack (optional)</span>
              <select name="handoverPackId" defaultValue="" className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option value="">None</option>
                {handoverPacks.map((pack) => (
                  <option key={pack.id} value={pack.id}>{pack.expertName} &rarr; {pack.targetRole} ({pack.status.replaceAll('_', ' ')})</option>
                ))}
              </select>
            </label>
            <label className="text-sm space-y-1.5 md:col-span-2">
              <span className="font-medium">Confidence</span>
              <select name="confidence" defaultValue="MEDIUM" className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </label>
            <label className="text-sm space-y-1.5 md:col-span-2">
              <span className="font-medium">Content / body</span>
              <Textarea name="body" required rows={8} placeholder="Describe the observation, method, pattern, or lesson in plain language." />
            </label>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" size="lg">Save record</Button>
    </form>
  );
}
