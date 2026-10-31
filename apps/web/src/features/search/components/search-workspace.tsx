import Link from 'next/link';
import { StatusBadge } from '@/components/ui/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SearchFilters, SearchFilterOptions, getTypeLabel } from '@/lib/knowledge-service';
import { KnowledgeRecord } from '@/lib/domain';
import { Search } from 'lucide-react';

export function SearchWorkspace({
  results,
  filters,
  options,
}: {
  results: KnowledgeRecord[];
  filters: SearchFilters;
  options: SearchFilterOptions;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <form className="grid gap-3 md:grid-cols-4" method="get">
            <Input name="keyword" defaultValue={filters.keyword} placeholder="Keyword in title, content, or tags" className="md:col-span-2" />
            <select name="type" defaultValue={filters.type ?? 'ALL'} className="rounded-md border bg-background px-3 py-2 text-sm">
              <option value="ALL">All types</option>
              {options.types.map((type) => <option key={type} value={type}>{getTypeLabel(type)}</option>)}
            </select>
            <select name="status" defaultValue={filters.status ?? 'ALL'} className="rounded-md border bg-background px-3 py-2 text-sm">
              <option value="ALL">All statuses</option>
              {options.statuses.map((status) => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}
            </select>
            <select name="asset" defaultValue={filters.asset} className="rounded-md border bg-background px-3 py-2 text-sm">
              <option value="">All assets</option>
              {options.assets.map((asset) => <option key={asset} value={asset}>{asset}</option>)}
            </select>
            <select name="system" defaultValue={filters.system} className="rounded-md border bg-background px-3 py-2 text-sm">
              <option value="">All systems</option>
              {options.systems.map((system) => <option key={system} value={system}>{system}</option>)}
            </select>
            <select name="task" defaultValue={filters.task} className="rounded-md border bg-background px-3 py-2 text-sm">
              <option value="">All tasks</option>
              {options.tasks.map((task) => <option key={task} value={task}>{task}</option>)}
            </select>
            <select name="symptom" defaultValue={filters.symptom} className="rounded-md border bg-background px-3 py-2 text-sm">
              <option value="">All symptoms</option>
              {options.symptoms.map((symptom) => <option key={symptom} value={symptom}>{symptom}</option>)}
            </select>
            <Button type="submit">
              <Search className="mr-1.5 h-4 w-4" />
              Search records
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Search results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {results.map((record) => (
            <div key={record.id} className="rounded-md border p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/knowledge-records/${record.id}`} className="font-medium hover:text-primary transition-colors">
                    {record.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">{record.context.asset} &middot; {record.context.task} &middot; {record.context.symptom}</p>
                </div>
                <StatusBadge state={record.approvalState} />
              </div>
              {record.approvalState === 'APPROVED' && (
                <Badge className="mt-2 bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-[10px]" variant="outline">Trusted approved content</Badge>
              )}
            </div>
          ))}
          {!results.length && <p className="text-sm text-muted-foreground">No records matched current filters.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
