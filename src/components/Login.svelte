<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import IdCard from '@lucide/svelte/icons/id-card';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import AlertCircle from '@lucide/svelte/icons/alert-circle';
  import Button from './ui/Button.svelte';
  import Card from './ui/Card.svelte';
  import Input from './ui/Input.svelte';
  import Label from './ui/Label.svelte';
  import ThemeToggle from './ui/ThemeToggle.svelte';
  import Logo from './Logo.svelte';
  import { signInWithCedula } from '../lib/auth';
  import { USER_INFO } from '../lib/constants';

  let { onSuccess }: { onSuccess: () => void } = $props();

  let cedula = $state('');
  let loading = $state(false);
  let error = $state<string | null>(null);
  let shake = $state(false);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (loading) return;
    error = null;
    loading = true;
    const res = await signInWithCedula(cedula);
    loading = false;
    if (!res.ok) {
      error = res.error ?? 'Error desconocido';
      shake = true;
      setTimeout(() => (shake = false), 500);
      cedula = '';
      return;
    }
    onSuccess();
  }
</script>

<div class="min-h-dvh flex items-center justify-center px-4 py-8">
  <div class="absolute top-4 right-4">
    <ThemeToggle />
  </div>

  <div class="w-full max-w-[400px]" in:fade={{ duration: 300 }}>
    <div
      class="flex flex-col items-center text-center mb-8"
      in:fly={{ y: -8, duration: 500, easing: quintOut }}
    >
      <Logo size={56} class="mb-5 shadow-sm" />
      <h1 class="text-2xl font-bold tracking-tight text-foreground">
        3TC · Horas Extras
      </h1>
      <p class="mt-1.5 text-sm text-muted-foreground">
        Ingresa tu cédula para continuar
      </p>
    </div>

    <Card
      class={shake ? 'animate-shake' : ''}
    >
      <div in:fly={{ y: 12, duration: 500, delay: 120, easing: quintOut }}>
        <form onsubmit={handleSubmit} class="p-6 flex flex-col gap-5">
          <div class="flex flex-col gap-2">
            <Label for="cedula">Cédula</Label>
            <div class="relative">
              <IdCard
                class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
              />
              <Input
                id="cedula"
                type="tel"
                inputmode="numeric"
                autocomplete="off"
                autocapitalize="off"
                spellcheck={false}
                placeholder="Ingresa tu cédula"
                bind:value={cedula}
                disabled={loading}
                class="pl-10 tabular-nums"
              />
            </div>
            {#if error}
              <div
                class="flex items-center gap-2 text-sm text-destructive mt-1"
                in:fly={{ y: -4, duration: 200 }}
              >
                <AlertCircle class="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            {/if}
          </div>

          <Button
            type="submit"
            size="lg"
            loading={loading}
            disabled={!cedula || loading}
          >
            {#if !loading}
              <span>Ingresar</span>
              <ArrowRight />
            {:else}
              <span>Ingresando...</span>
            {/if}
          </Button>
        </form>
      </div>
    </Card>

    <p
      class="mt-5 text-center text-xs text-muted-foreground"
      in:fade={{ duration: 400, delay: 300 }}
    >
      {USER_INFO.empresa}
    </p>
  </div>
</div>
