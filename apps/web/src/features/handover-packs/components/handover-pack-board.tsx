import {
  createExpertProfileAction,
  createHandoverPackAction,
  updateHandoverTaskStatusAction,
} from '@/app/(app)/actions';
import { ExpertProfile, HandoverPack } from '@/lib/domain';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function HandoverPackBoard({
  expertProfiles,
  handoverPacks,
}: {
  expertProfiles: ExpertProfile[];
  handoverPacks: HandoverPack[];
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Add Expert Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createExpertProfileAction} className="space-y-2">
              <Input name="name" required placeholder="Expert name" />
              <Input name="roleFocus" required placeholder="Role focus" />
              <Input name="domains" placeholder="Domains (comma separated)" />
              <Input name="assets" placeholder="Assets (comma separated)" />
              <div className="grid gap-2 sm:grid-cols-3">
                <Input name="yearsExperience" type="number" min={0} placeholder="Years" />
                <select name="riskLevel" defaultValue="MEDIUM" className="rounded-md border bg-background px-3 py-2 text-sm">
                  <option value="LOW">Low risk</option>
                  <option value="MEDIUM">Medium risk</option>
                  <option value="HIGH">High risk</option>
                </select>
                <Input name="retirementWindowEnd" type="date" />
              </div>
              <Textarea name="notes" rows={2} placeholder="Notes" />
              <Button type="submit">Create profile</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Create Handover Pack</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createHandoverPackAction} className="space-y-2">
              <select name="expertProfileId" required className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option value="">Select expert profile</option>
                {expertProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>{profile.name} ({profile.riskLevel})</option>
                ))}
              </select>
              <Input name="targetRole" required placeholder="Target role" />
              <Input name="targetDate" type="date" />
              <Textarea name="taskTitles" rows={3} placeholder="Task titles (comma separated)" />
              <Button type="submit">Create handover pack</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Handover Packs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {handoverPacks.map((pack) => (
            <div key={pack.id} className="rounded-md border p-4">
              <p className="font-medium">{pack.expertName} &rarr; {pack.targetRole}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Status: {pack.status.replaceAll('_', ' ')} &middot; Coverage: {pack.coverageScore}% &middot; Validated tasks: {pack.validatedCount}
              </p>
              <div className="mt-3 space-y-2">
                {pack.tasks.map((task) => (
                  <div key={task.id} className="rounded-md border bg-muted/30 p-3">
                    <p className="text-sm font-medium">{task.title}</p>
                    <form action={updateHandoverTaskStatusAction} className="mt-2 flex flex-wrap items-center gap-2">
                      <input type="hidden" name="handoverPackId" value={pack.id} />
                      <input type="hidden" name="taskId" value={task.id} />
                      <Input name="assigneeName" defaultValue={task.assigneeName} placeholder="Assignee" className="w-32 text-xs" />
                      <select name="status" defaultValue={task.status} className="rounded-md border bg-background px-2 py-1.5 text-xs">
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In progress</option>
                        <option value="DONE">Done</option>
                      </select>
                      <Button variant="outline" size="sm" type="submit">Update</Button>
                    </form>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {!handoverPacks.length && <p className="text-sm text-muted-foreground">No handover packs yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
