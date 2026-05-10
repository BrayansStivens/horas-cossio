<script lang="ts">
  import { parseDate, type DateValue } from '@internationalized/date';
  import CalendarIcon from '@lucide/svelte/icons/calendar';
  import { format } from 'date-fns';
  import { es } from 'date-fns/locale';
  import Calendar from './Calendar.svelte';
  import Popover from './Popover.svelte';
  import { cn } from '../../lib/cn';

  type Props = {
    /** ISO date string (yyyy-MM-dd) */
    value: string;
    onChange: (iso: string) => void;
    placeholder?: string;
    class?: string;
    disabled?: boolean;
  };

  let {
    value = $bindable(''),
    onChange,
    placeholder = 'Selecciona una fecha',
    class: className = '',
    disabled = false,
  }: Props = $props();

  let open = $state(false);

  let dateValue = $derived(value ? safeParse(value) : undefined);

  function safeParse(iso: string): DateValue | undefined {
    try {
      return parseDate(iso);
    } catch {
      return undefined;
    }
  }

  function toISO(d: DateValue): string {
    return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
  }

  function handleChange(v: DateValue | undefined) {
    if (v) {
      const iso = toISO(v);
      onChange(iso);
      open = false;
    }
  }

  let label = $derived(
    value
      ? format(new Date(value + 'T00:00:00'), "EEE d 'de' MMMM, yyyy", {
          locale: es,
        })
      : '',
  );
</script>

<Popover bind:open contentClass="p-3" align="start">
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
        <CalendarIcon class="size-4 shrink-0 text-muted-foreground" />
        <span class="truncate capitalize">{value ? label : placeholder}</span>
      </span>
    </button>
  {/snippet}

  <Calendar value={dateValue} onValueChange={handleChange} />
</Popover>
