'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createJobLogAction } from '@/app/(app)/job-logs/actions';

const BRUDERER_ASSETS = [
  'BSTA 200',
  'BSTA 280',
  'BSTA 410',
  'BSTA 510',
  'BSTA 710',
  'BSTA 810',
  'BSTA 1000',
  'BSTA 1250',
  'BSTA 2500',
  'BSTL 350',
  'Other'
];

export function CreateJobLogForm() {
  return (
    <form action={createJobLogAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Customer Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="customerName">Customer Name *</Label>
            <Input id="customerName" name="customerName" required placeholder="e.g. Smith & Sons Engineering" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="siteName">Site Name *</Label>
            <Input id="siteName" name="siteName" required placeholder="e.g. Birmingham Main Plant" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="siteAddress">Site Address</Label>
            <Input id="siteAddress" name="siteAddress" placeholder="e.g. Unit 4, Industrial Estate, B1 1AA" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Site Contact</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="siteContactName">Contact Name *</Label>
            <Input id="siteContactName" name="siteContactName" required placeholder="e.g. John Davies" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="siteContactPhone">Phone</Label>
            <Input id="siteContactPhone" name="siteContactPhone" type="tel" placeholder="e.g. 07700 900000" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="siteContactEmail">Email</Label>
            <Input id="siteContactEmail" name="siteContactEmail" type="email" placeholder="e.g. john@example.com" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Machine / Asset</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="asset">Press Model *</Label>
            <select
              id="asset"
              name="asset"
              required
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select press model...</option>
              {BRUDERER_ASSETS.map((asset) => (
                <option key={asset} value={asset}>{asset}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="assetSerial">Serial Number</Label>
            <Input id="assetSerial" name="assetSerial" placeholder="e.g. 510-4872" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assetLocation">Bay / Line Ref</Label>
            <Input id="assetLocation" name="assetLocation" placeholder="e.g. Press Bay 3" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="submit" size="lg">
          Create Job Log
        </Button>
      </div>
    </form>
  );
}
