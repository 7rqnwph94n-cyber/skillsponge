import { PageHeader } from '@/components/ui/page-header';
import { HandoverPackBoard } from '@/features/handover-packs/components/handover-pack-board';
import { requireAnyRole } from '@/lib/authz';
import { listExpertProfiles, listHandoverPacks } from '@/lib/knowledge-service';

interface HandoverPacksPageProps {
  searchParams?: Promise<{ updated?: string }>;
}

export default async function HandoverPacksPage({ searchParams }: HandoverPacksPageProps) {
  await requireAnyRole(['SENIOR_TECHNICIAN', 'SUPERVISOR', 'REVIEWER', 'ADMIN']);
  const [expertProfiles, handoverPacks] = await Promise.all([listExpertProfiles(), listHandoverPacks()]);
  const resolvedSearchParams = await searchParams;

  return (
    <div className="space-y-4">
      {resolvedSearchParams?.updated === '1' && (
        <div className="panel border-emerald-700 bg-emerald-900/20 p-3 text-sm text-emerald-300">
          Handover planning update saved.
        </div>
      )}
      <PageHeader title="Retirement Handover Packs" description="Track critical knowledge transfer from high-risk experts to successor roles." />
      <HandoverPackBoard expertProfiles={expertProfiles} handoverPacks={handoverPacks} />
    </div>
  );
}
