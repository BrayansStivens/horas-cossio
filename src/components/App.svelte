<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import Login from './Login.svelte';
  import Dashboard from './Dashboard.svelte';
  import { supabase } from '../lib/supabase';
  import { setupTheme } from '../lib/theme';

  let userId = $state<string | null>(null);
  let booting = $state(true);

  onMount(async () => {
    setupTheme();
    const { data } = await supabase.auth.getSession();
    userId = data.session?.user?.id ?? null;
    booting = false;

    supabase.auth.onAuthStateChange((_event, session) => {
      userId = session?.user?.id ?? null;
    });
  });

  async function refreshSession() {
    const { data } = await supabase.auth.getSession();
    userId = data.session?.user?.id ?? null;
  }
</script>

{#if booting}
  <div class="min-h-dvh flex items-center justify-center" out:fade={{ duration: 200 }}>
    <div
      class="size-8 rounded-full border-2 border-border border-t-foreground animate-spin"
    ></div>
  </div>
{:else if !userId}
  <Login onSuccess={refreshSession} />
{:else}
  <Dashboard {userId} onLogout={refreshSession} />
{/if}
