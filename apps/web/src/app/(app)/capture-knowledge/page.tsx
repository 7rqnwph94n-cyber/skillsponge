import { PageHeader } from '@/components/ui/page-header';
import { CaptureWorkbench } from '@/features/capture/components/capture-workbench';
import { requireAnyRole } from '@/lib/authz';
import { listExpertProfiles, listHandoverPacks } from '@/lib/knowledge-service';

export default async function CaptureKnowledgePage() {
  await requireAnyRole(['TECHNICIAN', 'SENIOR_TECHNICIAN', 'SUPERVISOR']);
  const [expertProfiles, handoverPacks] = await Promise.all([listExpertProfiles(), listHandoverPacks()]);
  return (
    <div>
      <PageHeader title="Capture Knowledge" description="Record what you found with clear context and submit it into review." />
      <CaptureWorkbench expertProfiles={expertProfiles} handoverPacks={handoverPacks} />
    </div>
  );
}
