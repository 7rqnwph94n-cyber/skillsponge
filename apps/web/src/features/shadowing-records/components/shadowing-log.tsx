import Link from 'next/link';
import { ShadowingRecord } from '@/lib/domain';
import { StatusBadge } from '@/components/ui/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ShadowingLog({ records }: { records: ShadowingRecord[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Shadowing and mentoring records</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {records.map((record) => (
          <div key={record.id} className="rounded-md border p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link href={`/knowledge-records/${record.id}`} className="font-medium hover:text-primary transition-colors">
                  {record.title}
                </Link>
                <p className="text-sm text-muted-foreground">Senior: {record.seniorTechnician} &middot; Junior: {record.juniorTechnician}</p>
                <p className="mt-1 text-sm text-muted-foreground">Outcome: {record.sessionOutcome}</p>
              </div>
              <StatusBadge state={record.approvalState} />
            </div>
          </div>
        ))}
        {!records.length && <p className="text-sm text-muted-foreground">No shadowing records captured yet.</p>}
      </CardContent>
    </Card>
  );
}
