import { PageHeader } from '@/components/ui/page-header';
import { SearchWorkspace } from '@/features/search/components/search-workspace';
import { getFilterOptions, listKnowledgeRecords } from '@/lib/knowledge-service';
import { parseSearchFilters } from '@/lib/search-params';
import { requireAnyRole } from '@/lib/authz';

interface SearchPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  await requireAnyRole(['TECHNICIAN', 'SENIOR_TECHNICIAN', 'SUPERVISOR', 'REVIEWER', 'ADMIN']);
  const params = (await searchParams) ?? {};
  const filters = parseSearchFilters(params);
  const [options, results] = await Promise.all([getFilterOptions(), listKnowledgeRecords(filters)]);

  return (
    <div>
      <PageHeader title="Search" description="Find records by type, taxonomy filters, and keywords." />
      <SearchWorkspace results={results} filters={filters} options={options} />
    </div>
  );
}
