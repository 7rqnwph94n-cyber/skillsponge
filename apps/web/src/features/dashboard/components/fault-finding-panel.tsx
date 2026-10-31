import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KnowledgeRecord } from '@/lib/domain';
import { AlertTriangle, ExternalLink, Search } from 'lucide-react';

export function FaultFindingPanel({ record }: { record: KnowledgeRecord | null }) {
  if (!record) return null;

  const steps = record.type === 'PROCEDURE' ? record.steps : [];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">BSTA fault-finding walkthrough</CardTitle>
        </div>
        <Button variant="outline" size="sm" render={<Link href={`/knowledge-records/${record.id}`} />}>
          Open full procedure
          <ExternalLink className="ml-1.5 h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Standard diagnostic sequence for every BSTA call-out. Start here.
        </p>

        {steps.length > 0 && (
          <ol className="mt-3 space-y-1.5">
            {steps.map((step, i) => {
              const shortStep = step.split(' - ')[0].split(' → ')[0];
              return (
                <li key={i} className="flex items-start gap-3 rounded-md border p-2.5">
                  <Badge variant="outline" className="mt-0.5 h-5 w-5 shrink-0 items-center justify-center rounded-full p-0 text-[10px] font-bold">
                    {i + 1}
                  </Badge>
                  <span className="text-sm">{shortStep}</span>
                </li>
              );
            })}
          </ol>
        )}

        <div className="mt-3 flex gap-2">
          <Button variant="secondary" size="sm" render={<Link href="/search?keyword=fault-finding" />}>
            <Search className="mr-1.5 h-3 w-3" />
            Related records
          </Button>
          <Button variant="secondary" size="sm" render={<Link href="/search?status=APPROVED&keyword=BSTA" />}>
            All approved BSTA methods
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
