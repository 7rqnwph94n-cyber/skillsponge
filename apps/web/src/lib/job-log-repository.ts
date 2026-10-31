import type { JobLog, JobLogEntry, JobLogPhoto, JobLogAuditEvent, JobLogChecklist, JobLogChecklistItem, JobLogQuery, JobLogStatus, JobLogEntryType } from './job-log-domain';
import type { UserRole } from './domain';

export interface CreateJobLogInput {
  customerName: string;
  siteName: string;
  siteAddress?: string;
  siteContactName: string;
  siteContactPhone?: string;
  siteContactEmail?: string;
  asset: string;
  assetSerial?: string;
  assetLocation?: string;
  technicianId: string;
  technicianName: string;
}

export interface AddJobLogEntryInput {
  jobLogId: string;
  entryType: JobLogEntryType;
  content: string;
  isVoiceInput?: boolean;
  authorName: string;
}

export interface AddJobLogPhotoInput {
  jobLogId: string;
  storageKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  caption?: string;
  uploadedBy: string;
}

export interface ReviewJobLogInput {
  jobLogId: string;
  reviewerName: string;
  reviewNotes?: string;
  decision: 'APPROVE' | 'REQUEST_CHANGES';
  actorUserId?: string;
  actorRole?: UserRole;
}

export interface AuditActorInput {
  actorUserId?: string;
  actorName: string;
  actorRole?: UserRole;
}

export interface JobLogRepository {
  list(query?: JobLogQuery): Promise<JobLog[]>;
  getById(id: string): Promise<JobLog | undefined>;
  create(input: CreateJobLogInput, actor: AuditActorInput): Promise<JobLog>;
  addEntry(input: AddJobLogEntryInput, actor: AuditActorInput): Promise<JobLogEntry>;
  addPhoto(input: AddJobLogPhotoInput, actor: AuditActorInput): Promise<JobLogPhoto>;
  updateStatus(id: string, status: JobLogStatus, actor: AuditActorInput): Promise<JobLog | undefined>;
  applyReview(input: ReviewJobLogInput): Promise<JobLog | undefined>;
  getNextJobReference(): Promise<string>;
  listAuditEvents(jobLogId: string): Promise<JobLogAuditEvent[]>;
  deletePhoto(photoId: string): Promise<void>;
  importProcedure(jobLogId: string, procedureId: string, procedureTitle: string, steps: string[], actor: AuditActorInput): Promise<JobLogChecklist>;
  toggleChecklistItem(itemId: string, checked: boolean, checkedBy: string): Promise<JobLogChecklistItem>;
}

const jobLogTransitions: Record<JobLogStatus, JobLogStatus[]> = {
  OPEN: ['IN_PROGRESS'],
  IN_PROGRESS: ['SUBMITTED', 'OPEN'],
  SUBMITTED: ['REVIEWED', 'IN_PROGRESS'],
  REVIEWED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: []
};

export function canTransitionJobLogStatus(current: JobLogStatus, next: JobLogStatus): boolean {
  return jobLogTransitions[current].includes(next);
}
