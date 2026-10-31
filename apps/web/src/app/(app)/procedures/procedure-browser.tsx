'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { KnowledgeRecord, ProcedureRecord } from '@/lib/domain';

interface ProcedureBrowserProps {
  generic: KnowledgeRecord[];
  modelSpecific: KnowledgeRecord[];
  variantSpecific: KnowledgeRecord[];
  unscoped: KnowledgeRecord[];
}

function isProcedure(r: KnowledgeRecord): r is ProcedureRecord {
  return r.type === 'PROCEDURE';
}

function ProcedureCard({ record }: { record: ProcedureRecord }) {
  const stepCount = record.steps?.length ?? 0;
  return (
    <Link href={`/knowledge-records/${record.id}`} className="block">
      <Card className="transition-colors hover:border-[#006B3F]/40">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm font-semibold leading-snug">{record.title}</CardTitle>
            <Badge variant="outline" className="shrink-0 text-[10px]">
              {record.context.asset}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground line-clamp-2">{record.summary}</p>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="text-[10px]">{record.context.system}</Badge>
            {stepCount > 0 && (
              <Badge variant="outline" className="text-[10px]">{stepCount} steps</Badge>
            )}
            {record.confidence === 'HIGH' && (
              <Badge className="bg-green-600 text-[10px] text-white">High confidence</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ProcedureList({ records, filter }: { records: KnowledgeRecord[]; filter: string }) {
  const procedures = records.filter(isProcedure);
  const filtered = filter
    ? procedures.filter(
        (r) =>
          r.title.toLowerCase().includes(filter) ||
          r.summary.toLowerCase().includes(filter) ||
          r.context.asset.toLowerCase().includes(filter) ||
          r.context.system.toLowerCase().includes(filter) ||
          r.tags.some((t) => t.toLowerCase().includes(filter))
      )
    : procedures;

  if (filtered.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No procedures found.</p>;
  }

  // Group by asset
  const byAsset = new Map<string, ProcedureRecord[]>();
  for (const r of filtered) {
    const asset = r.context.asset;
    const existing = byAsset.get(asset) ?? [];
    existing.push(r);
    byAsset.set(asset, existing);
  }

  return (
    <div className="space-y-6">
      {[...byAsset.entries()].map(([asset, procs]) => (
        <div key={asset}>
          <h3 className="mb-3 text-sm font-semibold text-slate-500">{asset}</h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {procs.map((r) => (
              <ProcedureCard key={r.id} record={r} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProcedureBrowser({ generic, modelSpecific, variantSpecific, unscoped }: ProcedureBrowserProps) {
  const [filter, setFilter] = useState('');
  const normalizedFilter = filter.trim().toLowerCase();

  return (
    <div className="space-y-4">
      <Input
        placeholder="Filter procedures by title, asset, system, or tag..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="max-w-md"
      />
      <Tabs defaultValue="generic">
        <TabsList>
          <TabsTrigger value="generic">
            Generic ({generic.length})
          </TabsTrigger>
          <TabsTrigger value="model">
            Model-specific ({modelSpecific.length})
          </TabsTrigger>
          <TabsTrigger value="variant">
            Variant-specific ({variantSpecific.length})
          </TabsTrigger>
          {unscoped.length > 0 && (
            <TabsTrigger value="other">
              Other ({unscoped.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="generic">
          <div className="mb-3">
            <p className="text-sm text-muted-foreground">
              Procedures that apply to all BSTA and BSTL series presses. Start here for core system processes.
            </p>
          </div>
          <ProcedureList records={generic} filter={normalizedFilter} />
        </TabsContent>

        <TabsContent value="model">
          <div className="mb-3">
            <p className="text-sm text-muted-foreground">
              Procedures specific to a particular press model (BSTA 200, BSTA 510, BSTA 1250, BSTL 350, etc.).
            </p>
          </div>
          <ProcedureList records={modelSpecific} filter={normalizedFilter} />
        </TabsContent>

        <TabsContent value="variant">
          <div className="mb-3">
            <p className="text-sm text-muted-foreground">
              Procedures for specific press variants or optional equipment (2 µm option, BPG 22 gearbox, BSS lubrication, heavy-tonnage installations).
            </p>
          </div>
          <ProcedureList records={variantSpecific} filter={normalizedFilter} />
        </TabsContent>

        {unscoped.length > 0 && (
          <TabsContent value="other">
            <div className="mb-3">
              <p className="text-sm text-muted-foreground">
                Approved procedures that have not yet been classified by scope.
              </p>
            </div>
            <ProcedureList records={unscoped} filter={normalizedFilter} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
