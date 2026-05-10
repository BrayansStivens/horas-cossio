<script lang="ts">
  import { onMount, tick } from 'svelte';
  import Clock from '@lucide/svelte/icons/clock';
  import Popover from './Popover.svelte';
  import { cn } from '../../lib/cn';

  type Props = {
    /** Time in HH:MM format */
    value: string;
    onChange: (hhmm: string) => void;
    placeholder?: string;
    class?: string;
    disabled?: boolean;
    /** Minute step (default 5) */
    minuteStep?: number;
  };

  let {
    value = $bindable(''),
    onChange,
    placeholder = '--:--',
    class: className = '',
    disabled = false,
    minuteStep = 5,
  }: Props = $props();

  let open = $state(false);
  let hourCol: HTMLDivElement | null = $state(null);
  let minuteCol: HTMLDivElement | null = $state(null);

  let hours = Array.from({ length: 24 }, (_, i) => i);
  let minutes = Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) => i * minuteStep);

  let currentHour = $derived(value ? parseInt(value.split(':')[0], 10) : null);
  let currentMinute = $derived(
    value
      ? roundToStep(parseInt(value.split(':')[1] ?? '0', 10), minuteStep)
      : null,
  );

  function roundToStep(n: number, step: number): number {
    return Math.round(n / step) * step;
  }

  function pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  function setHour(h: number) {
    const m = currentMinute ?? 0;
    onChange(`${pad(h)}:${pad(m)}`);
  }

  function setMinute(m: number) {
    const h = currentHour ?? new Date().getHours();
    onChange(`${pad(h)}:${pad(m)}`);
  }

  async function scrollToSelected() {
    await tick();
    if (hourCol) {
      const h = currentHour ?? new Date().getHours();
      const el = hourCol.querySelector<HTMLElement>(`[data-h="${h}"]`);
      el?.scrollIntoView({ block: 'center', behavior: 'auto' });
    }
    if (minuteCol) {
      const m = currentMinute ?? 0;
      const el = minuteCol.querySelector<HTMLElement>(`[data-m="${m}"]`);
      el?.scrollIntoView({ block: 'center', behavior: 'auto' });
    }
  }

  $effect(() => {
    if (open) {
      scrollToSelected();
    }
  });

  function quickNow() {
    const now = new Date();
    onChange(`${pad(now.getHours())}:${pad(roundToStep(now.getMinutes(), minuteStep))}`);
    open = false;
  }
</script>

<Popover bind:open contentClass="p-0 overflow-hidden" align="start">
  {#snippet trigger()}
    <button
      type="button"
      {disabled}
      class={cn(
        'inline-flex h-11 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-base',
        'hover:bg-accent hover:text-accent-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'transition-colors',
        !value && 'text-muted-foreground',
        className,
      )}
    >
      <span class="flex items-center gap-2 truncate">
        <Clock class="size-4 shrink-0 text-muted-foreground" />
        <span class="font-medium tabular-nums">{value || placeholder}</span>
      </span>
    </button>
  {/snippet}

  <div class="flex flex-col">
    <div class="flex">
      <div class="flex flex-col items-center px-2 pt-2">
        <div class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pb-1.5">
          Hora
        </div>
        <div
          bind:this={hourCol}
          class="h-48 w-14 overflow-y-auto snap-y snap-mandatory scrollbar-thin"
          style="scroll-padding-block: 80px"
        >
          <div class="py-20 flex flex-col items-center gap-0.5">
            {#each hours as h}
              <button
                type="button"
                data-h={h}
                onclick={() => setHour(h)}
                class={cn(
                  'snap-center w-10 h-9 inline-flex items-center justify-center rounded-md text-sm font-medium tabular-nums',
                  'transition-colors',
                  currentHour === h
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                {pad(h)}
              </button>
            {/each}
          </div>
        </div>
      </div>
      <div class="flex items-center pt-7">
        <span class="text-xl font-bold text-muted-foreground">:</span>
      </div>
      <div class="flex flex-col items-center px-2 pt-2">
        <div class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pb-1.5">
          Min
        </div>
        <div
          bind:this={minuteCol}
          class="h-48 w-14 overflow-y-auto snap-y snap-mandatory scrollbar-thin"
          style="scroll-padding-block: 80px"
        >
          <div class="py-20 flex flex-col items-center gap-0.5">
            {#each minutes as m}
              <button
                type="button"
                data-m={m}
                onclick={() => setMinute(m)}
                class={cn(
                  'snap-center w-10 h-9 inline-flex items-center justify-center rounded-md text-sm font-medium tabular-nums',
                  'transition-colors',
                  currentMinute === m
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                {pad(m)}
              </button>
            {/each}
          </div>
        </div>
      </div>
    </div>
    <div class="flex border-t border-border">
      <button
        type="button"
        onclick={quickNow}
        class="flex-1 py-2.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
      >
        Ahora
      </button>
      <div class="w-px bg-border"></div>
      <button
        type="button"
        onclick={() => (open = false)}
        class="flex-1 py-2.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
      >
        Listo
      </button>
    </div>
  </div>
</Popover>

<style>
  :global(.scrollbar-thin)::-webkit-scrollbar {
    width: 4px;
  }
  :global(.scrollbar-thin)::-webkit-scrollbar-thumb {
    background: hsl(var(--border));
    border-radius: 2px;
  }
</style>
