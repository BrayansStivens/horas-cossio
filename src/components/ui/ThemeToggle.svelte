<script lang="ts">
  import Sun from '@lucide/svelte/icons/sun';
  import Moon from '@lucide/svelte/icons/moon';
  import { theme } from '../../lib/theme';
  import { cn } from '../../lib/cn';

  let { class: className = '' }: { class?: string } = $props();

  let isDark = $state(false);

  $effect(() => {
    const update = () => {
      isDark = document.documentElement.classList.contains('dark');
    };
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => obs.disconnect();
  });

  function toggle() {
    theme.update((t) => {
      if (t === 'system') {
        return isDark ? 'light' : 'dark';
      }
      return t === 'dark' ? 'light' : 'dark';
    });
  }
</script>

<button
  type="button"
  onclick={toggle}
  aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
  class={cn(
    'inline-flex items-center justify-center h-11 w-11 rounded-md',
    'border border-border bg-background text-foreground',
    'hover:bg-accent hover:text-accent-foreground',
    'transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    className,
  )}
>
  {#if isDark}
    <Moon size={18} strokeWidth={2} />
  {:else}
    <Sun size={18} strokeWidth={2} />
  {/if}
</button>
