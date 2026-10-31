import { requireAnyRole } from '@/lib/authz';
import { buildContinuityRiskRows } from '@/lib/continuity-risk';
import { getRiskHotspots, listExpertProfiles, listHandoverPacks, listKnowledgeRecords } from '@/lib/knowledge-service';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function ContinuityRiskPage() {
  await requireAnyRole(['SUPERVISOR', 'REVIEWER', 'ADMIN']);
  const [records, experts, handovers, hotspots] = await Promise.all([
    listKnowledgeRecords(),
    listExpertProfiles(),
    listHandoverPacks(),
    getRiskHotspots(12)
  ]);

  const continuity = buildContinuityRiskRows(experts, handovers, records);

  return (
    <div className="space-y-4">
      <PageHeader title="Continuity & Risk Views" description="Single-pane oversight for knowledge concentration, handover coverage, and operational hotspots." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Expert Continuity Risk</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {continuity.map((row) => (
              <div key={row.expertId} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">{row.expertName}</p>
                  <Badge variant={row.riskLevel === 'HIGH' ? 'changes' : row.riskLevel === 'MEDIUM' ? 'draft' : 'approved'}>{row.riskLevel}</Badge>
                </div>
                <p className="text-sm text-slate-600">{row.flaggedReason}</p>
                <p className="text-xs text-slate-500">Linked records {row.linkedRecords} • Approved {row.approvedLinkedRecords}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Operational Hotspots</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {hotspots.map((row) => (
              <div key={row.key} className="rounded-lg border border-slate-200 p-3">
                <p className="font-semibold text-slate-900">{row.asset}</p>
                <p className="text-sm text-slate-600">{row.task}</p>
                <p className="text-xs text-slate-500">Risk score {row.riskScore} • {row.reason}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
