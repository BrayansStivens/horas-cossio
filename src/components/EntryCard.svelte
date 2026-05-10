<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import FileText from '@lucide/svelte/icons/file-text';
  import Truck from '@lucide/svelte/icons/truck';
  import LogOut from '@lucide/svelte/icons/log-out';
  import type { HoursEntry } from '../lib/supabase';
  import { formatHoras, todayISO } from '../lib/date-utils';
  import { format, parseISO } from 'date-fns';
  import { es } from 'date-fns/locale';
  import { cn } from '../lib/cn';

  let {
    entry,
    onEdit,
    onDelete,
    onMarkExitNow,
    index = 0,
  }: {
    entry: HoursEntry;
    onEdit: (e: HoursEntry) => void;
    onDelete: (e: HoursEntry) => void;
    onMarkExitNow?: (e: HoursEntry) => void;
    index?: number;
  } = $props();

  let menuOpen = $state(false);

  function toggleMenu(e: MouseEvent) {
    e.stopPropagation();
    menuOpen = !menuOpen;
  }

  let parsed = $derived(parseISO(entry.fecha));
  let day = $derived(parsed.getDate());
  let monthShort = $derived(format(parsed, 'MMM', { locale: es }));
  let isToday = $derived(entry.fecha === todayISO());
</script>

<svelte:window
  onclick={() => {
    if (menuOpen) menuOpen = false;
  }}
/>

<div
  class={cn(
    'group relative flex items-center gap-3 p-3 rounded-lg border bg-card transition-colors',
    isToday
      ? 'border-primary/50 bg-primary/[0.03] dark:bg-primary/10 hover:bg-primary/5 dark:hover:bg-primary/15'
      : 'border-border hover:bg-accent/40',
  )}
  in:fly={{ y: 8, duration: 300, delay: index * 25, easing: quintOut }}
  out:fade={{ duration: 120 }}
>
  <div
    class={cn(
      'shrink-0 w-12 h-12 flex flex-col items-center justify-center rounded-md',
      isToday
        ? 'bg-primary text-primary-foreground'
        : 'bg-secondary text-secondary-foreground',
    )}
  >
    <div class="text-base font-bold leading-none tabular-nums">{day}</div>
    <div
      class={cn(
        'text-[11px] uppercase tracking-wider mt-0.5 font-semibold',
        isToday ? 'text-primary-foreground/70' : 'text-muted-foreground',
      )}
    >
      {monthShort}
    </div>
  </div>

  <div class="flex-1 min-w-0">
    <div class="flex items-center gap-2 flex-wrap">
      {#if isToday}
        <span
          class="inline-flex items-center px-1.5 py-0.5 rounded-sm bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider"
        >
          Hoy
        </span>
      {/if}
      <span class="text-sm font-semibold tabular-nums text-foreground">
        {entry.hora_inicio.slice(0, 5)}
      </span>
      <ArrowRight class="size-3 text-muted-foreground" />
      <span class="text-sm font-semibold tabular-nums text-foreground">
        {entry.hora_final.slice(0, 5)}
      </span>
      <span
        class="ml-auto inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 dark:bg-primary/20 text-primary text-sm font-bold tabular-nums"
      >
        {formatHoras(Number(entry.total_horas))}
      </span>
    </div>

    <div class="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
      {#if entry.placa}
        <span class="inline-flex items-center gap-1">
          <Truck class="size-3" />
          <span class="font-medium tabular-nums">{entry.placa}</span>
        </span>
      {/if}
      {#if entry.manifiesto}
        <span class="inline-flex items-center gap-1">
          <FileText class="size-3" />
          <span>M-{entry.manifiesto}</span>
        </span>
      {/if}
    </div>

    {#if isToday && onMarkExitNow}
      <button
        type="button"
        onclick={(e) => {
          e.stopPropagation();
          onMarkExitNow(entry);
        }}
        class="mt-2 inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-primary/40 bg-primary/5 dark:bg-primary/15 text-primary text-sm font-semibold hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors"
      >
        <LogOut class="size-3" />
        Marcar salida ahora
      </button>
    {/if}
  </div>

  <button
    type="button"
    onclick={toggleMenu}
    aria-label="Opciones"
    class="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
  >
    <MoreHorizontal class="size-4" />
  </button>

  {#if menuOpen}
    <div
      class="absolute right-2 top-12 z-20 min-w-[140px] rounded-md border border-border bg-popover text-popover-foreground shadow-lg p-1"
      in:fly={{ y: -4, duration: 150 }}
      out:fade={{ duration: 100 }}
    >
      <button
        type="button"
        onclick={(e) => {
          e.stopPropagation();
          menuOpen = false;
          onEdit(entry);
        }}
        class="w-full flex items-center gap-2 px-2.5 py-2 rounded-sm text-sm hover:bg-accent text-left"
      >
        <Pencil class="size-3.5" />
        Editar
      </button>
      <button
        type="button"
        onclick={(e) => {
          e.stopPropagation();
          menuOpen = false;
          onDelete(entry);
        }}
        class="w-full flex items-center gap-2 px-2.5 py-2 rounded-sm text-sm text-destructive hover:bg-destructive/10 text-left"
      >
        <Trash2 class="size-3.5" />
        Eliminar
      </button>
    </div>
  {/if}
</div>
