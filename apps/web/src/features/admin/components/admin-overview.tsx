import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, Tag } from 'lucide-react';

export function AdminOverview() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Administration</CardTitle>
          <p className="text-sm text-muted-foreground">Manage roles, taxonomy terms, and governance settings.</p>
        </CardHeader>
      </Card>
      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role assignments</p>
              <p className="font-semibold">14 active users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <Tag className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Taxonomy coverage</p>
              <p className="font-semibold">Assets 22 &middot; Tasks 37 &middot; Symptoms 46</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Audit health</p>
              <p className="font-semibold">No policy violations</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
