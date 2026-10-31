import Link from 'next/link';
import { requireAnyRole } from '@/lib/authz';
import { listExpertProfiles, listKnowledgeRecords } from '@/lib/knowledge-service';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default async function ExpertsPage() {
  await requireAnyRole(['SENIOR_TECHNICIAN', 'SUPERVISOR', 'REVIEWER', 'ADMIN']);
  const [experts, records] = await Promise.all([listExpertProfiles(), listKnowledgeRecords()]);

  return (
    <div className="space-y-4">
      <PageHeader title="Experts" description="Locate domain experts and see linked governed knowledge records." />
      <Card>
        <CardContent className="pt-5">
          <Input placeholder="Search experts by name, domain, or asset..." disabled />
          <p className="mt-2 text-xs text-slate-500">Search input is UI-ready; full fuzzy search can be wired with server filtering next.</p>
        </CardContent>
      </Card>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {experts.map((expert) => {
          const linked = records.filter((record) => record.sourceExpertId === expert.id);
          return (
            <Card key={expert.id}>
              <CardHeader>
                <CardTitle>{expert.name}</CardTitle>
                <CardDescription>{expert.roleFocus}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><span className="font-semibold text-slate-900">Experience:</span> {expert.yearsExperience} years</p>
                <p><span className="font-semibold text-slate-900">Assets:</span> {expert.assets.join(', ') || 'None listed'}</p>
                <div className="flex items-center gap-2">
                  <Badge variant={expert.riskLevel === 'HIGH' ? 'changes' : expert.riskLevel === 'MEDIUM' ? 'draft' : 'approved'}>
                    {expert.riskLevel} risk
                  </Badge>
                  <Badge variant="outline">{linked.length} linked records</Badge>
                </div>
                {linked.slice(0, 3).map((record) => (
                  <Link key={record.id} href={`/knowledge-records/${record.id}`} className="block rounded-md border border-slate-200 p-2 text-slate-700 hover:bg-slate-50">
                    {record.title}
                  </Link>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
