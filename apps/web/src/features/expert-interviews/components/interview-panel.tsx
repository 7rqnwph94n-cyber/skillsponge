import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExpertInterviewRecord } from '@/lib/domain';

export function InterviewPanel({ records }: { records: ExpertInterviewRecord[] }) {
  return (
    <div className="space-y-4">
      {records.map((interview) => (
        <Card key={interview.id}>
          <CardHeader className="pb-3">
            <Link href={`/knowledge-records/${interview.id}`} className="hover:text-primary transition-colors">
              <CardTitle className="text-base">{interview.title}</CardTitle>
            </Link>
            <p className="text-sm text-muted-foreground">Expert: {interview.expertName} &middot; Asset: {interview.context.asset}</p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="rounded-md border p-3">
              <p className="font-medium">Novice misses</p>
              <p className="mt-1 text-muted-foreground">{interview.answers.whatNoviceMisses}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="font-medium">Top danger signs</p>
              <p className="mt-1 text-muted-foreground">{interview.answers.topThreeDangerSigns}</p>
            </div>
          </CardContent>
        </Card>
      ))}
      {!records.length && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">No expert interviews captured yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
