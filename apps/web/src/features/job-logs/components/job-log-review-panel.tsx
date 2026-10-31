'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Clock, MapPin, Mic, Phone, ShieldCheck, User, XCircle } from 'lucide-react';
import { reviewJobLogAction } from '@/app/(app)/job-logs/actions';
import type { JobLog, JobLogAuditEvent, JobLogEntryType, JobLogStatus } from '@/lib/job-log-domain';

const entryTypeLabels: Record<JobLogEntryType, string> = {
  NOTE: 'Note',
  VOICE_TRANSCRIPTION: 'Voice',
  OBSERVATION: 'Observation',
  ACTION_TAKEN: 'Action Taken',
  ISSUE_FOUND: 'Issue Found'
};

const entryTypeColors: Record<JobLogEntryType, string> = {
  NOTE: 'bg-slate-100 text-slate-700',
  VOICE_TRANSCRIPTION: 'bg-indigo-100 text-indigo-700',
  OBSERVATION: 'bg-blue-100 text-blue-700',
  ACTION_TAKEN: 'bg-green-100 text-green-700',
  ISSUE_FOUND: 'bg-red-100 text-red-700'
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface ReviewPanelProps {
  jobLog: JobLog;
  integrityValid: boolean;
  auditEvents: JobLogAuditEvent[];
}

export function JobLogReviewPanel({ jobLog, integrityValid, auditEvents }: ReviewPanelProps) {
  const canReview = jobLog.status === 'SUBMITTED';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Review: {jobLog.jobReference}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {jobLog.customerName} — {jobLog.siteName} — {jobLog.asset}
          </p>
        </div>
        {integrityValid ? (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
            <ShieldCheck className="h-4 w-4" />
            Integrity verified
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            <XCircle className="h-4 w-4" />
            Integrity check failed — data may have been tampered with
          </div>
        )}
      </div>

      {/* Job details */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm"><User className="h-4 w-4" /> Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">{jobLog.customerName}</p>
            <p className="text-slate-500">{jobLog.siteName}</p>
            {jobLog.siteAddress && <p className="flex items-center gap-1 text-slate-500"><MapPin className="h-3 w-3" /> {jobLog.siteAddress}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4" /> Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">{jobLog.siteContactName}</p>
            {jobLog.siteContactPhone && <p className="text-slate-500">{jobLog.siteContactPhone}</p>}
            {jobLog.siteContactEmail && <p className="text-slate-500">{jobLog.siteContactEmail}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4" /> Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>Started: {formatDate(jobLog.startedAt)}</p>
            {jobLog.submittedAt && <p>Submitted: {formatDate(jobLog.submittedAt)}</p>}
            <p className="text-xs text-slate-400">Tech: {jobLog.technicianName}</p>
            <p className="text-xs text-slate-400">Asset: {jobLog.asset} {jobLog.assetSerial ? `(${jobLog.assetSerial})` : ''}</p>
          </CardContent>
        </Card>
      </div>

      {/* Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Job Entries ({jobLog.entries.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {jobLog.entries.map((entry) => (
            <div key={entry.id} className="rounded-lg border border-slate-200 p-3">
              <div className="mb-1 flex items-center gap-2">
                <Badge className={`text-[10px] ${entryTypeColors[entry.entryType]}`}>
                  {entryTypeLabels[entry.entryType]}
                </Badge>
                {entry.isVoiceInput && <Mic className="h-3 w-3 text-indigo-500" />}
                <span className="text-xs text-slate-400">
                  {formatDate(entry.createdAt)} {formatTime(entry.createdAt)} — {entry.authorName}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-slate-700">{entry.content}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Photos */}
      {jobLog.photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Photos ({jobLog.photos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {jobLog.photos.map((photo) => (
                <div key={photo.id} className="relative overflow-hidden rounded-lg border border-slate-200">
                  <img
                    src={`/api/uploads/${photo.storageKey}`}
                    alt={photo.caption || photo.fileName}
                    className="aspect-square w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1">
                    <p className="truncate text-xs text-white">{photo.caption || photo.fileName}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review form */}
      {canReview && (
        <Card className="border-[#006B3F]/30">
          <CardHeader>
            <CardTitle className="text-base">Review Decision</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={reviewJobLogAction} className="space-y-4">
              <input type="hidden" name="jobLogId" value={jobLog.id} />
              <div className="space-y-2">
                <Label htmlFor="reviewNotes">Review Notes</Label>
                <Textarea id="reviewNotes" name="reviewNotes" placeholder="Optional notes for the technician..." rows={3} />
              </div>
              <div className="flex gap-3">
                <Button type="submit" name="decision" value="APPROVE">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button type="submit" name="decision" value="REQUEST_CHANGES" variant="outline">
                  <XCircle className="mr-2 h-4 w-4" />
                  Request Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Audit trail */}
      {auditEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Audit Trail</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {auditEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-2 text-xs text-slate-500">
                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                  <span className="font-medium text-slate-700">{event.eventType.replace(/_/g, ' ')}</span>
                  <span>by {event.actorName}</span>
                  <span className="ml-auto">{formatDate(event.createdAt)} {formatTime(event.createdAt)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
