import { PrismaClient, Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';
import { getPrismaClient } from './prisma';
import type { JobLog, JobLogEntry, JobLogPhoto, JobLogAuditEvent, JobLogChecklist, JobLogChecklistItem, JobLogQuery, JobLogStatus } from './job-log-domain';
import type {
  AuditActorInput,
  AddJobLogEntryInput,
  AddJobLogPhotoInput,
  CreateJobLogInput,
  JobLogRepository,
  ReviewJobLogInput
} from './job-log-repository';

const JOB_LOG_INCLUDE = {
  entries: { orderBy: { createdAt: 'asc' as const } },
  photos: { orderBy: { createdAt: 'desc' as const } },
  checklists: {
    orderBy: { createdAt: 'asc' as const },
    include: { items: { orderBy: { stepIndex: 'asc' as const } } }
  }
} as const;

function formatDate(date: Date | null | undefined): string | undefined {
  if (!date) return undefined;
  return date.toISOString();
}

function mapJobLog(row: any): JobLog {
  return {
    id: row.id,
    codeHash: row.codeHash,
    jobReference: row.jobReference,
    status: row.status as JobLogStatus,
    customerName: row.customerName,
    siteName: row.siteName,
    siteAddress: row.siteAddress ?? undefined,
    siteContactName: row.siteContactName,
    siteContactPhone: row.siteContactPhone ?? undefined,
    siteContactEmail: row.siteContactEmail ?? undefined,
    asset: row.asset,
    assetSerial: row.assetSerial ?? undefined,
    assetLocation: row.assetLocation ?? undefined,
    technicianId: row.technicianId,
    technicianName: row.technicianName,
    startedAt: row.startedAt.toISOString(),
    completedAt: formatDate(row.completedAt),
    submittedAt: formatDate(row.submittedAt),
    reviewedAt: formatDate(row.reviewedAt),
    reviewerName: row.reviewerName ?? undefined,
    reviewNotes: row.reviewNotes ?? undefined,
    entries: (row.entries ?? []).map(mapEntry),
    photos: (row.photos ?? []).map(mapPhoto),
    checklists: (row.checklists ?? []).map(mapChecklist),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function mapEntry(row: any): JobLogEntry {
  return {
    id: row.id,
    jobLogId: row.jobLogId,
    entryType: row.entryType,
    content: row.content,
    isVoiceInput: row.isVoiceInput,
    authorName: row.authorName,
    createdAt: row.createdAt.toISOString()
  };
}

function mapPhoto(row: any): JobLogPhoto {
  return {
    id: row.id,
    jobLogId: row.jobLogId,
    storageKey: row.storageKey,
    fileName: row.fileName,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    caption: row.caption ?? undefined,
    uploadedBy: row.uploadedBy,
    createdAt: row.createdAt.toISOString()
  };
}

function mapChecklistItem(row: any): JobLogChecklistItem {
  return {
    id: row.id,
    checklistId: row.checklistId,
    stepIndex: row.stepIndex,
    content: row.content,
    checked: row.checked,
    checkedAt: formatDate(row.checkedAt),
    checkedBy: row.checkedBy ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function mapChecklist(row: any): JobLogChecklist {
  return {
    id: row.id,
    jobLogId: row.jobLogId,
    procedureId: row.procedureId,
    procedureTitle: row.procedureTitle,
    createdAt: row.createdAt.toISOString(),
    items: (row.items ?? []).map(mapChecklistItem)
  };
}

function mapAuditEvent(row: any): JobLogAuditEvent {
  return {
    id: row.id,
    jobLogId: row.jobLogId,
    actorName: row.actorName,
    actorRole: row.actorRole ?? undefined,
    eventType: row.eventType,
    fromStatus: row.fromStatus ?? undefined,
    toStatus: row.toStatus ?? undefined,
    metadata: row.metadata as Record<string, unknown> | undefined,
    createdAt: row.createdAt.toISOString()
  };
}

function computeHash(input: CreateJobLogInput, timestamp: string): string {
  const payload = JSON.stringify({
    customerName: input.customerName,
    siteName: input.siteName,
    asset: input.asset,
    technicianId: input.technicianId,
    createdAt: timestamp
  });
  return createHash('sha256').update(payload).digest('hex');
}

function buildWhere(query?: JobLogQuery): Prisma.JobLogWhereInput {
  const where: Prisma.JobLogWhereInput = {};
  if (!query) return where;
  if (query.status) where.status = query.status;
  if (query.asset) where.asset = query.asset;
  if (query.customerName) where.customerName = { contains: query.customerName, mode: 'insensitive' };
  if (query.technicianId) where.technicianId = query.technicianId;
  if (query.keyword) {
    where.OR = [
      { customerName: { contains: query.keyword, mode: 'insensitive' } },
      { siteName: { contains: query.keyword, mode: 'insensitive' } },
      { asset: { contains: query.keyword, mode: 'insensitive' } },
      { jobReference: { contains: query.keyword, mode: 'insensitive' } },
      { technicianName: { contains: query.keyword, mode: 'insensitive' } }
    ];
  }
  return where;
}

export class PrismaJobLogRepository implements JobLogRepository {
  private db: PrismaClient;

  constructor(db?: PrismaClient) {
    this.db = db ?? getPrismaClient();
  }

  async list(query?: JobLogQuery): Promise<JobLog[]> {
    const rows = await this.db.jobLog.findMany({
      where: buildWhere(query),
      include: JOB_LOG_INCLUDE,
      orderBy: { createdAt: 'desc' }
    });
    return rows.map(mapJobLog);
  }

  async getById(id: string): Promise<JobLog | undefined> {
    const row = await this.db.jobLog.findUnique({
      where: { id },
      include: JOB_LOG_INCLUDE
    });
    return row ? mapJobLog(row) : undefined;
  }

  async create(input: CreateJobLogInput, actor: AuditActorInput): Promise<JobLog> {
    const now = new Date();
    const hash = computeHash(input, now.toISOString());
    const ref = await this.getNextJobReference();

    const row = await this.db.$transaction(async (tx) => {
      const jobLog = await tx.jobLog.create({
        data: {
          codeHash: hash,
          jobReference: ref,
          customerName: input.customerName,
          siteName: input.siteName,
          siteAddress: input.siteAddress,
          siteContactName: input.siteContactName,
          siteContactPhone: input.siteContactPhone,
          siteContactEmail: input.siteContactEmail,
          asset: input.asset,
          assetSerial: input.assetSerial,
          assetLocation: input.assetLocation,
          technicianId: input.technicianId,
          technicianName: input.technicianName,
          startedAt: now,
          createdAt: now
        },
        include: JOB_LOG_INCLUDE
      });

      await tx.jobLogAuditEvent.create({
        data: {
          jobLogId: jobLog.id,
          actorUserId: actor.actorUserId,
          actorName: actor.actorName,
          actorRole: actor.actorRole,
          eventType: 'JOB_CREATED',
          toStatus: 'OPEN'
        }
      });

      return jobLog;
    });

    return mapJobLog(row);
  }

  async addEntry(input: AddJobLogEntryInput, actor: AuditActorInput): Promise<JobLogEntry> {
    const row = await this.db.$transaction(async (tx) => {
      const entry = await tx.jobLogEntry.create({
        data: {
          jobLogId: input.jobLogId,
          entryType: input.entryType,
          content: input.content,
          isVoiceInput: input.isVoiceInput ?? false,
          authorName: input.authorName
        }
      });

      // Auto-transition OPEN → IN_PROGRESS on first entry
      const jobLog = await tx.jobLog.findUniqueOrThrow({ where: { id: input.jobLogId } });
      if (jobLog.status === 'OPEN') {
        await tx.jobLog.update({ where: { id: input.jobLogId }, data: { status: 'IN_PROGRESS' } });
        await tx.jobLogAuditEvent.create({
          data: {
            jobLogId: input.jobLogId,
            actorUserId: actor.actorUserId,
            actorName: actor.actorName,
            actorRole: actor.actorRole,
            eventType: 'STATUS_CHANGED',
            fromStatus: 'OPEN',
            toStatus: 'IN_PROGRESS'
          }
        });
      }

      await tx.jobLogAuditEvent.create({
        data: {
          jobLogId: input.jobLogId,
          actorUserId: actor.actorUserId,
          actorName: actor.actorName,
          actorRole: actor.actorRole,
          eventType: 'ENTRY_ADDED',
          metadata: { entryType: input.entryType, entryId: entry.id }
        }
      });

      return entry;
    });

    return mapEntry(row);
  }

  async addPhoto(input: AddJobLogPhotoInput, actor: AuditActorInput): Promise<JobLogPhoto> {
    const row = await this.db.$transaction(async (tx) => {
      const photo = await tx.jobLogPhoto.create({
        data: {
          jobLogId: input.jobLogId,
          storageKey: input.storageKey,
          fileName: input.fileName,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
          caption: input.caption,
          uploadedBy: input.uploadedBy
        }
      });

      await tx.jobLogAuditEvent.create({
        data: {
          jobLogId: input.jobLogId,
          actorUserId: actor.actorUserId,
          actorName: actor.actorName,
          actorRole: actor.actorRole,
          eventType: 'PHOTO_UPLOADED',
          metadata: { photoId: photo.id, fileName: input.fileName }
        }
      });

      return photo;
    });

    return mapPhoto(row);
  }

  async updateStatus(id: string, status: JobLogStatus, actor: AuditActorInput): Promise<JobLog | undefined> {
    const current = await this.db.jobLog.findUnique({ where: { id } });
    if (!current) return undefined;

    const data: Prisma.JobLogUpdateInput = { status };
    if (status === 'SUBMITTED') data.submittedAt = new Date();
    if (status === 'REVIEWED') data.reviewedAt = new Date();
    if (status === 'CLOSED') data.completedAt = new Date();

    const row = await this.db.$transaction(async (tx) => {
      const updated = await tx.jobLog.update({ where: { id }, data, include: JOB_LOG_INCLUDE });

      await tx.jobLogAuditEvent.create({
        data: {
          jobLogId: id,
          actorUserId: actor.actorUserId,
          actorName: actor.actorName,
          actorRole: actor.actorRole,
          eventType: 'STATUS_CHANGED',
          fromStatus: current.status,
          toStatus: status
        }
      });

      return updated;
    });

    return mapJobLog(row);
  }

  async applyReview(input: ReviewJobLogInput): Promise<JobLog | undefined> {
    const current = await this.db.jobLog.findUnique({ where: { id: input.jobLogId } });
    if (!current || current.status !== 'SUBMITTED') return undefined;

    const nextStatus: JobLogStatus = input.decision === 'APPROVE' ? 'REVIEWED' : 'IN_PROGRESS';

    const row = await this.db.$transaction(async (tx) => {
      const updated = await tx.jobLog.update({
        where: { id: input.jobLogId },
        data: {
          status: nextStatus,
          reviewerName: input.reviewerName,
          reviewNotes: input.reviewNotes,
          reviewedAt: input.decision === 'APPROVE' ? new Date() : undefined
        },
        include: JOB_LOG_INCLUDE
      });

      await tx.jobLogAuditEvent.create({
        data: {
          jobLogId: input.jobLogId,
          actorUserId: input.actorUserId,
          actorName: input.reviewerName,
          actorRole: input.actorRole,
          eventType: 'REVIEW_DECISION',
          fromStatus: 'SUBMITTED',
          toStatus: nextStatus,
          metadata: { decision: input.decision, reviewNotes: input.reviewNotes }
        }
      });

      return updated;
    });

    return mapJobLog(row);
  }

  async getNextJobReference(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.db.jobLog.count();
    return `JL-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  async listAuditEvents(jobLogId: string): Promise<JobLogAuditEvent[]> {
    const rows = await this.db.jobLogAuditEvent.findMany({
      where: { jobLogId },
      orderBy: { createdAt: 'asc' }
    });
    return rows.map(mapAuditEvent);
  }

  async deletePhoto(photoId: string): Promise<void> {
    await this.db.jobLogPhoto.delete({ where: { id: photoId } });
  }

  async importProcedure(jobLogId: string, procedureId: string, procedureTitle: string, steps: string[], actor: AuditActorInput): Promise<JobLogChecklist> {
    const row = await this.db.$transaction(async (tx) => {
      const checklist = await tx.jobLogChecklist.create({
        data: {
          jobLogId,
          procedureId,
          procedureTitle,
          items: {
            create: steps.map((step, index) => ({
              stepIndex: index,
              content: step
            }))
          }
        },
        include: { items: { orderBy: { stepIndex: 'asc' } } }
      });

      // Auto-transition OPEN → IN_PROGRESS
      const jobLog = await tx.jobLog.findUniqueOrThrow({ where: { id: jobLogId } });
      if (jobLog.status === 'OPEN') {
        await tx.jobLog.update({ where: { id: jobLogId }, data: { status: 'IN_PROGRESS' } });
        await tx.jobLogAuditEvent.create({
          data: {
            jobLogId,
            actorUserId: actor.actorUserId,
            actorName: actor.actorName,
            actorRole: actor.actorRole,
            eventType: 'STATUS_CHANGED',
            fromStatus: 'OPEN',
            toStatus: 'IN_PROGRESS'
          }
        });
      }

      await tx.jobLogAuditEvent.create({
        data: {
          jobLogId,
          actorUserId: actor.actorUserId,
          actorName: actor.actorName,
          actorRole: actor.actorRole,
          eventType: 'CHECKLIST_IMPORTED',
          metadata: { procedureId, procedureTitle, stepCount: steps.length }
        }
      });

      return checklist;
    });

    return mapChecklist(row);
  }

  async toggleChecklistItem(itemId: string, checked: boolean, checkedBy: string): Promise<JobLogChecklistItem> {
    const row = await this.db.jobLogChecklistItem.update({
      where: { id: itemId },
      data: {
        checked,
        checkedAt: checked ? new Date() : null,
        checkedBy: checked ? checkedBy : null
      }
    });
    return mapChecklistItem(row);
  }
}
