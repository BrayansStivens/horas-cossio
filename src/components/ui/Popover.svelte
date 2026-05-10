<script lang="ts">
  import { Popover } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import { cn } from '../../lib/cn';

  type Props = {
    open?: boolean;
    onOpenChange?: (v: boolean) => void;
    trigger: Snippet;
    align?: 'start' | 'center' | 'end';
    side?: 'top' | 'right' | 'bottom' | 'left';
    sideOffset?: number;
    class?: string;
    contentClass?: string;
    children: Snippet;
  };

  let {
    open = $bindable(false),
    onOpenChange,
    trigger,
    align = 'start',
    side = 'bottom',
    sideOffset = 6,
    class: className = '',
    contentClass = '',
    children,
  }: Props = $props();
</script>

<Popover.Root bind:open onOpenChange={(v) => onOpenChange?.(v)}>
  <Popover.Trigger class={cn('outline-none', className)}>
    {@render trigger()}
  </Popover.Trigger>
  <Popover.Portal>
    <Popover.Content
      {align}
      {side}
      {sideOffset}
      class={cn(
        'z-50 w-auto rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg outline-none',
        'data-[state=open]:animate-zoom-in data-[state=closed]:animate-zoom-out',
        contentClass,
      )}
    >
      {@render children()}
    </Popover.Content>
  </Popover.Portal>
</Popover.Root>
