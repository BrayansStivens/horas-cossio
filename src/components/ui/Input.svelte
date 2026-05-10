<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { cn } from '../../lib/cn';

  type Props = HTMLInputAttributes & {
    class?: string;
    value?: string;
  };

  let {
    class: className = '',
    value = $bindable(''),
    ...rest
  }: Props = $props();
</script>

<input
  bind:value
  {...rest}
  class={cn(
    'flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base',
    'placeholder:text-muted-foreground',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'transition-[border-color,box-shadow]',
    className,
  )}
/>
