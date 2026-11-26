'use client';

import { Menu } from '@base-ui/react/menu';
import { Check, ChevronDown, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ANATOMY_SYSTEMS,
  type AnatomySystemKey,
  type AnatomyViewKey,
} from '@/components/patient/body-anatomy-atlas';

export function AnatomySystemMenu({
  system,
  view,
  container,
  onSelectSystem,
  onToggleView,
}: {
  system: AnatomySystemKey;
  view: AnatomyViewKey;
  container?: HTMLElement | null;
  onSelectSystem: (value: AnatomySystemKey) => void;
  onToggleView: () => void;
}) {
  const systemEntry = ANATOMY_SYSTEMS.find((item) => item.key === system);

  return (
    <div className="absolute left-3 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-1 rounded-full border border-border bg-popover p-1 shadow-sm">
      <Menu.Root modal={false}>
        <Menu.Trigger
          aria-label={`Sistem anatomi: ${systemEntry?.label ?? ''}`}
          title={`Sistem anatomi: ${systemEntry?.label ?? ''}`}
          className="tap-target inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35 data-popup-open:bg-accent"
        >
          <Layers aria-hidden="true" className="h-3.5 w-3.5 text-[var(--hafta-300)]" />
        </Menu.Trigger>

        <Menu.Portal container={container ?? undefined}>
          <Menu.Positioner
            side="right"
            align="start"
            sideOffset={8}
            collisionPadding={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="z-[54] outline-none"
          >
            <Menu.Popup
              data-slot="dropdown-menu-content"
              className="max-w-[min(240px,var(--available-height))] min-w-[148px] overflow-y-auto rounded-2xl bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 duration-100"
            >
              <Menu.RadioGroup value={system} onValueChange={(value) => onSelectSystem(value as AnatomySystemKey)}>
                {ANATOMY_SYSTEMS.map((item) => (
                  <Menu.RadioItem
                    key={item.key}
                    value={item.key}
                    className="flex cursor-pointer items-center gap-2 rounded-xl px-1.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent data-popup-open:bg-accent data-disabled:opacity-50"
                  >
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    <Menu.RadioItemIndicator>
                      <Check className="h-3.5 w-3.5 shrink-0 text-[var(--hafta-300)]" />
                    </Menu.RadioItemIndicator>
                  </Menu.RadioItem>
                ))}
              </Menu.RadioGroup>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <button
        type="button"
        disabled={!systemEntry?.posterior}
        aria-label={`Tampakan ${view === 'anterior' ? 'depan' : 'belakang'} — ganti tampakan`}
        title={systemEntry?.posterior ? 'Ganti tampakan depan/belakang' : 'Tampakan belakang tidak tersedia'}
        aria-pressed={view === 'posterior'}
        onClick={onToggleView}
        className={cn(
          'tap-target inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--hafta-300)]/35 disabled:cursor-not-allowed disabled:opacity-40',
          view === 'posterior' ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        <svg
          aria-hidden="true"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5"
        >
          <path d="m8 3 4 9-4 9" />
          <path d="M4 7h16" />
          <path d="m20 7-4 9 4 9" />
        </svg>
      </button>
    </div>
  );
}
