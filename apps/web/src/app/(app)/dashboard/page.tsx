import Link from 'next/link';
import { ArrowRight, ClipboardCheck, FolderKanban, ShieldAlert, Sparkles, UserCog, Wrench } from 'lucide-react';
import { requireAnyRole } from '@/lib/authz';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/motion/fade-in';
import { getDashboardMetrics, getRiskHotspots, listExpertProfiles, listHandoverPacks, listKnowledgeRecords, listReviewQueue } from '@/lib/knowledge-service';
import { buildContinuityRiskRows } from '@/lib/continuity-risk';
import { formatDate } from '@/lib/utils';

const bstaQuickTiles = [
  { title: 'Lubrication Service', keyword: 'lubrication', type: 'PROCEDURE' },
  { title: 'Servo Feed Drift', keyword: 'servo feed', type: 'FIELD_NOTE' },
  { title: 'Bearing Clearances', keyword: 'clearance', type: 'PROCEDURE' },
  { title: 'Fault-Finding Walkthrough', keyword: 'fault-finding', type: 'PROCEDURE' }
];

export default async function DashboardPage() {
  await requireAnyRole(['TECHNICIAN', 'SENIOR_TECHNICIAN', 'SUPERVISOR', 'REVIEWER', 'ADMIN']);
  const [metrics, records, reviewQueue, hotspots, experts, handovers] = await Promise.all([
    getDashboardMetrics(),
    listKnowledgeRecords(),
    listReviewQueue(),
    getRiskHotspots(6),
    listExpertProfiles(),
    listHandoverPacks()
  ]);

  const continuityRows = buildContinuityRiskRows(experts, handovers, records).slice(0, 6);
  const recentActivity = records
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 5)
    .map((record) => ({
      id: record.id,
      title: record.title,
      status: record.approvalState,
      version: record.currentVersion,
      when: record.lastValidatedAt ?? record.createdAt
    }));

  const atRiskRecords = records.filter((record) => record.approvalState !== 'APPROVED').length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Operations Dashboard"
        description="Trusted field knowledge at your fingertips. Capture quickly, review safely, and keep continuity risk visible."
      />

      <FadeIn>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Reviews</CardDescription>
            <CardTitle className="text-3xl">{reviewQueue.length}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Badge variant="changes">{reviewQueue.length > 0 ? 'Action required' : 'Clear'}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>At-Risk Records</CardDescription>
            <CardTitle className="text-3xl">{atRiskRecords}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Badge variant="review">Needs review</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Experts</CardDescription>
            <CardTitle className="text-3xl">{experts.length}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Badge variant="approved">{metrics.atRiskExperts} high-risk</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Open Handovers</CardDescription>
            <CardTitle className="text-3xl">{metrics.openHandoverPacks}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Badge variant="outline">Transfer in progress</Badge>
          </CardContent>
        </Card>
      </section>
      </FadeIn>

      <FadeIn delay={0.04}>
      <section className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Wrench className="h-5 w-5 text-[#006B3F]" />
              BSTA Quick Reference
            </CardTitle>
            <CardDescription>Open the most-used technical references in one tap.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {bstaQuickTiles.map((tile) => (
              <Link
                key={tile.title}
                href={`/search?status=APPROVED&type=${tile.type}&keyword=${encodeURIComponent(tile.keyword)}`}
                className="touch-target rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-900 transition hover:border-[#006B3F] hover:bg-[#006B3F]/5"
              >
                <p>{tile.title}</p>
                <p className="mt-1 text-xs font-normal text-slate-500">Approved methods only</p>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <ShieldAlert className="h-5 w-5 text-[#0A2540]" />
              Continuity & Risk
            </CardTitle>
            <CardDescription>Expert-linked knowledge gaps and handover coverage.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {continuityRows.slice(0, 4).map((row) => (
              <div key={row.expertId} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">{row.expertName}</p>
                  <Badge variant={row.riskLevel === 'HIGH' ? 'changes' : row.riskLevel === 'MEDIUM' ? 'draft' : 'approved'}>{row.riskLevel}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-600">{row.flaggedReason}</p>
              </div>
            ))}
            <Link href="/continuity-risk" className="inline-flex items-center gap-1 text-sm font-semibold text-[#0A2540] hover:underline">
              Open full continuity view <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </section>
      </FadeIn>

      <FadeIn delay={0.08}>
      <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-[#006B3F]" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentActivity.map((event) => (
              <Link key={event.id} href={`/knowledge-records/${event.id}`} className="block rounded-lg border border-slate-200 p-3 transition hover:bg-slate-50">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-slate-900">{event.title}</p>
                  <Badge variant={event.status === 'APPROVED' ? 'approved' : event.status === 'UNDER_REVIEW' ? 'review' : 'draft'}>{event.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-600">Version {event.version} • {formatDate(event.when)}</p>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Risk Hotspots</CardTitle>
            <CardDescription>Operational areas with low approved coverage.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {hotspots.slice(0, 5).map((hotspot) => (
              <div key={hotspot.key} className="rounded-lg border border-slate-200 p-3">
                <p className="font-semibold text-slate-900">{hotspot.asset}</p>
                <p className="text-sm text-slate-600">{hotspot.task}</p>
                <p className="mt-1 text-xs text-slate-500">Risk score {hotspot.riskScore} • {hotspot.reason}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
      </FadeIn>

      <div className="fixed bottom-20 right-4 z-30 lg:bottom-6">
        <Button asChild size="lg" className="rounded-full shadow-lg">
          <Link href="/capture-knowledge">
            <ClipboardCheck className="h-5 w-5" />
            Start New Record
          </Link>
        </Button>
      </div>

      <div className="fixed bottom-20 left-4 z-30 lg:bottom-6 lg:left-auto lg:right-[13.5rem]">
        <Button asChild size="lg" variant="industrial" className="rounded-full shadow-lg">
          <Link href="/review-queue">
            <UserCog className="h-5 w-5" />
            Review Queue
          </Link>
        </Button>
      </div>
    </div>
  );
}
