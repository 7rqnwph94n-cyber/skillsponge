export type JobLogStatus = 'OPEN' | 'IN_PROGRESS' | 'SUBMITTED' | 'REVIEWED' | 'CLOSED';
export type JobLogEntryType = 'NOTE' | 'VOICE_TRANSCRIPTION' | 'OBSERVATION' | 'ACTION_TAKEN' | 'ISSUE_FOUND';

export interface JobLog {
  id: string;
  codeHash: string;
  jobReference: string;
  status: JobLogStatus;
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
  startedAt: string;
  completedAt?: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewerName?: string;
  reviewNotes?: string;
  entries: JobLogEntry[];
  photos: JobLogPhoto[];
  checklists: JobLogChecklist[];
  createdAt: string;
  updatedAt: string;
}

export interface JobLogEntry {
  id: string;
  jobLogId: string;
  entryType: JobLogEntryType;
  content: string;
  isVoiceInput: boolean;
  authorName: string;
  createdAt: string;
}

export interface JobLogPhoto {
  id: string;
  jobLogId: string;
  storageKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  caption?: string;
  uploadedBy: string;
  createdAt: string;
}

export interface JobLogAuditEvent {
  id: string;
  jobLogId: string;
  actorName: string;
  actorRole?: string;
  eventType: string;
  fromStatus?: JobLogStatus;
  toStatus?: JobLogStatus;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface JobLogQuery {
  status?: JobLogStatus;
  asset?: string;
  customerName?: string;
  technicianId?: string;
  keyword?: string;
}

export interface JobLogChecklist {
  id: string;
  jobLogId: string;
  procedureId: string;
  procedureTitle: string;
  createdAt: string;
  items: JobLogChecklistItem[];
}

export interface JobLogChecklistItem {
  id: string;
  checklistId: string;
  stepIndex: number;
  content: string;
  checked: boolean;
  checkedAt?: string;
  checkedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobLogQRPayload {
  url: string;
  hash: string;
  ref: string;
}
