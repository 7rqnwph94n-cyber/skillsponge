import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ContinuityRiskRow } from '@/lib/continuity-risk';
import { cn } from '@/lib/utils';

function riskBadgeVariant(level: ContinuityRiskRow['riskLevel']) {
  if (level === 'HIGH') return 'border-red-500/40 bg-red-500/10 text-red-400';
  if (level === 'MEDIUM') return 'border-yellow-500/40 bg-yellow-500/10 text-yellow-500';
  return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500';
}

export function ContinuityRiskBoard({ rows }: { rows: ContinuityRiskRow[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Knowledge continuity risk</CardTitle>
        <Button variant="link" size="sm" render={<Link href="/handover-packs" />} className="text-primary">
          Manage handover packs
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.map((row) => (
          <div key={row.expertId} className="rounded-md border p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{row.expertName}</p>
              <Badge variant="outline" className={cn('text-[10px] font-semibold uppercase', riskBadgeVariant(row.riskLevel))}>
                {row.riskLevel}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {row.flaggedReason} &middot; Linked records {row.linkedRecords} ({row.approvedLinkedRecords} approved)
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {row.handoverPackId ? `Pack ${row.handoverStatus} \u2022 Coverage ${row.coverageScore ?? 0}% \u2022 Target ${row.targetRole}` : 'No pack assigned'}
            </p>
          </div>
        ))}
        {!rows.length && <p className="text-sm text-muted-foreground">No expert risk profiles yet.</p>}
      </CardContent>
    </Card>
  );
}
