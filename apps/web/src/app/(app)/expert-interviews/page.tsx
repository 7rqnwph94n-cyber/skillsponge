import { PageHeader } from '@/components/ui/page-header';
import { InterviewPanel } from '@/features/expert-interviews/components/interview-panel';
import { ExpertInterviewRecord } from '@/lib/domain';
import { listKnowledgeRecords } from '@/lib/knowledge-service';
import { requireAnyRole } from '@/lib/authz';

export default async function ExpertInterviewsPage() {
  await requireAnyRole(['SENIOR_TECHNICIAN', 'SUPERVISOR', 'REVIEWER', 'ADMIN']);
  const records = (await listKnowledgeRecords({ type: 'EXPERT_INTERVIEW' })).filter(
    (item): item is ExpertInterviewRecord => item.type === 'EXPERT_INTERVIEW'
  );

  return (
    <div>
      <PageHeader title="Expert Interviews" description="Capture and review tacit expert reasoning with structured prompts." />
      <InterviewPanel records={records} />
    </div>
  );
}
