import { loginAction } from './actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface LoginPageProps {
  searchParams?: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const hasError = params?.error === 'CredentialsSignin';

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-[#006B3F]">SKILLSPONGE</span>
            <span className="text-2xl font-black text-[#E30613]">+</span>
          </div>
          <div>
            <CardTitle className="text-2xl">Governed Knowledge Login</CardTitle>
            <CardDescription>Sign in to capture, review, and transfer engineering know-how safely.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasError && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">Invalid username or password.</div>}
          <form action={loginAction} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full">Sign in</Button>
          </form>
          <p className="text-xs text-slate-500">Seed user: supervisor / supervisor123</p>
        </CardContent>
      </Card>
    </main>
  );
}
