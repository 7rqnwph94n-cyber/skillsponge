import type { JobLog, JobLogEntry, JobLogPhoto, JobLogAuditEvent, JobLogChecklist, JobLogChecklistItem, JobLogQuery, JobLogQRPayload } from './job-log-domain';
import type {
  AddJobLogEntryInput,
  AddJobLogPhotoInput,
  AuditActorInput,
  CreateJobLogInput,
  JobLogRepository,
  ReviewJobLogInput
} from './job-log-repository';
import { canTransitionJobLogStatus } from './job-log-repository';
import { PrismaJobLogRepository } from './prisma-job-log-repository';
import { createHash } from 'node:crypto';

function requireNonEmpty(value: string | undefined | null, fieldName: string): string {
  const trimmed = (value ?? '').trim();
  if (!trimmed) throw new Error(`${fieldName} is required.`);
  return trimmed;
}

let defaultRepository: JobLogRepository | undefined;

function getDefaultRepository(): JobLogRepository {
  if (!defaultRepository) {
    defaultRepository = new PrismaJobLogRepository();
  }
  return defaultRepository;
}

export function createJobLogService(repository?: JobLogRepository) {
  const repo = repository ?? getDefaultRepository();

  return {
    async listJobLogs(query?: JobLogQuery): Promise<JobLog[]> {
      return repo.list(query);
    },

    async getJobLogById(id: string): Promise<JobLog | undefined> {
      return repo.getById(id);
    },

    async createJobLog(input: CreateJobLogInput, actor: AuditActorInput): Promise<JobLog> {
      requireNonEmpty(input.customerName, 'Customer name');
      requireNonEmpty(input.siteName, 'Site name');
      requireNonEmpty(input.siteContactName, 'Site contact name');
      requireNonEmpty(input.asset, 'Asset');
      requireNonEmpty(input.technicianId, 'Technician ID');
      requireNonEmpty(input.technicianName, 'Technician name');
      return repo.create(input, actor);
    },

    async addEntry(input: AddJobLogEntryInput, actor: AuditActorInput): Promise<JobLogEntry> {
      requireNonEmpty(input.content, 'Entry content');
      requireNonEmpty(input.jobLogId, 'Job log ID');

      const jobLog = await repo.getById(input.jobLogId);
      if (!jobLog) throw new Error('Job log not found.');
      if (jobLog.status !== 'OPEN' && jobLog.status !== 'IN_PROGRESS') {
        throw new Error('Cannot add entries to a job log that is not open or in progress.');
      }

      return repo.addEntry(input, actor);
    },

    async addPhoto(input: AddJobLogPhotoInput, actor: AuditActorInput): Promise<JobLogPhoto> {
      requireNonEmpty(input.jobLogId, 'Job log ID');
      const jobLog = await repo.getById(input.jobLogId);
      if (!jobLog) throw new Error('Job log not found.');
      if (jobLog.status !== 'OPEN' && jobLog.status !== 'IN_PROGRESS') {
        throw new Error('Cannot add photos to a job log that is not open or in progress.');
      }
      return repo.addPhoto(input, actor);
    },

    async submitForReview(jobLogId: string, actor: AuditActorInput): Promise<JobLog | undefined> {
      const jobLog = await repo.getById(jobLogId);
      if (!jobLog) throw new Error('Job log not found.');
      if (!canTransitionJobLogStatus(jobLog.status, 'SUBMITTED')) {
        throw new Error(`Cannot submit a job log with status ${jobLog.status}.`);
      }
      if (jobLog.entries.length === 0) {
        throw new Error('Cannot submit a job log with no entries.');
      }
      return repo.updateStatus(jobLogId, 'SUBMITTED', actor);
    },

    async applyReview(input: ReviewJobLogInput): Promise<JobLog | undefined> {
      requireNonEmpty(input.reviewerName, 'Reviewer name');
      return repo.applyReview(input);
    },

    async closeJobLog(jobLogId: string, actor: AuditActorInput): Promise<JobLog | undefined> {
      const jobLog = await repo.getById(jobLogId);
      if (!jobLog) throw new Error('Job log not found.');
      if (!canTransitionJobLogStatus(jobLog.status, 'CLOSED')) {
        throw new Error(`Cannot close a job log with status ${jobLog.status}.`);
      }
      return repo.updateStatus(jobLogId, 'CLOSED', actor);
    },

    async verifyIntegrity(id: string): Promise<boolean> {
      const jobLog = await repo.getById(id);
      if (!jobLog) return false;
      const payload = JSON.stringify({
        customerName: jobLog.customerName,
        siteName: jobLog.siteName,
        asset: jobLog.asset,
        technicianId: jobLog.technicianId,
        createdAt: jobLog.createdAt
      });
      const recomputed = createHash('sha256').update(payload).digest('hex');
      return recomputed === jobLog.codeHash;
    },

    async getQRPayload(id: string, baseUrl: string): Promise<JobLogQRPayload | undefined> {
      const jobLog = await repo.getById(id);
      if (!jobLog) return undefined;
      return {
        url: `${baseUrl}/job-logs/${id}`,
        hash: jobLog.codeHash,
        ref: jobLog.jobReference
      };
    },

    async listAuditEvents(jobLogId: string): Promise<JobLogAuditEvent[]> {
      return repo.listAuditEvents(jobLogId);
    },

    async deletePhoto(photoId: string): Promise<void> {
      return repo.deletePhoto(photoId);
    },

    async importProcedure(jobLogId: string, procedureId: string, procedureTitle: string, steps: string[], actor: AuditActorInput): Promise<JobLogChecklist> {
      requireNonEmpty(jobLogId, 'Job log ID');
      requireNonEmpty(procedureId, 'Procedure ID');
      if (!steps.length) throw new Error('Procedure has no steps to import.');

      const jobLog = await repo.getById(jobLogId);
      if (!jobLog) throw new Error('Job log not found.');
      if (jobLog.status !== 'OPEN' && jobLog.status !== 'IN_PROGRESS') {
        throw new Error('Cannot import procedures to a job log that is not open or in progress.');
      }

      // Prevent importing the same procedure twice
      if (jobLog.checklists.some((c) => c.procedureId === procedureId)) {
        throw new Error('This procedure has already been imported to this job log.');
      }

      return repo.importProcedure(jobLogId, procedureId, procedureTitle, steps, actor);
    },

    async toggleChecklistItem(itemId: string, checked: boolean, checkedBy: string): Promise<JobLogChecklistItem> {
      requireNonEmpty(itemId, 'Checklist item ID');
      requireNonEmpty(checkedBy, 'Checked by');
      return repo.toggleChecklistItem(itemId, checked, checkedBy);
    }
  };
}

// Default service singleton
let defaultService: ReturnType<typeof createJobLogService> | undefined;

function getDefaultService() {
  if (!defaultService) {
    defaultService = createJobLogService();
  }
  return defaultService;
}

// Convenience exports
export const listJobLogs = (query?: JobLogQuery) => getDefaultService().listJobLogs(query);
export const getJobLogById = (id: string) => getDefaultService().getJobLogById(id);
export const createJobLog = (input: CreateJobLogInput, actor: AuditActorInput) => getDefaultService().createJobLog(input, actor);
export const addJobLogEntry = (input: AddJobLogEntryInput, actor: AuditActorInput) => getDefaultService().addEntry(input, actor);
export const addJobLogPhoto = (input: AddJobLogPhotoInput, actor: AuditActorInput) => getDefaultService().addPhoto(input, actor);
export const submitJobLogForReview = (jobLogId: string, actor: AuditActorInput) => getDefaultService().submitForReview(jobLogId, actor);
export const applyJobLogReview = (input: ReviewJobLogInput) => getDefaultService().applyReview(input);
export const closeJobLog = (jobLogId: string, actor: AuditActorInput) => getDefaultService().closeJobLog(jobLogId, actor);
export const verifyJobLogIntegrity = (id: string) => getDefaultService().verifyIntegrity(id);
export const getJobLogQRPayload = (id: string, baseUrl: string) => getDefaultService().getQRPayload(id, baseUrl);
export const listJobLogAuditEvents = (jobLogId: string) => getDefaultService().listAuditEvents(jobLogId);
export const deleteJobLogPhoto = (photoId: string) => getDefaultService().deletePhoto(photoId);
export const importProcedureToJobLog = (jobLogId: string, procedureId: string, procedureTitle: string, steps: string[], actor: AuditActorInput) => getDefaultService().importProcedure(jobLogId, procedureId, procedureTitle, steps, actor);
export const toggleJobLogChecklistItem = (itemId: string, checked: boolean, checkedBy: string) => getDefaultService().toggleChecklistItem(itemId, checked, checkedBy);
