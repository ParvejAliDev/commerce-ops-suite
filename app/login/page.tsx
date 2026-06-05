import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  Workflow,
  Wrench,
} from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';

import { loginAction } from './actions';

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const errorMessages: Record<string, string> = {
  forbidden: 'Your account does not have access to the requested workspace.',
  invalid_credentials: 'The email or password is incorrect.',
  missing_credentials: 'Enter both email and password to continue.',
};

const checklist = [
  {
    title: 'Seeded local access',
    description:
      'Use the seeded admin credentials after the local seed step completes.',
    icon: ShieldCheck,
  },
  {
    title: 'Compose-managed runtime',
    description:
      'Web, worker, Postgres, and Redis stay inside Docker Compose for local verification.',
    icon: Workflow,
  },
  {
    title: 'Operational probes ready',
    description:
      'Health, readiness, metrics, reports, and user controls are all available after sign-in.',
    icon: Wrench,
  },
] as const;

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;
  const errorKey =
    typeof resolvedSearchParams.error === 'string'
      ? resolvedSearchParams.error
      : undefined;

  return (
    <main className="min-h-screen px-4 py-6 lg:px-8 lg:py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl gap-6 xl:grid-cols-[minmax(0,1.1fr)_28rem]">
        <Card className="border border-border/70 bg-card/86 shadow-xl shadow-black/5">
          <CardHeader className="gap-4 border-b border-border/60 pb-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="bg-primary/10 text-primary">
                Authenticated access
              </Badge>
              <Badge variant="outline">Local operators only</Badge>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Commerce Ops Suite
              </p>
              <h1 className="max-w-3xl font-heading text-5xl leading-none font-semibold tracking-tight text-foreground lg:text-6xl">
                Enter the local operations cockpit.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground lg:text-lg">
                This sign-in flow uses the seeded demo accounts and the current
                session storage inside your local Docker Compose stack. Nothing
                here depends on AWS.
              </p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6 lg:grid-cols-3">
            {checklist.map((item) => {
              const Icon = item.icon;

              return (
                <Card
                  key={item.title}
                  className="border border-border/70 bg-background/72 shadow-sm"
                  size="sm"
                >
                  <CardHeader className="gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <CardTitle>{item.title}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card/94 shadow-xl shadow-black/10">
          <CardHeader className="gap-4 border-b border-border/60 pb-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Sign in
                </p>
                <div className="flex flex-col gap-1">
                  <CardTitle className="text-3xl">Operator access</CardTitle>
                  <CardDescription>
                    Use the local seeded admin account to enter the workspace
                    shell.
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline">Session cookie</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 pt-6">
            {errorKey ? (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertTitle>Unable to sign in</AlertTitle>
                <AlertDescription>
                  {errorMessages[errorKey] ?? 'Unable to sign you in.'}
                </AlertDescription>
              </Alert>
            ) : null}

            <form action={loginAction} className="flex flex-col gap-4">
              <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
                <span>Email</span>
                <Input
                  name="email"
                  type="email"
                  required
                  defaultValue="admin.local@example.com"
                  autoComplete="email"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
                <span>Password</span>
                <Input
                  name="password"
                  type="password"
                  required
                  defaultValue="LocalAdminPass123!"
                  autoComplete="current-password"
                />
              </label>

              <Button type="submit" size="lg" className="mt-2">
                Sign in
              </Button>
            </form>

            <Card className="border border-border/70 bg-muted/35" size="sm">
              <CardHeader className="gap-2">
                <CardTitle>Seeded local credentials</CardTitle>
                <CardDescription>
                  `npm run seed` installs these defaults for local smoke and
                  operator testing.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
                <div className="rounded-xl border border-border/70 bg-background/80 px-3 py-2">
                  <strong className="text-foreground">Email:</strong>{' '}
                  admin.local@example.com
                </div>
                <div className="rounded-xl border border-border/70 bg-background/80 px-3 py-2">
                  <strong className="text-foreground">Password:</strong>{' '}
                  LocalAdminPass123!
                </div>
              </CardContent>
            </Card>

            <Button asChild variant="ghost" className="justify-start px-0">
              <Link href="/">
                <ArrowLeft data-icon="inline-start" />
                Back to home
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
