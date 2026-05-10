<script lang="ts">
  import { fade } from 'svelte/transition';
  import { tick } from 'svelte';
  import {
    todayISO,
    computeTotalHoras,
    formatHoras,
  } from '../lib/date-utils';
  import type { HoursEntry, NewHoursEntry } from '../lib/supabase';
  import { addEntry, updateEntry, placaSuggestions } from '../lib/store';
  import { USER_INFO, DEFAULTS } from '../lib/constants';
  import Sheet from './ui/Sheet.svelte';
  import Button from './ui/Button.svelte';
  import Input from './ui/Input.svelte';
  import Label from './ui/Label.svelte';
  import DatePicker from './ui/DatePicker.svelte';
  import TimePicker from './ui/TimePicker.svelte';
  import { format, parseISO } from 'date-fns';
  import { es } from 'date-fns/locale';

  let {
    open,
    onClose,
    userId,
    editing = null,
  }: {
    open: boolean;
    onClose: () => void;
    userId: string;
    editing?: HoursEntry | null;
  } = $props();

  let fecha = $state(todayISO());
  let horaInicio = $state('');
  let horaFinal = $state('');
  let manifiesto = $state('');
  let conductor = $state(USER_INFO.conductorDefault);
  let placa = $state('');
  let saving = $state(false);
  let error = $state<string | null>(null);

  let totalHoras = $derived(computeTotalHoras(horaInicio, horaFinal));

  $effect(() => {
    if (open) {
      if (editing) {
        fecha = editing.fecha;
        horaInicio = editing.hora_inicio.slice(0, 5);
        horaFinal = editing.hora_final.slice(0, 5);
        manifiesto = editing.manifiesto ?? '';
        conductor = editing.conductor || USER_INFO.conductorDefault;
        placa = editing.placa ?? '';
      } else {
        fecha = todayISO();
        horaInicio = DEFAULTS.horaInicio;
        horaFinal = DEFAULTS.horaFinal;
        manifiesto = DEFAULTS.manifiesto;
        conductor = USER_INFO.conductorDefault;
        placa = DEFAULTS.placa;
      }
      error = null;
    }
  });

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (saving) return;
    if (!horaInicio || !horaFinal) {
      error = 'Selecciona hora de inicio y final';
      return;
    }
    if (totalHoras <= 0) {
      error = 'La hora final debe ser después de la inicial';
      return;
    }
    saving = true;
    error = null;
    try {
      const payload: NewHoursEntry = {
        fecha,
        hora_inicio: horaInicio,
        hora_final: horaFinal,
        total_horas: totalHoras,
        manifiesto: manifiesto.trim() || null,
        conductor: conductor.trim() || USER_INFO.conductorDefault,
        placa: placa.trim() || null,
      };
      if (editing) {
        await updateEntry(editing.id, payload);
      } else {
        await addEntry(payload, userId);
      }
      onClose();
    } catch (err: any) {
      error = err?.message ?? 'Error al guardar';
    } finally {
      saving = false;
    }
  }

  function pickPlaca(p: string) {
    placa = p;
  }

  let fechaPretty = $derived(
    fecha ? format(parseISO(fecha), "EEE d MMM", { locale: es }) : '',
  );
</script>

<Sheet
  bind:open
  onOpenChange={(v) => !v && onClose()}
  title={editing ? 'Editar entrada' : 'Nueva entrada'}
  description={editing ? 'Actualiza los datos del turno' : 'Registra tu turno de horas extras'}
>
  <form onsubmit={handleSubmit} class="flex flex-col gap-4" id="entry-form">
    <div class="flex flex-col gap-1.5">
      <Label for="fecha">Fecha</Label>
      <DatePicker value={fecha} onChange={(v) => (fecha = v)} />
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div class="flex flex-col gap-1.5">
        <Label for="hora-inicio">Hora inicio</Label>
        <TimePicker value={horaInicio} onChange={(v) => (horaInicio = v)} />
      </div>
      <div class="flex flex-col gap-1.5">
        <Label for="hora-final">Hora final</Label>
        <TimePicker value={horaFinal} onChange={(v) => (horaFinal = v)} />
      </div>
    </div>

    {#if totalHoras > 0}
      <div
        class="flex items-center justify-between px-4 py-3 rounded-lg bg-primary/5 dark:bg-primary/10 border border-primary/20"
        in:fade={{ duration: 200 }}
      >
        <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Total
        </span>
        <span class="text-xl font-bold text-primary tabular-nums">
          {formatHoras(totalHoras)}
        </span>
      </div>
    {/if}

    <div class="flex flex-col gap-1.5">
      <Label for="manifiesto">Manifiesto</Label>
      <Input
        id="manifiesto"
        type="text"
        inputmode="text"
        autocomplete="off"
        placeholder="Ej: 4521"
        bind:value={manifiesto}
      />
    </div>

    <div class="flex flex-col gap-1.5">
      <Label for="placa">Placa</Label>
      <Input
        id="placa"
        type="text"
        autocomplete="off"
        autocapitalize="characters"
        placeholder="Ej: ABC123"
        bind:value={placa}
      />
      {#if $placaSuggestions.length > 0}
        <div class="flex flex-wrap gap-1.5 mt-1">
          {#each $placaSuggestions as p}
            {#if p !== placa}
              <button
                type="button"
                onclick={() => pickPlaca(p)}
                class="inline-flex items-center px-2.5 py-1 rounded-md border border-border bg-background text-xs font-medium tabular-nums hover:bg-accent transition-colors"
              >
                {p}
              </button>
            {/if}
          {/each}
        </div>
      {/if}
    </div>

    <div class="flex flex-col gap-1.5">
      <Label for="conductor">Conductor</Label>
      <Input
        id="conductor"
        type="text"
        autocomplete="off"
        bind:value={conductor}
      />
    </div>

    {#if error}
      <p class="text-sm text-destructive" in:fade={{ duration: 200 }}>{error}</p>
    {/if}
  </form>

  {#snippet footer()}
    <div class="flex gap-2">
      <Button variant="outline" class="flex-1" onclick={onClose}>Cancelar</Button>
      <Button
        type="submit"
        class="flex-1"
        loading={saving}
        onclick={handleSubmit}
      >
        {editing ? 'Guardar' : 'Registrar'}
      </Button>
    </div>
  {/snippet}
</Sheet>
