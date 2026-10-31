export interface ReviewQueueContext {
  latestReviewerRationale?: string;
  isResubmission: boolean;
  openCommentCount?: number;
  openCommentSections?: string[];
}

export function getReviewQueueLabel(context: ReviewQueueContext | undefined): 'Resubmission' | 'First-time review' {
  return context?.isResubmission ? 'Resubmission' : 'First-time review';
}
