import {
  FormFieldsSkeleton,
  ListRowsSkeleton,
  PageHeaderSkeleton,
  SkeletonBlock,
  SkeletonLine,
  SkeletonPanel,
  TableRowsSkeleton,
  ToolbarSkeleton,
} from './skeleton-primitives';

export type RouteSkeletonVariant =
  | 'patients'
  | 'patient-detail'
  | 'form'
  | 'appointments'
  | 'calendar'
  | 'progress'
  | 'profile'
  | 'intake'
  | 'intake-review'
  | 'patient-intake'
  | 'history'
  | 'notifications'
  | 'settings'
  | 'security'
  | 'audit-logs'
  | 'users';

function PatientsSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton action="double" />
      <SkeletonPanel className="rounded-2xl p-5">
        <SkeletonBlock className="h-5 w-32 rounded-md bg-stone-200" />
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SkeletonBlock className="h-10 w-full rounded-xl bg-stone-100 sm:w-64" />
          <div className="flex gap-2">
            <SkeletonBlock className="h-9 w-24 rounded-xl bg-stone-100" />
            <SkeletonBlock className="h-9 w-24 rounded-xl bg-stone-100" />
          </div>
        </div>
        <div className="mt-6">
          <TableRowsSkeleton rows={7} columns={5} />
        </div>
      </SkeletonPanel>
    </div>
  );
}

function PatientDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeaderSkeleton />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <SkeletonPanel key={item} className="h-32 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <SkeletonBlock className="h-4 w-20 rounded-md bg-stone-200/80" />
              <SkeletonBlock className="h-5 w-5 rounded-md bg-stone-100" />
            </div>
            <SkeletonLine className="mt-4 w-full bg-stone-100" />
            <SkeletonLine className="mt-5 w-2/3 bg-stone-100" />
          </SkeletonPanel>
        ))}
      </div>
      <SkeletonPanel className="rounded-xl p-5">
        <SkeletonBlock className="h-5 w-40 rounded-md bg-stone-200" />
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="space-y-2">
              <SkeletonLine className="w-24" />
              <SkeletonBlock className="h-4 w-44 max-w-full rounded-md bg-stone-100" />
            </div>
          ))}
        </div>
      </SkeletonPanel>
      <SkeletonPanel className="rounded-xl p-5">
        <SkeletonBlock className="h-5 w-36 rounded-md bg-stone-200" />
        <div className="mt-5 space-y-4">
          <SkeletonBlock className="h-11 w-full rounded-xl bg-stone-100" />
          <SkeletonBlock className="h-24 w-full rounded-xl bg-stone-100" />
          <div className="flex justify-end">
            <SkeletonBlock className="h-10 w-36 rounded-full bg-stone-200" />
          </div>
        </div>
      </SkeletonPanel>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeaderSkeleton action="single" />
      <SkeletonPanel className="rounded-xl p-5">
        <SkeletonBlock className="h-5 w-32 rounded-md bg-stone-200" />
        <SkeletonLine className="mt-3 w-2/3 bg-stone-100" />
        <div className="mt-6">
          <FormFieldsSkeleton fields={8} />
        </div>
      </SkeletonPanel>
    </div>
  );
}

function AppointmentsSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton action="double" />
      <SkeletonPanel className="h-24 rounded-2xl p-5">
        <div className="flex items-center gap-4">
          <SkeletonBlock className="h-11 w-11 rounded-full bg-stone-100" />
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="h-4 w-52 max-w-full rounded-md bg-stone-200/80" />
            <SkeletonLine className="w-72 max-w-full bg-stone-100" />
          </div>
          <SkeletonBlock className="hidden h-9 w-28 rounded-full bg-stone-100 sm:block" />
        </div>
      </SkeletonPanel>
      <ToolbarSkeleton tabs={4} search={false} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <SkeletonPanel key={item} className="h-56 rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <SkeletonBlock className="h-5 w-32 rounded-md bg-stone-200" />
                <SkeletonLine className="w-24 bg-stone-100" />
              </div>
              <SkeletonBlock className="h-6 w-20 rounded-full bg-stone-100" />
            </div>
            <div className="mt-6 space-y-3">
              <SkeletonLine className="w-full" />
              <SkeletonLine className="w-4/5 bg-stone-100" />
            </div>
            <div className="mt-6 flex gap-2">
              <SkeletonBlock className="h-9 flex-1 rounded-full bg-stone-100" />
              <SkeletonBlock className="h-9 w-20 rounded-full bg-stone-100" />
            </div>
          </SkeletonPanel>
        ))}
      </div>
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col gap-6">
      <PageHeaderSkeleton />
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <SkeletonBlock className="h-10 w-10 rounded-xl bg-stone-100" />
            <SkeletonBlock className="h-10 w-28 rounded-xl bg-stone-100" />
            <SkeletonBlock className="h-10 w-10 rounded-xl bg-stone-100" />
          </div>
          <SkeletonBlock className="h-10 w-36 rounded-full bg-stone-200" />
        </div>
        <div className="flex-1 overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <div className="grid grid-cols-7 border-b border-stone-100 bg-stone-50/60">
            {[0, 1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="p-3">
                <SkeletonBlock className="mx-auto h-3 w-14 rounded-md bg-stone-200/70" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: 35 }, (_, item) => (
              <div key={item} className="min-h-24 border-b border-r border-stone-100 p-2">
                <SkeletonBlock className="h-5 w-5 rounded-md bg-stone-100" />
                <SkeletonBlock className="mt-3 h-4 w-full rounded-md bg-stone-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton action="single" />
      <ToolbarSkeleton tabs={4} />
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <SkeletonPanel key={item} className="h-64 rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <SkeletonBlock className="h-5 w-36 rounded-md bg-stone-200" />
                <SkeletonLine className="w-24 bg-stone-100" />
              </div>
              <SkeletonBlock className="h-6 w-20 rounded-full bg-stone-100" />
            </div>
            <div className="mt-5 space-y-3">
              <SkeletonLine className="w-full" />
              <SkeletonLine className="w-5/6 bg-stone-100" />
              <SkeletonLine className="w-2/3 bg-stone-100" />
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-stone-100 pt-4">
              <SkeletonBlock className="h-4 w-24 rounded-md bg-stone-100" />
              <SkeletonBlock className="h-8 w-20 rounded-full bg-stone-100" />
            </div>
          </SkeletonPanel>
        ))}
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeaderSkeleton />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <aside className="space-y-4 lg:col-span-4">
          <SkeletonPanel className="rounded-3xl p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <SkeletonBlock className="h-24 w-24 shrink-0 rounded-full bg-stone-200" />
              <div className="flex-1 space-y-2 pt-1">
                <SkeletonBlock className="h-5 w-32 rounded-md bg-stone-200" />
                <SkeletonLine className="w-40 max-w-full bg-stone-100" />
                <SkeletonBlock className="h-6 w-24 rounded-full bg-stone-100" />
              </div>
            </div>
          </SkeletonPanel>
          <SkeletonPanel className="rounded-3xl p-3">
            <div className="space-y-2">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl p-3">
                  <SkeletonBlock className="h-9 w-9 shrink-0 rounded-xl bg-stone-100" />
                  <div className="flex-1 space-y-2">
                    <SkeletonBlock className="h-4 w-28 rounded-md bg-stone-200/80" />
                    <SkeletonLine className="w-36 max-w-full bg-stone-100" />
                  </div>
                </div>
              ))}
            </div>
          </SkeletonPanel>
        </aside>
        <section className="min-w-0 overflow-hidden rounded-3xl border border-stone-200 bg-white lg:col-span-8">
          <div className="border-b border-stone-200 p-5 sm:p-6">
            <SkeletonBlock className="h-6 w-40 rounded-md bg-stone-200" />
            <SkeletonLine className="mt-3 w-64 max-w-full bg-stone-100" />
          </div>
          <div className="p-5 sm:p-8">
            <FormFieldsSkeleton fields={8} />
          </div>
          <div className="flex flex-col-reverse gap-3 border-t border-stone-100 bg-[#FAFAF8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <SkeletonLine className="w-48 bg-stone-200/50" />
            <div className="flex gap-2">
              <SkeletonBlock className="h-10 w-24 rounded-full bg-white" />
              <SkeletonBlock className="h-10 w-40 rounded-full bg-stone-200" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function IntakeSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <ToolbarSkeleton tabs={3} />
      <div className="space-y-4">
        {[0, 1, 2, 3].map((item) => (
          <SkeletonPanel key={item} className="rounded-2xl p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <SkeletonBlock className="h-11 w-11 shrink-0 rounded-full bg-stone-100" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <SkeletonBlock className="h-4 w-40 rounded-md bg-stone-200/80" />
                  <SkeletonBlock className="h-5 w-24 rounded-full bg-stone-100" />
                </div>
                <SkeletonLine className="w-72 max-w-full bg-stone-100" />
              </div>
              <SkeletonBlock className="h-9 w-28 rounded-full bg-stone-100" />
            </div>
          </SkeletonPanel>
        ))}
      </div>
    </div>
  );
}

function IntakeReviewSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeaderSkeleton />
      <SkeletonBlock className="h-10 w-48 rounded-lg bg-stone-100" />
      <SkeletonPanel className="rounded-xl p-5">
        <SkeletonBlock className="h-5 w-40 rounded-md bg-stone-200" />
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => (
            <div key={item} className="space-y-2">
              <SkeletonLine className="w-28" />
              <SkeletonBlock className="h-4 w-48 max-w-full rounded-md bg-stone-100" />
            </div>
          ))}
        </div>
      </SkeletonPanel>
      <SkeletonPanel className="rounded-xl p-5">
        <SkeletonBlock className="h-5 w-36 rounded-md bg-stone-200" />
        <div className="mt-5 space-y-3">
          <SkeletonBlock className="h-11 w-full rounded-xl bg-stone-100" />
          <div className="flex justify-end gap-2">
            <SkeletonBlock className="h-10 w-28 rounded-full bg-stone-100" />
            <SkeletonBlock className="h-10 w-36 rounded-full bg-stone-200" />
          </div>
        </div>
      </SkeletonPanel>
    </div>
  );
}

function PatientIntakeSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <SkeletonPanel className="rounded-3xl p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-2">
            <SkeletonBlock className="h-5 w-44 rounded-md bg-stone-200" />
            <SkeletonLine className="w-64 max-w-full bg-stone-100" />
          </div>
          <SkeletonBlock className="h-7 w-24 rounded-full bg-stone-100" />
        </div>
        <div className="mt-6 flex items-center gap-2">
          {[0, 1, 2, 3].map((item) => (
            <SkeletonBlock key={item} className="h-2 flex-1 rounded-full bg-stone-100" />
          ))}
        </div>
        <div className="mt-7 space-y-5">
          <SkeletonBlock className="h-5 w-52 rounded-md bg-stone-200" />
          <FormFieldsSkeleton fields={4} />
        </div>
        <div className="mt-6 flex justify-end">
          <SkeletonBlock className="h-11 w-36 rounded-full bg-stone-200" />
        </div>
      </SkeletonPanel>
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <SkeletonPanel className="rounded-3xl p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 border-b border-stone-200 pb-4">
          <div className="flex items-center gap-2.5">
            <SkeletonBlock className="h-9 w-9 rounded-full bg-stone-100" />
            <div className="space-y-2">
              <SkeletonBlock className="h-4 w-32 rounded-md bg-stone-200" />
              <SkeletonLine className="w-44 bg-stone-100" />
            </div>
          </div>
          <SkeletonBlock className="h-6 w-16 rounded-full bg-stone-100" />
        </div>
        <ListRowsSkeleton rows={5} />
      </SkeletonPanel>
    </div>
  );
}

function NotificationsSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <section className="overflow-hidden border-y border-stone-200 bg-white">
        {Array.from({ length: 7 }, (_, item) => (
          <div key={item} className="flex items-start gap-3 border-b border-stone-100 px-4 py-4 last:border-b-0">
            <SkeletonBlock className="h-10 w-10 shrink-0 rounded-full bg-stone-100" />
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonBlock className="h-4 w-52 max-w-full rounded-md bg-stone-200/80" />
              <SkeletonLine className="w-full max-w-xl bg-stone-100" />
              <SkeletonLine className="w-24 bg-stone-100" />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeaderSkeleton />
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <SkeletonPanel key={item} className="rounded-xl p-5">
            <div className="flex items-center justify-between">
              <SkeletonBlock className="h-4 w-28 rounded-md bg-stone-200/80" />
              <SkeletonBlock className="h-4 w-4 rounded-md bg-stone-100" />
            </div>
            <SkeletonLine className="mt-4 w-52 max-w-full bg-stone-100" />
            <SkeletonLine className="mt-2 w-64 max-w-full bg-stone-100" />
          </SkeletonPanel>
        ))}
      </div>
    </div>
  );
}

function SecuritySkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeaderSkeleton />
      {[0, 1].map((item) => (
        <SkeletonPanel key={item} className="rounded-xl p-5">
          <SkeletonBlock className="h-5 w-40 rounded-md bg-stone-200" />
          <SkeletonLine className="mt-3 w-2/3 bg-stone-100" />
          <div className="mt-5 space-y-4">
            <SkeletonBlock className="h-11 w-full rounded-xl bg-stone-100" />
            {item === 0 ? <SkeletonBlock className="h-11 w-full rounded-xl bg-stone-100" /> : null}
          </div>
        </SkeletonPanel>
      ))}
    </div>
  );
}

function AuditLogsSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeaderSkeleton />
      <SkeletonPanel className="overflow-hidden rounded-xl">
        <div className="border-b border-stone-200 bg-white p-4">
          <div className="flex gap-4">
            {[0, 1, 2, 3, 4].map((item) => (
              <SkeletonBlock key={item} className="h-3 flex-1 rounded-md bg-stone-100" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-stone-100">
          {Array.from({ length: 10 }, (_, item) => (
            <div key={item} className="flex items-center gap-4 px-4 py-3">
              <SkeletonBlock className="h-4 w-24 rounded-md bg-stone-100" />
              <SkeletonBlock className="h-6 w-28 rounded-md bg-stone-100" />
              <SkeletonBlock className="h-4 w-32 rounded-md bg-stone-100" />
              <SkeletonBlock className="h-4 flex-1 rounded-md bg-stone-100" />
            </div>
          ))}
        </div>
      </SkeletonPanel>
    </div>
  );
}

function UsersSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton action="single" />
      <SkeletonPanel className="rounded-xl p-5">
        <SkeletonBlock className="h-5 w-36 rounded-md bg-stone-200" />
        <div className="mt-5">
          <TableRowsSkeleton rows={7} columns={6} />
        </div>
      </SkeletonPanel>
    </div>
  );
}

export function RouteSkeleton({ variant }: { variant: RouteSkeletonVariant }) {
  switch (variant) {
    case 'patients':
      return <PatientsSkeleton />;
    case 'patient-detail':
      return <PatientDetailSkeleton />;
    case 'form':
      return <FormSkeleton />;
    case 'appointments':
      return <AppointmentsSkeleton />;
    case 'calendar':
      return <CalendarSkeleton />;
    case 'progress':
      return <ProgressSkeleton />;
    case 'profile':
      return <ProfileSkeleton />;
    case 'intake':
      return <IntakeSkeleton />;
    case 'intake-review':
      return <IntakeReviewSkeleton />;
    case 'patient-intake':
      return <PatientIntakeSkeleton />;
    case 'history':
      return <HistorySkeleton />;
    case 'notifications':
      return <NotificationsSkeleton />;
    case 'settings':
      return <SettingsSkeleton />;
    case 'security':
      return <SecuritySkeleton />;
    case 'audit-logs':
      return <AuditLogsSkeleton />;
    case 'users':
      return <UsersSkeleton />;
  }
}
