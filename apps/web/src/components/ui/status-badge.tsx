import { ApprovalState } from '@/lib/domain';
import { Badge } from '@/components/ui/badge';

function stateToVariant(state: ApprovalState): 'draft' | 'review' | 'approved' | 'changes' {
  if (state === 'APPROVED') return 'approved';
  if (state === 'UNDER_REVIEW') return 'review';
  if (state === 'DRAFT') return 'draft';
  return 'changes';
}

export function StatusBadge({ state }: { state: ApprovalState }) {
  return <Badge variant={stateToVariant(state)}>{state.replace('_', ' ')}</Badge>;
}
