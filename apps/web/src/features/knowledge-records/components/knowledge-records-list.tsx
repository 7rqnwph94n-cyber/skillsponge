"use client";

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { LayoutGrid, ListFilter, Table2 } from 'lucide-react';
import { KnowledgeRecord, ExpertProfile } from '@/lib/domain';
import type { SearchFilterOptions } from '@/lib/knowledge-service';
import { StatusBadge } from '@/components/ui/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate } from '@/lib/utils';

function getTypeLabel(type: KnowledgeRecord['type']): string {
  if (type === 'FIELD_NOTE') return 'Field Note';
  if (type === 'FAILURE_PATTERN') return 'Failure Pattern';
  if (type === 'LESSON_LEARNED') return 'Lesson Learned';
  if (type === 'EXPERT_INTERVIEW') return 'Expert Interview';
  if (type === 'SHADOWING_RECORD') return 'Shadowing Record';
  return 'Procedure';
}

type ViewMode = 'table' | 'cards';

export function KnowledgeRecordsList({
  records,
  options,
  experts
}: {
  records: KnowledgeRecord[];
  options: SearchFilterOptions;
  experts: ExpertProfile[];
}) {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [expert, setExpert] = useState('');

  const filtered = useMemo(() => {
    return records.filter((record) => {
      const matchesKeyword = keyword
        ? `${record.title} ${record.body} ${record.tags.join(' ')} ${record.context.asset} ${record.context.task}`.toLowerCase().includes(keyword.toLowerCase())
        : true;
      const matchesType = type === 'ALL' ? true : record.type === type;
      const matchesStatus = status === 'ALL' ? true : record.approvalState === status;
      const matchesExpert = expert ? record.sourceExpertId === expert || record.author === experts.find((item) => item.id === expert)?.name : true;
      return matchesKeyword && matchesType && matchesStatus && matchesExpert;
    });
  }, [records, keyword, type, status, expert, experts]);

  const columns: ColumnDef<KnowledgeRecord>[] = [
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <Link href={`/knowledge-records/${row.original.id}`} className="font-semibold text-slate-900 hover:text-[#006B3F]">
          {row.original.title}
        </Link>
      )
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => <Badge variant="outline">{getTypeLabel(row.original.type)}</Badge>
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge state={row.original.approvalState} />
    },
    {
      accessorKey: 'owner',
      header: 'Owner / Expert',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-slate-900">{row.original.author}</p>
          <p className="text-xs text-slate-500">{row.original.sourceExpertName ?? 'No linked expert'}</p>
        </div>
      )
    },
    {
      accessorKey: 'updated',
      header: 'Last Updated',
      cell: ({ row }) => formatDate(row.original.lastValidatedAt ?? row.original.createdAt)
    },
    {
      accessorKey: 'version',
      header: 'Version',
      cell: ({ row }) => `v${row.original.currentVersion}`
    }
  ];

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <ListFilter className="h-5 w-5 text-[#0A2540]" />
          Search & Filter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <Label htmlFor="records-keyword">Search</Label>
            <Input
              id="records-keyword"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Title, body, tags, asset, symptom..."
            />
          </div>
          <div>
            <Label htmlFor="records-type">Type</Label>
            <select id="records-type" value={type} onChange={(event) => setType(event.target.value)} className="h-11 w-full rounded-md border border-slate-300 px-3">
              <option value="ALL">All types</option>
              {options.types.map((item) => (
                <option key={item} value={item}>
                  {getTypeLabel(item)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="records-status">Status</Label>
            <select id="records-status" value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 w-full rounded-md border border-slate-300 px-3">
              <option value="ALL">All statuses</option>
              {options.statuses.map((item) => (
                <option key={item} value={item}>
                  {item.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="records-expert">Expert</Label>
            <select id="records-expert" value={expert} onChange={(event) => setExpert(event.target.value)} className="h-11 w-full rounded-md border border-slate-300 px-3">
              <option value="">All experts</option>
              {experts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-900">{filtered.length}</span> records
          </p>
          <div className="inline-flex rounded-md border border-slate-300 p-1">
            <Button
              size="sm"
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              className={cn('h-9', viewMode === 'table' && 'bg-[#0A2540] hover:bg-[#081d32]')}
              onClick={() => setViewMode('table')}
            >
              <Table2 className="h-4 w-4" />
              Table
            </Button>
            <Button size="sm" variant={viewMode === 'cards' ? 'default' : 'ghost'} className="h-9" onClick={() => setViewMode('cards')}>
              <LayoutGrid className="h-4 w-4" />
              Cards
            </Button>
          </div>
        </div>

        <div className="hidden md:block">
          {viewMode === 'table' ? (
            <div className="rounded-lg border border-slate-200">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {filtered.map((record) => (
                <Link key={record.id} href={`/knowledge-records/${record.id}`} className="rounded-lg border border-slate-200 p-4 transition hover:bg-slate-50">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-slate-900">{record.title}</p>
                    <StatusBadge state={record.approvalState} />
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{getTypeLabel(record.type)} • v{record.currentVersion}</p>
                  <p className="mt-1 text-sm text-slate-500">{record.context.asset} • {record.context.task}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3 md:hidden">
          {filtered.map((record) => (
            <Link key={record.id} href={`/knowledge-records/${record.id}`} className="block rounded-lg border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-slate-900">{record.title}</p>
                <StatusBadge state={record.approvalState} />
              </div>
              <p className="mt-1 text-sm text-slate-600">{getTypeLabel(record.type)} • v{record.currentVersion}</p>
              <p className="mt-1 text-sm text-slate-500">{record.author}</p>
              <p className="mt-1 text-xs text-slate-500">{formatDate(record.lastValidatedAt ?? record.createdAt)}</p>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
