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
  | 'archived-patients'
  | 'patient-detail'
  | 'form'
  | 'appointments'
  | 'patient-appointments'
  | 'patient-dashboard'
  | 'staff-dashboard'
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
  | 'users'
  | 'print';

function PatientCardsSkeleton({ action = 'single' }: { action?: 'none' | 'single' }) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeaderSkeleton action={action} />
      <ToolbarSkeleton tabs={2} search={false} />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SkeletonBlock className="h-10 w-full flex-1 rounded-full bg-stone-100" />
        <SkeletonBlock className="h-10 w-full rounded-full bg-stone-100 sm:w-28" />
      </div>
      <SkeletonLine className="w-52 max-w-full" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3].map((item) => (
          <SkeletonPanel key={item} className="h-56 rounded-3xl p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <SkeletonBlock className="h-11 w-11 rounded-2xl bg-stone-100" />
                <div className="space-y-2">
                  <SkeletonBlock className="h-4 w-32 rounded-md bg-stone-200" />
                  <SkeletonLine className="w-24 bg-stone-100" />
                </div>
              </div>
              <SkeletonBlock className="h-6 w-20 rounded-full bg-stone-100" />
            </div>
            <div className="mt-4 space-y-2 rounded-2xl bg-stone-50/80 p-3">
              <SkeletonLine className="w-full" />
              <SkeletonLine className="w-4/5 bg-stone-100" />
              <SkeletonLine className="w-2/3 bg-stone-100" />
            </div>
            <div className="mt-4 flex gap-2">
              <SkeletonBlock className="h-10 flex-1 rounded-full bg-stone-200/80" />
              <SkeletonBlock className="h-10 w-10 rounded-full bg-stone-100" />
            </div>
          </SkeletonPanel>
        ))}
      </div>
    </div>
  );
}

function PatientsSkeleton() {
  return <PatientCardsSkeleton action="single" />;
}

function ArchivedPatientsSkeleton() {
  return <PatientCardsSkeleton action="none" />;
}

function PrintSkeleton() {
  return (
    <div className="min-h-screen bg-stone-50 p-4 sm:p-8">
      <div className="mx-auto max-w-3xl space-y-5 rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
        <div className="flex items-start justify-between border-b border-stone-200 pb-5">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-12 w-12 rounded-xl bg-stone-200" />
            <div className="space-y-2">
              <SkeletonBlock className="h-5 w-44 rounded-md bg-stone-200" />
              <SkeletonLine className="w-56 max-w-full bg-stone-100" />
            </div>
          </div>
          <SkeletonBlock className="h-6 w-32 rounded-md bg-stone-100" />
        </div>
        <SkeletonBlock className="h-4 w-36 rounded-md bg-stone-200/80" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="space-y-2">
              <SkeletonLine className="w-24 bg-stone-100" />
              <SkeletonBlock className="h-4 w-full max-w-52 rounded-md bg-stone-100" />
            </div>
          ))}
        </div>
        <SkeletonBlock className="h-4 w-36 rounded-md bg-stone-200/80" />
        <div className="space-y-3">
          {[0, 1, 2, 3].map((item) => (
            <SkeletonLine key={item} className="w-full bg-stone-100" />
          ))}
        </div>
      </div>
    </div>
  );
}

function PatientDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
      <PageHeaderSkeleton />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <SkeletonPanel key={item} className="h-32 rounded-xl p-3.5 sm:p-5">
            <div className="flex items-center justify-between">
              <SkeletonBlock className="h-4 w-20 rounded-md bg-stone-200/80" />
              <SkeletonBlock className="h-5 w-5 rounded-md bg-stone-100" />
            </div>
            <SkeletonLine className="mt-4 w-full bg-stone-100" />
            <SkeletonLine className="mt-5 w-2/3 bg-stone-100" />
          </SkeletonPanel>
        ))}
      </div>
      <SkeletonPanel className="rounded-xl p-3.5 sm:p-5">
        <SkeletonBlock className="h-5 w-40 rounded-md bg-stone-200" />
        <div className="mt-5 grid gap-4 sm:gap-5 sm:grid-cols-2">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="space-y-2">
              <SkeletonLine className="w-24" />
              <SkeletonBlock className="h-4 w-44 max-w-full rounded-md bg-stone-100" />
            </div>
          ))}
        </div>
      </SkeletonPanel>
      <SkeletonPanel className="rounded-xl p-3.5 sm:p-5">
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
    <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
      <PageHeaderSkeleton action="single" />
      <SkeletonPanel className="rounded-xl p-3.5 sm:p-5">
        <SkeletonBlock className="h-5 w-32 rounded-md bg-stone-200" />
        <SkeletonLine className="mt-3 w-2/3 bg-stone-100" />
        <div className="mt-6">
          <FormFieldsSkeleton fields={8} />
        </div>
      </SkeletonPanel>
    </div>
  );
}

function PatientAppointmentsSkeleton() {
  return (
    <div className="space-y-4 pb-6 sm:space-y-5">
      <PageHeaderSkeleton />

      {/* Calendar & slot area (no outer card — matches the live layout) */}
      <div className="space-y-4 sm:space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2 sm:max-w-md">
            <SkeletonBlock className="h-4 w-40 bg-stone-200/80" />
            <SkeletonLine className="w-full max-w-sm" />
          </div>
          <div className="flex w-full items-center gap-1 rounded-full border border-stone-200 bg-white p-1 sm:w-auto">
            <SkeletonBlock className="h-9 w-9 rounded-full bg-stone-100 sm:h-10 sm:w-10" />
            <SkeletonBlock className="h-4 flex-1 bg-stone-200/70 sm:w-24 sm:flex-none" />
            <SkeletonBlock className="h-9 w-9 rounded-full bg-stone-100 sm:h-10 sm:w-10" />
            <SkeletonBlock className="ml-0.5 h-9 w-16 rounded-full bg-[#181700]/15 sm:h-10" />
          </div>
        </div>

        <div>
          <div className="mx-auto grid w-full max-w-[460px] grid-cols-7 text-center sm:max-w-[560px] lg:max-w-none">
            {Array.from({ length: 7 }).map((_, index) => (
              <SkeletonBlock key={index} className="mx-auto h-3 w-8 rounded-md bg-stone-200/60" />
            ))}
          </div>
          <div className="mx-auto mt-2 grid w-full max-w-[460px] grid-cols-7 gap-1.5 sm:max-w-[560px] sm:gap-2 lg:max-w-none lg:gap-2.5">
            {Array.from({ length: 35 }).map((_, index) => (
              <SkeletonBlock
                key={index}
                className="min-h-[58px] rounded-xl border border-stone-200/70 bg-stone-100 lg:min-h-[76px]"
              />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-stone-100 pt-3">
            {[0, 1, 2, 3].map((item) => (
              <SkeletonLine key={item} className="h-2.5 w-24 bg-stone-200/60" />
            ))}
          </div>
        </div>
      </div>

      {/* Daftar sesi */}
      <div className="space-y-4">
        <div className="space-y-2">
          <SkeletonBlock className="h-5 w-32 bg-stone-200/80" />
          <SkeletonLine className="w-72 max-w-full" />
        </div>
        <SkeletonPanel className="rounded-3xl p-3.5 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <SkeletonBlock className="h-4 w-4 rounded-md bg-stone-200/80" />
              <SkeletonBlock className="h-4 w-32 bg-stone-200/80" />
            </div>
            <SkeletonLine className="w-14 bg-stone-200/60" />
          </div>
          <div className="mt-2 divide-y divide-stone-100">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="flex flex-col gap-2.5 py-3.5 first:pt-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <SkeletonBlock className="h-4 w-48 max-w-full bg-stone-200/70" />
                  <SkeletonLine className="w-32" />
                  <SkeletonLine className="w-28 bg-stone-100" />
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <SkeletonBlock className="h-8 w-20 rounded-full bg-stone-100" />
                  <SkeletonBlock className="h-9 w-20 rounded-full bg-stone-100" />
                </div>
              </div>
            ))}
          </div>
        </SkeletonPanel>
      </div>
    </div>
  );
}

function PatientDashboardSkeleton() {
  return (
    <div className="w-full space-y-4 pb-8 sm:space-y-5">
      <header className="border-b border-stone-200/90 pb-4 pt-3 sm:pb-6 sm:pt-4">
        <SkeletonBlock className="h-5 w-40 rounded-full bg-stone-100 sm:hidden" />
        <SkeletonBlock className="mt-2 h-8 w-52 rounded-lg bg-stone-200" />
        <SkeletonLine className="mt-2 w-full max-w-xl" />
        <SkeletonLine className="mt-1.5 w-3/4 max-w-md bg-stone-100" />
      </header>

      <section aria-hidden="true">
        <SkeletonPanel className="rounded-3xl p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <SkeletonBlock className="h-3 w-24 bg-stone-200/80" />
              <SkeletonBlock className="h-5 w-48 bg-stone-200/70" />
            </div>
            <SkeletonBlock className="h-7 w-28 rounded-full bg-stone-100" />
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2.5 rounded-xl border border-stone-200 bg-white px-3 py-2.5"
              >
                <SkeletonBlock className="h-9 w-9 shrink-0 rounded-full bg-stone-100" />
                <div className="min-w-0 flex-1 space-y-2">
                  <SkeletonBlock className="h-3.5 w-32 max-w-full bg-stone-200/70" />
                  <SkeletonLine className="w-20 bg-stone-100" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-3 border-t border-stone-100 pt-4">
            <SkeletonBlock className="h-3 w-28 bg-stone-200/70" />
            <div className="flex gap-2 overflow-hidden">
              {[0, 1, 2, 3, 4].map((item) => (
                <SkeletonBlock key={item} className="h-14 w-16 shrink-0 rounded-xl bg-stone-100" />
              ))}
            </div>
            <SkeletonBlock className="h-11 w-full rounded-full bg-stone-200/80" />
          </div>
        </SkeletonPanel>
      </section>

      <section aria-hidden="true">
        <SkeletonPanel className="rounded-3xl p-4 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <SkeletonBlock className="h-3 w-24 bg-stone-200/80" />
              <SkeletonBlock className="h-5 w-52 max-w-full bg-stone-200/70" />
            </div>
            <SkeletonLine className="w-36 bg-stone-200/60" />
          </div>
          <SkeletonBlock className="mt-4 h-28 w-full rounded-2xl bg-stone-100" />
        </SkeletonPanel>
      </section>
    </div>
  );
}

function StaffDashboardSkeleton() {
  return (
    <div className="space-y-4 pt-3 sm:space-y-5 sm:pt-4">
      <div className="space-y-2">
        <SkeletonBlock className="h-5 w-36 rounded-full bg-stone-100" />
        <SkeletonBlock className="h-8 w-44 rounded-lg bg-stone-200" />
        <SkeletonLine className="w-64 max-w-full" />
      </div>

      <div className="flex gap-3 overflow-hidden py-1 sm:grid sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <SkeletonPanel
            key={item}
            className="flex min-h-44 min-w-[220px] shrink-0 flex-col p-4 sm:min-w-0"
          >
            <SkeletonBlock className="h-3 w-20 bg-stone-200/80" />
            <SkeletonBlock className="mt-3 h-6 w-32 bg-stone-200/70" />
            <SkeletonLine className="mt-3 w-full" />
            <SkeletonLine className="mt-1.5 w-2/3" />
            <SkeletonBlock className="mt-4 h-9 w-full rounded-full bg-stone-100" />
          </SkeletonPanel>
        ))}
      </div>

      <SkeletonPanel className="rounded-3xl p-4 sm:p-5">
        <SkeletonBlock className="h-3 w-20 bg-stone-200/80" />
        <SkeletonBlock className="mt-2 h-5 w-40 bg-stone-200/70" />
        <div className="mt-4 grid grid-cols-7 gap-1.5 sm:gap-2">
          {Array.from({ length: 35 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-12 rounded-xl bg-stone-100" />
          ))}
        </div>
      </SkeletonPanel>

      <div className="grid gap-4 lg:grid-cols-12">
        <SkeletonPanel className="h-56 rounded-3xl p-4 sm:p-5 lg:col-span-8">
          <SkeletonBlock className="h-3 w-24 bg-stone-200/80" />
          <SkeletonBlock className="mt-2 h-5 w-48 bg-stone-200/70" />
          <SkeletonLine className="mt-4 w-full" />
          <SkeletonLine className="mt-2 w-4/5" />
        </SkeletonPanel>
        <SkeletonPanel className="h-56 rounded-3xl p-4 sm:p-5 lg:col-span-4">
          <SkeletonBlock className="h-3 w-24 bg-stone-200/80" />
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[0, 1, 2].map((item) => (
              <SkeletonBlock key={item} className="h-14 rounded-2xl bg-stone-100" />
            ))}
          </div>
        </SkeletonPanel>
      </div>
    </div>
  );
}

function AppointmentsSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeaderSkeleton action="double" />
      <SkeletonPanel className="h-24 rounded-2xl p-3.5 sm:p-5">
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
          <SkeletonPanel key={item} className="h-56 rounded-2xl p-3.5 sm:p-5">
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
    <div className="flex min-h-[calc(100vh-64px)] flex-col gap-4 sm:gap-6">
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
    <div className="space-y-4 sm:space-y-6">
      <PageHeaderSkeleton action="single" />
      <ToolbarSkeleton tabs={4} />
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <SkeletonPanel key={item} className="h-64 rounded-2xl p-3.5 sm:p-5">
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
    <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
      <PageHeaderSkeleton />
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12">
        <aside className="space-y-4 lg:col-span-4">
          <SkeletonPanel className="rounded-3xl p-4 sm:p-5">
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
          <div className="border-b border-stone-200 p-4 sm:p-5">
            <SkeletonBlock className="h-6 w-40 rounded-md bg-stone-200" />
            <SkeletonLine className="mt-3 w-64 max-w-full bg-stone-100" />
          </div>
          <div className="p-3.5 sm:p-8">
            <FormFieldsSkeleton fields={8} />
          </div>
          <div className="flex flex-col-reverse gap-3 border-t border-stone-100 bg-[#FAFAF8] px-4 sm:px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
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
    <div className="space-y-4 sm:space-y-6">
      <PageHeaderSkeleton />
      <ToolbarSkeleton tabs={3} />
      <div className="space-y-4">
        {[0, 1, 2, 3].map((item) => (
          <SkeletonPanel key={item} className="rounded-2xl p-3.5 sm:p-5">
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
    <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
      <PageHeaderSkeleton />
      <SkeletonBlock className="h-10 w-48 rounded-lg bg-stone-100" />
      <SkeletonPanel className="rounded-xl p-3.5 sm:p-5">
        <SkeletonBlock className="h-5 w-40 rounded-md bg-stone-200" />
        <div className="mt-5 grid gap-4 sm:gap-5 sm:grid-cols-2">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => (
            <div key={item} className="space-y-2">
              <SkeletonLine className="w-28" />
              <SkeletonBlock className="h-4 w-48 max-w-full rounded-md bg-stone-100" />
            </div>
          ))}
        </div>
      </SkeletonPanel>
      <SkeletonPanel className="rounded-xl p-3.5 sm:p-5">
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
    <div className="space-y-4 sm:space-y-6">
      <PageHeaderSkeleton />
      <SkeletonPanel className="rounded-3xl p-4 sm:p-5">
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
        <div className="mt-7 space-y-4 sm:space-y-5">
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
    <div className="space-y-4 sm:space-y-6">
      <PageHeaderSkeleton />
      <SkeletonPanel className="rounded-3xl p-4 sm:p-5">
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
    <div className="space-y-4 sm:space-y-6">
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
    <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
      <PageHeaderSkeleton />
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <SkeletonPanel key={item} className="rounded-xl p-3.5 sm:p-5">
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
    <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
      <PageHeaderSkeleton />
      {[0, 1].map((item) => (
        <SkeletonPanel key={item} className="rounded-xl p-3.5 sm:p-5">
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
    <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
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
    <div className="space-y-4 sm:space-y-6">
      <PageHeaderSkeleton action="single" />
      <SkeletonPanel className="rounded-xl p-3.5 sm:p-5">
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
    case 'archived-patients':
      return <ArchivedPatientsSkeleton />;
    case 'patient-detail':
      return <PatientDetailSkeleton />;
    case 'form':
      return <FormSkeleton />;
    case 'appointments':
      return <AppointmentsSkeleton />;
    case 'patient-appointments':
      return <PatientAppointmentsSkeleton />;
    case 'patient-dashboard':
      return <PatientDashboardSkeleton />;
    case 'staff-dashboard':
      return <StaffDashboardSkeleton />;
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
    case 'print':
      return <PrintSkeleton />;
  }
}
