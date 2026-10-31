import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RiskHotspot } from '@/lib/domain';
import { AlertTriangle } from 'lucide-react';

export function RiskHotspots({ hotspots }: { hotspots: RiskHotspot[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <CardTitle className="text-base">Knowledge risk hotspots</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {hotspots.map((row) => (
          <div key={row.key} className="flex items-center justify-between rounded-md border p-3 text-sm">
            <span className="font-medium">{row.asset} / {row.task}</span>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Badge variant="outline" className="text-[10px]">Risk {row.riskScore}</Badge>
              <span>{row.reason}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
