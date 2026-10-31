import { listKnowledgeRecords } from '@/lib/knowledge-service';
import { requireAnyRole } from '@/lib/authz';
import { PageHeader } from '@/components/ui/page-header';
import { ProcedureBrowser } from './procedure-browser';

export default async function ProceduresPage() {
  await requireAnyRole(['TECHNICIAN', 'SENIOR_TECHNICIAN', 'SUPERVISOR', 'REVIEWER', 'ADMIN']);

  const allRecords = await listKnowledgeRecords({ type: 'PROCEDURE', status: 'APPROVED' });
  const procedures = allRecords.filter((r) => r.type === 'PROCEDURE');

  const generic = procedures.filter((r) => r.scope === 'GENERIC');
  const modelSpecific = procedures.filter((r) => r.scope === 'MODEL_SPECIFIC');
  const variantSpecific = procedures.filter((r) => r.scope === 'VARIANT_SPECIFIC');
  const unscoped = procedures.filter((r) => !r.scope);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bruderer Procedures"
        description="Approved technical procedures organised by scope: generic (all models), model-specific, and variant-specific."
      />
      <ProcedureBrowser
        generic={generic}
        modelSpecific={modelSpecific}
        variantSpecific={variantSpecific}
        unscoped={unscoped}
      />
    </div>
  );
}
