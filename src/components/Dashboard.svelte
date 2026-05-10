<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import Plus from '@lucide/svelte/icons/plus';
  import Download from '@lucide/svelte/icons/download';
  import LogOut from '@lucide/svelte/icons/log-out';
  import Clock from '@lucide/svelte/icons/clock';
  import Logo from './Logo.svelte';
  import EntryCard from './EntryCard.svelte';
  import EntryModal from './EntryModal.svelte';
  import ExportModal from './ExportModal.svelte';
  import ConfirmDialog from './ConfirmDialog.svelte';
  import Button from './ui/Button.svelte';
  import Card from './ui/Card.svelte';
  import ThemeToggle from './ui/ThemeToggle.svelte';
  import {
    entries,
    entriesLoading,
    loadEntries,
    deleteEntry,
    updateEntry,
    totalHorasMes,
    ensureTodayEntry,
  } from '../lib/store';
  import { signOut } from '../lib/auth';
  import { USER_INFO } from '../lib/constants';
  import { format, parseISO } from 'date-fns';
  import { es } from 'date-fns/locale';
  import type { HoursEntry } from '../lib/supabase';
  import { formatHoras, nowHHMMColombia, computeTotalHoras } from '../lib/date-utils';

  let {
    userId,
    onLogout,
  }: { userId: string; onLogout: () => void } = $props();

  let entryModalOpen = $state(false);
  let exportModalOpen = $state(false);
  let editing = $state<HoursEntry | null>(null);
  let confirmDelete = $state<HoursEntry | null>(null);
  let logoutOpen = $state(false);

  async function init() {
    await loadEntries();
    await ensureTodayEntry(userId);
  }
  init();

  function openNew() {
    editing = null;
    entryModalOpen = true;
  }

  function openEdit(e: HoursEntry) {
    editing = e;
    entryModalOpen = true;
  }

  function askDelete(e: HoursEntry) {
    confirmDelete = e;
  }

  async function markExitNow(e: HoursEntry) {
    const now = nowHHMMColombia();
    try {
      await updateEntry(e.id, {
        hora_final: now,
        total_horas: computeTotalHoras(e.hora_inicio.slice(0, 5), now),
      });
    } catch (err) {
      console.error('Mark exit now failed:', err);
    }
  }

  async function doDelete() {
    if (!confirmDelete) return;
    const target = confirmDelete;
    confirmDelete = null;
    try {
      await deleteEntry(target.id);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleLogout() {
    logoutOpen = false;
    await signOut();
    onLogout();
  }

  let grouped = $derived.by(() => {
    const groups = new Map<string, { label: string; items: HoursEntry[] }>();
    for (const e of $entries) {
      const d = parseISO(e.fecha);
      const isFirstHalf = d.getDate() <= 15;
      const key = `${d.getFullYear()}-${d.getMonth()}-${isFirstHalf ? 'a' : 'b'}`;
      const monthName = format(d, 'MMMM yyyy', { locale: es });
      const half = isFirstHalf ? '01 – 15' : '16 – 30';
      const label = `${half} · ${monthName}`;
      if (!groups.has(key)) {
        groups.set(key, { label, items: [] });
      }
      groups.get(key)!.items.push(e);
    }
    return Array.from(groups.entries()).map(([key, val]) => ({
      key,
      label: val.label,
      items: val.items,
      total: val.items.reduce((acc, e) => acc + Number(e.total_horas), 0),
    }));
  });

  let firstName = $derived(
    USER_INFO.nombre
      .split(' ')[0]
      .toLowerCase()
      .replace(/^\w/, (c) => c.toUpperCase()),
  );

  let currentMonth = $derived(
    format(new Date(), 'MMMM yyyy', { locale: es }),
  );
</script>

<div class="min-h-dvh px-4 pb-12 max-w-[640px] mx-auto">
  <header
    class="flex items-center justify-between py-5"
    in:fly={{ y: -8, duration: 400, easing: quintOut }}
  >
    <div class="flex items-center gap-3">
      <Logo size={36} />
      <div class="flex flex-col leading-tight">
        <span class="text-base font-semibold text-foreground">Hola, {firstName}</span>
        <span class="text-sm text-muted-foreground tabular-nums">
          CC {USER_INFO.cedulaFormatted}
        </span>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <ThemeToggle />
      <Button
        variant="outline"
        size="icon"
        onclick={() => (logoutOpen = true)}
        aria-label="Cerrar sesión"
      >
        <LogOut />
      </Button>
    </div>
  </header>

  <section
    class="mb-6"
    in:fly={{ y: 8, duration: 450, delay: 100, easing: quintOut }}
  >
    <Card>
      <div class="p-5">
        <div class="flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground font-semibold mb-2">
          <Clock class="size-4" />
          <span class="capitalize">{currentMonth}</span>
        </div>
        <div class="flex items-baseline gap-1.5 mb-5">
          <span class="text-4xl font-bold tabular-nums tracking-tight text-foreground">
            {formatHoras($totalHorasMes).split(' ')[0]}
          </span>
          <span class="text-base text-muted-foreground font-medium">
            {formatHoras($totalHorasMes).split(' ').slice(1).join(' ') || 'h'}
          </span>
        </div>
        <div class="grid grid-cols-[1.6fr_1fr] gap-2">
          <Button onclick={openNew} size="lg">
            <Plus />
            Nueva entrada
          </Button>
          <Button variant="outline" size="lg" onclick={() => (exportModalOpen = true)}>
            <Download />
            Exportar
          </Button>
        </div>
      </div>
    </Card>
  </section>

  <main class="flex flex-col gap-6">
    {#if $entriesLoading && $entries.length === 0}
      <div class="flex flex-col gap-2" in:fade>
        {#each [0, 1, 2] as i}
          <div
            class="h-[72px] rounded-lg border border-border bg-card relative overflow-hidden"
          >
            <div
              class="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/[0.04] to-transparent"
              style="animation: shimmer-pulse 1.6s infinite; animation-delay: {i * 120}ms"
            ></div>
          </div>
        {/each}
      </div>
    {:else if grouped.length === 0}
      <Card>
        <div
          class="py-12 px-6 text-center flex flex-col items-center"
          in:fade={{ duration: 400, delay: 150 }}
        >
          <div
            class="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4"
          >
            <Clock class="size-5 text-muted-foreground" />
          </div>
          <h3 class="text-base font-semibold text-foreground mb-1">Sin registros aún</h3>
          <p class="text-sm text-muted-foreground">
            Cuando registres tu primera entrada aparecerá acá.
          </p>
        </div>
      </Card>
    {:else}
      {#each grouped as group, gi (group.key)}
        <div
          class="flex flex-col gap-2"
          in:fly={{ y: 12, duration: 350, delay: gi * 50, easing: quintOut }}
        >
          <div class="flex items-center justify-between px-1 mb-1">
            <span class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </span>
            <span
              class="text-sm font-bold tabular-nums px-2 py-0.5 rounded-md bg-secondary text-foreground"
            >
              {formatHoras(group.total)}
            </span>
          </div>
          <div class="flex flex-col gap-2">
            {#each group.items as entry, i (entry.id)}
              <EntryCard
                {entry}
                index={i}
                onEdit={openEdit}
                onDelete={askDelete}
                onMarkExitNow={markExitNow}
              />
            {/each}
          </div>
        </div>
      {/each}
    {/if}
  </main>
</div>

<EntryModal
  open={entryModalOpen}
  onClose={() => (entryModalOpen = false)}
  {userId}
  {editing}
/>

<ExportModal open={exportModalOpen} onClose={() => (exportModalOpen = false)} />

<ConfirmDialog
  open={confirmDelete !== null}
  title="Eliminar registro"
  message="¿Seguro que quieres eliminar esta entrada? No se puede deshacer."
  confirmLabel="Eliminar"
  danger
  onConfirm={doDelete}
  onCancel={() => (confirmDelete = null)}
/>

<ConfirmDialog
  open={logoutOpen}
  title="Cerrar sesión"
  message="¿Quieres salir de la app?"
  confirmLabel="Salir"
  onConfirm={handleLogout}
  onCancel={() => (logoutOpen = false)}
/>

<style>
  @keyframes shimmer-pulse {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
</style>
