<script lang="ts">
  import { cn } from '../lib/cn';

  let {
    size = 36,
    class: className = '',
  }: { size?: number; class?: string } = $props();
</script>

<div
  class={cn(
    'inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold tracking-tight',
    className,
  )}
  style="width: {size}px; height: {size}px; font-size: {size * 0.36}px"
  aria-label="3TC"
  role="img"
>
  3TC
</div>
