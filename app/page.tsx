import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Boxes,
  Database,
  FileSpreadsheet,
  ShieldCheck,
  ShoppingCart,
  Users,
  Workflow,
} from 'lucide-react';

import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';

const capabilityCards = [
  {
    title: 'Orders cockpit',
    description:
      'Protected order queue, workflow transitions, notes, and audit visibility tuned for operator throughput.',
    icon: ShoppingCart,
  },
  {
    title: 'Reporting worker',
    description:
      'CSV exports are queued in Postgres and completed by the local worker container without external infrastructure.',
    icon: FileSpreadsheet,
  },
  {
    title: 'Access control',
    description:
      'Role-based permissions, seeded local accounts, and user management stay inside the same internal surface.',
    icon: ShieldCheck,
  },
  {
    title: 'Runtime observability',
    description:
      'Health, readiness, and metrics endpoints stay available for smoke tests and local environment checks.',
    icon: Activity,
  },
] as const;

const runtimeServices = [
  'web: Next.js application surface',
  'worker: report-job processor',
  'postgres: operational data and queue state',
  'redis: local support cache and coordination',
] as const;

const endpoints = [
  {
    href: '/api/health',
    label: 'Health endpoint',
    description: 'Fast liveliness check for local web availability.',
  },
  {
    href: '/api/ready',
    label: 'Readiness endpoint',
    description: 'Confirms the app can reach its runtime dependencies.',
  },
  {
    href: '/api/metrics',
    label: 'Metrics endpoint',
    description: 'Local scrape target for runtime counters and queue insight.',
  },
] as const;

export default function HomePage() {
  return (
    <main className="min-h-screen px-4 py-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_24rem]">
          <Card className="border border-border/70 bg-card/88 shadow-xl shadow-black/5">
            <CardHeader className="gap-4 border-b border-border/60 pb-6">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="bg-primary/10 text-primary">
                  Local-first stack
                </Badge>
                <Badge variant="outline">Docker Compose runtime</Badge>
                <Badge variant="outline">No AWS required</Badge>
              </div>
              <div className="flex flex-col gap-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Commerce Ops Suite
                </p>
                <div className="flex flex-col gap-3">
                  <h1 className="max-w-4xl font-heading text-5xl leading-none font-semibold tracking-tight text-foreground lg:text-7xl">
                    Operations cockpit for local order workflows, reporting, and
                    access control.
                  </h1>
                  <p className="max-w-3xl text-base leading-7 text-muted-foreground lg:text-lg">
                    This app is built to exercise an internal commerce control
                    plane entirely inside local containers: seeded auth,
                    protected workspaces, report jobs, audit trails, and runtime
                    probes.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-6 pt-6">
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/login">
                    Enter cockpit
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/orders">
                    Orders workspace
                    <Workflow data-icon="inline-end" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="ghost">
                  <Link href="/reports">
                    Reports queue
                    <FileSpreadsheet data-icon="inline-end" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="ghost">
                  <Link href="/users">
                    Access roster
                    <Users data-icon="inline-end" />
                  </Link>
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {capabilityCards.map((card) => {
                  const Icon = card.icon;

                  return (
                    <Card
                      key={card.title}
                      className="border border-border/70 bg-background/70 shadow-sm"
                      size="sm"
                    >
                      <CardHeader className="gap-3">
                        <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <Icon className="size-5" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <CardTitle>{card.title}</CardTitle>
                          <CardDescription>{card.description}</CardDescription>
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/70 bg-sidebar text-sidebar-foreground shadow-xl shadow-black/10">
            <CardHeader className="gap-4 border-b border-sidebar-border pb-6">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-black/20">
                  <Boxes className="size-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/55">
                    Runtime map
                  </p>
                  <h2 className="font-heading text-2xl font-semibold tracking-tight text-sidebar-foreground">
                    Compose is the control surface
                  </h2>
                </div>
              </div>
              <CardDescription className="text-sidebar-foreground/70">
                The current local stack mirrors the operational shape of the
                product without requiring cloud services.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5 pt-6">
              <div className="flex flex-col gap-3">
                {runtimeServices.map((service) => (
                  <div
                    key={service}
                    className="rounded-2xl border border-sidebar-border bg-sidebar-accent/55 px-4 py-3 text-sm leading-6 text-sidebar-foreground/84"
                  >
                    {service}
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/55 p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/55">
                  <Database className="size-3.5" />
                  Local probes
                </div>
                <div className="flex flex-col gap-2">
                  {endpoints.map((endpoint) => (
                    <Link
                      key={endpoint.href}
                      href={endpoint.href}
                      className="rounded-xl border border-transparent px-3 py-2 text-sm text-sidebar-foreground/82 transition-colors hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    >
                      {endpoint.href}
                    </Link>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {endpoints.map((endpoint) => (
            <Card
              key={endpoint.href}
              className="border border-border/70 bg-card/84 shadow-sm"
            >
              <CardHeader className="gap-3">
                <Badge variant="outline">{endpoint.href}</Badge>
                <div className="flex flex-col gap-1">
                  <CardTitle>{endpoint.label}</CardTitle>
                  <CardDescription>{endpoint.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild variant="ghost">
                  <Link href={endpoint.href}>
                    Open endpoint
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </main>
  );
}
