import Link from 'next/link';
import { StatusBadge } from '@/components/ui/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardMetrics, KnowledgeRecord } from '@/lib/domain';
import { FileText, CheckCircle, PenTool, Users, Eye, AlertTriangle, Package, Plus } from 'lucide-react';

const STAT_CARDS = [
  { key: 'totalRecords', label: 'Total records', icon: FileText },
  { key: 'approvedRecords', label: 'Approved', icon: CheckCircle },
  { key: 'draftRecords', label: 'Drafts', icon: PenTool },
  { key: 'expertInterviewsCaptured', label: 'Interviews', icon: Users },
  { key: 'shadowingRecordsCaptured', label: 'Shadowing', icon: Eye },
  { key: 'atRiskExperts', label: 'At-risk experts', icon: AlertTriangle },
  { key: 'openHandoverPacks', label: 'Open packs', icon: Package },
] as const;

export function DashboardOverview({
  metrics,
  recentRecords,
}: {
  metrics: DashboardMetrics;
  recentRecords: KnowledgeRecord[];
}) {
  return (
    <div className="space-y-4">
      {/* Metric cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map(({ key, label, icon: Icon }) => (
          <Card key={key}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold">{metrics[key]}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        <Card className="flex items-center justify-center">
          <CardContent className="p-4">
            <Button render={<Link href="/capture-knowledge" />}>
              <Plus className="mr-1.5 h-4 w-4" />
              Capture knowledge
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent knowledge activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentRecords.map((record) => (
            <div key={record.id} className="flex items-start justify-between gap-4 rounded-md border p-3">
              <div className="min-w-0">
                <Link href={`/knowledge-records/${record.id}`} className="font-medium hover:text-primary transition-colors">
                  {record.title}
                </Link>
                <p className="text-sm text-muted-foreground">{record.context.asset} &middot; {record.context.task}</p>
              </div>
              <StatusBadge state={record.approvalState} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
