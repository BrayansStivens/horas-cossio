<script lang="ts" module>
  export type BadgeVariant = 'default' | 'secondary' | 'outline' | 'success';
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '../../lib/cn';

  let {
    variant = 'secondary',
    class: className = '',
    children,
  }: {
    variant?: BadgeVariant;
    class?: string;
    children: Snippet;
  } = $props();

  const variants: Record<BadgeVariant, string> = {
    default: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    outline: 'border border-border text-foreground',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  };
</script>

<span
  class={cn(
    'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium',
    variants[variant],
    className,
  )}
>
  {@render children()}
</span>
