'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { JobLog, JobLogStatus } from '@/lib/job-log-domain';

const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Open', value: 'OPEN' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Submitted', value: 'SUBMITTED' },
  { label: 'Reviewed', value: 'REVIEWED' },
  { label: 'Closed', value: 'CLOSED' }
];

const statusColors: Record<JobLogStatus, string> = {
  OPEN: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-amber-100 text-amber-800',
  SUBMITTED: 'bg-purple-100 text-purple-800',
  REVIEWED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-slate-100 text-slate-600'
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function JobLogsList({ jobLogs, currentStatus }: { jobLogs: JobLog[]; currentStatus: string }) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => router.push(tab.value === 'ALL' ? '/job-logs' : `/job-logs?status=${tab.value}`)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              currentStatus === tab.value
                ? 'bg-[#006B3F] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {jobLogs.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No job logs found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden sm:table-cell">Site</TableHead>
                <TableHead className="hidden md:table-cell">Asset</TableHead>
                <TableHead className="hidden lg:table-cell">Technician</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobLogs.map((log) => (
                <TableRow key={log.id} className="cursor-pointer hover:bg-slate-50">
                  <TableCell>
                    <Link href={`/job-logs/${log.id}`} className="font-mono text-sm font-semibold text-[#006B3F] hover:underline">
                      {log.jobReference}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">{log.customerName}</TableCell>
                  <TableCell className="hidden text-sm sm:table-cell">{log.siteName}</TableCell>
                  <TableCell className="hidden text-sm md:table-cell">{log.asset}</TableCell>
                  <TableCell className="hidden text-sm lg:table-cell">{log.technicianName}</TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] ${statusColors[log.status]}`}>
                      {log.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden text-xs text-slate-500 sm:table-cell">
                    {formatDate(log.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
