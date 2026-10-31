import Link from 'next/link';
import { requireAnyRole } from '@/lib/authz';
import { listAuditEvents, listKnowledgeRecords } from '@/lib/knowledge-service';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function AuditTrailPage() {
  await requireAnyRole(['SUPERVISOR', 'REVIEWER', 'ADMIN']);
  const records = await listKnowledgeRecords();
  const auditByRecord = await Promise.all(records.slice(0, 20).map(async (record) => ({ record, events: await listAuditEvents(record.id) })));
  const allEvents = auditByRecord
    .flatMap((item) => item.events.map((event) => ({ ...event, recordTitle: item.record.title })))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  return (
    <div className="space-y-4">
      <PageHeader title="Global Audit Trail" description="Immutable chronology of actions across governed records." />
      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {allEvents.slice(0, 100).map((event) => (
            <div key={event.id} className="rounded-lg border border-slate-200 p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <Link href={`/knowledge-records/${event.recordId}`} className="font-semibold text-slate-900 hover:text-[#006B3F]">
                  {event.recordTitle}
                </Link>
                <Badge variant="outline">{event.eventType.replaceAll('_', ' ')}</Badge>
              </div>
              <p className="text-slate-600">
                {event.actorName}
                {event.actorRole ? ` (${event.actorRole.replace('_', ' ')})` : ''}
                {' • '}
                {new Date(event.createdAt).toLocaleString('en-GB')}
              </p>
              {(event.fromStatus || event.toStatus) && <p className="text-slate-500">{event.fromStatus ?? 'Unknown'} {'->'} {event.toStatus ?? 'Unknown'}</p>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
