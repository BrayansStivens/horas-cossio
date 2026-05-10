<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { format, parseISO, endOfMonth, addMonths } from 'date-fns';
  import { es } from 'date-fns/locale';
  import CalendarDays from '@lucide/svelte/icons/calendar-days';
  import History from '@lucide/svelte/icons/history';
  import Calendar from '@lucide/svelte/icons/calendar';
  import Sliders from '@lucide/svelte/icons/sliders-horizontal';
  import ChevronLeft from '@lucide/svelte/icons/chevron-left';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import Download from '@lucide/svelte/icons/download';
  import Check from '@lucide/svelte/icons/check';
  import FileSpreadsheet from '@lucide/svelte/icons/file-spreadsheet';
  import FileText from '@lucide/svelte/icons/file-text';
  import { entries } from '../lib/store';
  import {
    downloadXLSX,
    periodFilename,
    type ExportBlock,
  } from '../lib/excel';
  import { downloadPDF } from '../lib/pdf';
  import { formatHoras, isInQuincena, getQuincenas } from '../lib/date-utils';
  import Sheet from './ui/Sheet.svelte';
  import Button from './ui/Button.svelte';
  import Label from './ui/Label.svelte';
  import DatePicker from './ui/DatePicker.svelte';
  import { cn } from '../lib/cn';

  let { open, onClose }: { open: boolean; onClose: () => void } = $props();

  type Mode = 'current' | 'previous' | 'month' | 'custom';
  type FormatKind = 'xlsx' | 'pdf';
  let mode = $state<Mode>('current');
  let formatKind = $state<FormatKind>('xlsx');
  let monthOffset = $state(0);
  let customStart = $state('');
  let customEnd = $state('');
  let exporting = $state(false);
  let success = $state(false);
  let error = $state<string | null>(null);

  $effect(() => {
    if (open) {
      mode = 'current';
      formatKind = 'xlsx';
      monthOffset = 0;
      success = false;
      error = null;
    }
  });

  function getReferenceMonth(): Date {
    return addMonths(new Date(), monthOffset);
  }

  function rangeLabelFor(key: string): string {
    const half = key.endsWith('Q1') ? '01-15' : '16-30';
    const [y, m] = key.split('-');
    const monthName = format(
      new Date(Number(y), Number(m) - 1, 1),
      'MMMM yyyy',
      { locale: es },
    ).toUpperCase();
    return `(${half} ${monthName})`;
  }

  let selection = $derived.by(() => {
    const now = new Date();
    if (mode === 'current') {
      const [q1, q2] = getQuincenas(now.getFullYear(), now.getMonth());
      const current = now.getDate() <= 15 ? q1 : q2;
      const filtered = $entries.filter((e) => isInQuincena(e.fecha, current));
      return {
        title: 'Quincena actual',
        subtitle: current.label,
        blocks: [
          {
            label: current.label,
            rangeLabel: rangeLabelFor(current.key),
            entries: filtered,
          },
        ],
        documentDate: current.end,
        filename: periodFilename(current.label),
      };
    }
    if (mode === 'previous') {
      const [q1] = getQuincenas(now.getFullYear(), now.getMonth());
      const today = now.getDate();
      let prev = today <= 15 ? null : q1;
      if (!prev) {
        const prevMonth = addMonths(now, -1);
        const [, q2prev] = getQuincenas(
          prevMonth.getFullYear(),
          prevMonth.getMonth(),
        );
        prev = q2prev;
      }
      const filtered = $entries.filter((e) => isInQuincena(e.fecha, prev!));
      return {
        title: 'Quincena pasada',
        subtitle: prev.label,
        blocks: [
          {
            label: prev.label,
            rangeLabel: rangeLabelFor(prev.key),
            entries: filtered,
          },
        ],
        documentDate: prev.end,
        filename: periodFilename(prev.label),
      };
    }
    if (mode === 'month') {
      const ref = getReferenceMonth();
      const [q1, q2] = getQuincenas(ref.getFullYear(), ref.getMonth());
      const monthLabel = format(ref, 'MMMM yyyy', { locale: es });
      return {
        title: 'Mes completo',
        subtitle: monthLabel,
        blocks: [
          {
            label: q1.label,
            rangeLabel: rangeLabelFor(q1.key),
            entries: $entries.filter((e) => isInQuincena(e.fecha, q1)),
          },
          {
            label: q2.label,
            rangeLabel: rangeLabelFor(q2.key),
            entries: $entries.filter((e) => isInQuincena(e.fecha, q2)),
          },
        ],
        documentDate: endOfMonth(ref),
        filename: periodFilename(`mes-${monthLabel}`),
      };
    }
    if (customStart && customEnd) {
      const startD = parseISO(customStart);
      const endD = parseISO(customEnd);
      const filtered = $entries.filter((e) => {
        const d = parseISO(e.fecha);
        return d >= startD && d <= endD;
      });
      const label = `${format(startD, 'd MMM', { locale: es })} - ${format(endD, 'd MMM yyyy', { locale: es })}`;
      return {
        title: 'Rango personalizado',
        subtitle: label,
        blocks: [
          {
            label,
            rangeLabel: `(${format(startD, 'dd/MM')} - ${format(endD, 'dd/MM')})`,
            entries: filtered,
          },
        ],
        documentDate: endD,
        filename: periodFilename(`rango-${label}`),
      };
    }
    return null;
  });

  let countSelected = $derived(
    selection ? selection.blocks.reduce((a, b) => a + b.entries.length, 0) : 0,
  );

  let totalSelected = $derived(
    selection
      ? selection.blocks.reduce(
          (acc, b) =>
            acc + b.entries.reduce((s, e) => s + Number(e.total_horas), 0),
          0,
        )
      : 0,
  );

  async function handleExport() {
    if (!selection || exporting) return;
    exporting = true;
    error = null;
    try {
      const payload = {
        filename: selection.filename,
        documentDate: selection.documentDate,
        blocks: selection.blocks as ExportBlock[],
      };
      if (formatKind === 'pdf') {
        await downloadPDF(payload);
      } else {
        await downloadXLSX(payload);
      }
      success = true;
      setTimeout(() => {
        success = false;
        onClose();
      }, 1200);
    } catch (err: any) {
      error = err?.message ?? 'Error al exportar';
    } finally {
      exporting = false;
    }
  }

  const options: { id: Mode; label: string; Icon: any }[] = [
    { id: 'current', label: 'Quincena actual', Icon: CalendarDays },
    { id: 'previous', label: 'Quincena pasada', Icon: History },
    { id: 'month', label: 'Mes completo', Icon: Calendar },
    { id: 'custom', label: 'Rango', Icon: Sliders },
  ];
</script>

<Sheet
  bind:open
  onOpenChange={(v) => !v && onClose()}
  title="Exportar"
  description="Elige el período y el formato del archivo F-TH-16"
>
  <div class="grid grid-cols-2 gap-2">
    {#each options as opt}
      <button
        type="button"
        onclick={() => (mode = opt.id)}
        class={cn(
          'flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border transition-all',
          mode === opt.id
            ? 'border-primary bg-primary/5 dark:bg-primary/10 text-foreground'
            : 'border-border bg-background hover:bg-accent text-muted-foreground hover:text-foreground',
        )}
      >
        <opt.Icon class="size-4" />
        <span class="text-xs font-medium">{opt.label}</span>
      </button>
    {/each}
  </div>

  {#if mode === 'month'}
    <div
      class="flex items-center justify-between p-2 rounded-lg border border-border"
      in:fade={{ duration: 200 }}
    >
      <Button
        variant="ghost"
        size="icon"
        onclick={() => monthOffset--}
        aria-label="Mes anterior"
      >
        <ChevronLeft />
      </Button>
      <span class="text-sm font-semibold capitalize tabular-nums">
        {format(getReferenceMonth(), 'MMMM yyyy', { locale: es })}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onclick={() => monthOffset++}
        disabled={monthOffset >= 0}
        aria-label="Mes siguiente"
      >
        <ChevronRight />
      </Button>
    </div>
  {/if}

  {#if mode === 'custom'}
    <div class="grid grid-cols-2 gap-3" in:fade={{ duration: 200 }}>
      <div class="flex flex-col gap-1.5">
        <Label for="start-date">Desde</Label>
        <DatePicker value={customStart} onChange={(v) => (customStart = v)} />
      </div>
      <div class="flex flex-col gap-1.5">
        <Label for="end-date">Hasta</Label>
        <DatePicker value={customEnd} onChange={(v) => (customEnd = v)} />
      </div>
    </div>
  {/if}

  <div class="flex flex-col gap-2">
    <Label>Formato</Label>
    <div class="grid grid-cols-2 gap-2">
      <button
        type="button"
        onclick={() => (formatKind = 'xlsx')}
        class={cn(
          'flex items-center gap-2.5 p-3 rounded-lg border transition-all text-left',
          formatKind === 'xlsx'
            ? 'border-primary bg-primary/5 dark:bg-primary/10'
            : 'border-border bg-background hover:bg-accent',
        )}
      >
        <div class="w-9 h-9 shrink-0 rounded-md bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
          <FileSpreadsheet class="size-5" />
        </div>
        <div class="flex flex-col min-w-0">
          <span class="text-sm font-semibold text-foreground">Excel</span>
          <span class="text-[11px] text-muted-foreground">.xlsx editable</span>
        </div>
      </button>
      <button
        type="button"
        onclick={() => (formatKind = 'pdf')}
        class={cn(
          'flex items-center gap-2.5 p-3 rounded-lg border transition-all text-left',
          formatKind === 'pdf'
            ? 'border-primary bg-primary/5 dark:bg-primary/10'
            : 'border-border bg-background hover:bg-accent',
        )}
      >
        <div class="w-9 h-9 shrink-0 rounded-md bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 flex items-center justify-center">
          <FileText class="size-5" />
        </div>
        <div class="flex flex-col min-w-0">
          <span class="text-sm font-semibold text-foreground">PDF</span>
          <span class="text-[11px] text-muted-foreground">listo p/ imprimir</span>
        </div>
      </button>
    </div>
  </div>

  {#if selection}
    <div
      class="rounded-lg border border-border bg-secondary/30 p-4"
      in:fly={{ y: 6, duration: 250 }}
    >
      <div class="flex items-baseline justify-between flex-wrap gap-2 mb-3">
        <span class="text-sm font-semibold text-foreground">{selection.title}</span>
        <span class="text-xs text-muted-foreground capitalize">
          {selection.subtitle}
        </span>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col">
          <span class="text-2xl font-bold tabular-nums text-foreground">
            {countSelected}
          </span>
          <span class="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            registros
          </span>
        </div>
        <div class="flex flex-col border-l border-border pl-4">
          <span class="text-2xl font-bold tabular-nums text-primary">
            {formatHoras(totalSelected)}
          </span>
          <span class="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            total
          </span>
        </div>
      </div>
    </div>
  {/if}

  {#if error}
    <p class="text-sm text-destructive">{error}</p>
  {/if}

  {#snippet footer()}
    {#if success}
      <Button variant="default" class="w-full bg-emerald-600 hover:bg-emerald-700">
        <Check />
        Descargado
      </Button>
    {:else}
      <Button
        onclick={handleExport}
        loading={exporting}
        disabled={exporting || !selection || countSelected === 0}
        class="w-full"
        size="lg"
      >
        {#if !exporting}
          <Download />
        {/if}
        {exporting
          ? 'Generando...'
          : `Descargar ${formatKind === 'pdf' ? 'PDF' : 'XLSX'}`}
      </Button>
    {/if}
  {/snippet}
</Sheet>
