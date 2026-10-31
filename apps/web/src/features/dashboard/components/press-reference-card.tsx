import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Gauge } from 'lucide-react';

const MODELS = [
  { model: 'BSTA 200', force: '200 kN', maxSpm: '2,000', note: '2 \u00b5m option' },
  { model: 'BSTA 280', force: '280 kN', maxSpm: '1,500', note: '2 \u00b5m option' },
  { model: 'BSTA 410', force: '410 kN', maxSpm: '1,600', note: '' },
  { model: 'BSTA 510', force: '510 kN', maxSpm: '1,120', note: '2 \u00b5m option' },
  { model: 'BSTA 810', force: '810 kN', maxSpm: '1,000', note: '' },
  { model: 'BSTA 1250', force: '1,250 kN', maxSpm: '850', note: '' },
];

export function PressReferenceCard() {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">BSTA quick reference</CardTitle>
        </div>
        <Button variant="outline" size="sm" render={<Link href="/press-reference" />}>
          Full specs table
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Model</TableHead>
              <TableHead>Force</TableHead>
              <TableHead>Max spm</TableHead>
              <TableHead>Note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MODELS.map((m) => (
              <TableRow key={m.model}>
                <TableCell className="font-semibold text-primary">{m.model}</TableCell>
                <TableCell>{m.force}</TableCell>
                <TableCell>{m.maxSpm}</TableCell>
                <TableCell className="text-muted-foreground">{m.note}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
