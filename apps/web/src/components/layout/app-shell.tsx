import Link from 'next/link';
import { ReactNode } from 'react';
import {
  AlertTriangle,
  BookOpen,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Database,
  FlaskConical,
  Home,
  Menu,
  Search,
  ShieldCheck,
  UsersRound
} from 'lucide-react';
import { logoutAction } from '@/app/login/actions';
import { AuthActor } from '@/lib/authz';
import { getNavForRole } from '@/lib/roles';
import { listReviewQueue } from '@/lib/knowledge-service';
import { CommandShortcut } from '@/components/layout/command-shortcut';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  '/dashboard': Home,
  '/knowledge-records': Database,
  '/procedures': BookOpen,
  '/job-logs': ClipboardCheck,
  '/experts': UsersRound,
  '/handover-packs': ClipboardList,
  '/continuity-risk': AlertTriangle,
  '/audit-trail': ShieldCheck,
  '/capture-knowledge': FlaskConical,
  '/search': Search,
  '/review-queue': ClipboardList,
  '/admin': ShieldCheck
};

const recordSubFilters = [
  { label: 'Procedures', href: '/search?type=PROCEDURE' },
  { label: 'Field Notes', href: '/search?type=FIELD_NOTE' },
  { label: 'Failure Patterns', href: '/search?type=FAILURE_PATTERN' },
  { label: 'Lessons Learned', href: '/search?type=LESSON_LEARNED' },
  { label: 'Interviews/Shadowing', href: '/search?type=EXPERT_INTERVIEW' }
];

function initials(name: string): string {
  const parts = name.split(' ').filter(Boolean);
  if (!parts.length) return 'U';
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export async function AppShell({ children, actor }: { children: ReactNode; actor: AuthActor }) {
  const items = getNavForRole(actor.role);
  const queueCount = actor.role === 'REVIEWER' || actor.role === 'SUPERVISOR' || actor.role === 'ADMIN' ? (await listReviewQueue()).length : 0;
  const primaryItems = items.filter((item) =>
    ['/dashboard', '/knowledge-records', '/procedures', '/job-logs', '/handover-packs', '/continuity-risk', '/audit-trail'].includes(item.href)
  );

  return (
    <div className="app-shell-bg min-h-screen bg-slate-50">
      <CommandShortcut />
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-slate-200 bg-white/90 backdrop-blur lg:flex lg:flex-col">
        <div className="border-b border-slate-200 p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#006B3F] text-white">
              <span className="text-lg font-black">B</span>
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide text-slate-900">SKILLSPONGE</p>
              <p className="text-xs text-slate-500">Knowledge Continuity</p>
            </div>
            <span className="ml-auto text-xl font-black text-[#E30613]">+</span>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {primaryItems.map((item) => {
            const Icon = iconMap[item.href] ?? Home;
            return (
              <div key={item.href} className="space-y-1">
                {item.href === '/knowledge-records' ? (
                  <details className="group/kr">
                    <summary
                      className={cn(
                        'touch-target flex cursor-pointer list-none items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                      <ChevronRight className="ml-auto h-3.5 w-3.5 text-slate-400 transition-transform group-open/kr:rotate-90" />
                    </summary>
                    <div className="space-y-1 pl-6">
                      {recordSubFilters.map((filter) => (
                        <Link key={filter.href} href={filter.href} className="touch-target flex items-center rounded-md px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700">
                          {filter.label}
                        </Link>
                      ))}
                    </div>
                  </details>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      'touch-target flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100',
                      item.href === '/dashboard' && 'bg-[#006B3F]/10 text-[#006B3F]'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                )}
              </div>
            );
          })}
        </nav>
        <div className="border-t border-slate-200 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-lg bg-slate-100 p-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{initials(actor.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-slate-900">{actor.name}</p>
              <p className="text-xs text-slate-500">{actor.role.replace('_', ' ')}</p>
            </div>
          </div>
          <form action={logoutAction}>
            <Button variant="outline" className="w-full justify-start">
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      <header className="fixed inset-x-0 top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur lg:left-72">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-3 py-2 sm:px-5">
          <details className="group lg:hidden">
            <summary className="touch-target flex cursor-pointer list-none items-center justify-center rounded-md border border-slate-300 bg-white px-3">
              <Menu className="h-5 w-5 text-slate-700" />
            </summary>
            <div className="absolute left-3 top-14 z-50 w-[18rem] rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-base font-bold text-[#006B3F]">SKILLSPONGE</span>
                <span className="text-lg font-black text-[#E30613]">+</span>
              </div>
              <div className="space-y-1">
                {items.map((item) => {
                  const Icon = iconMap[item.href] ?? Home;
                  return (
                    <Link key={item.href} href={item.href} className="touch-target flex items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-700 hover:bg-slate-100">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </details>

          <form action="/search" className="flex flex-1 items-center gap-2">
            <Search className="hidden h-4 w-4 text-slate-500 sm:block" />
            <Input
              id="global-search"
              name="keyword"
              placeholder="Search records, experts, handovers... (Cmd+K)"
              aria-label="Global search"
              className="h-11 bg-slate-50"
            />
          </form>
          <Link href="/review-queue" className="touch-target relative flex items-center justify-center rounded-md border border-slate-300 bg-white px-3">
            <AlertTriangle className="h-5 w-5 text-[#0A2540]" />
            {queueCount > 0 && <Badge className="absolute -right-2 -top-2 h-5 min-w-5 justify-center px-1 text-[10px]">{queueCount}</Badge>}
          </Link>
          <ThemeToggle />
          <div className="hidden items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 sm:flex">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{initials(actor.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs font-semibold text-slate-900">{actor.name}</p>
              <p className="text-[11px] text-slate-500">{actor.role.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="pb-24 pt-16 lg:ml-72 lg:pb-8">
        <div className="mx-auto max-w-[1400px] p-3 sm:p-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">{children}</div>
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white/95 p-2 backdrop-blur lg:hidden">
        {items.slice(0, 5).map((item) => {
          const Icon = iconMap[item.href] ?? Home;
          return (
            <Link key={item.href} href={item.href} className="touch-target flex flex-col items-center justify-center rounded-md text-[11px] font-medium text-slate-700 hover:bg-slate-100">
              <Icon className="mb-1 h-4 w-4" />
              <span className="line-clamp-1 text-center">{item.label.replace(' & Risk Views', '')}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
