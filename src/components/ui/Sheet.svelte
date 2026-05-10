<script lang="ts">
  import { Dialog } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import X from '@lucide/svelte/icons/x';
  import { cn } from '../../lib/cn';

  type Props = {
    open: boolean;
    onOpenChange?: (v: boolean) => void;
    title?: string;
    description?: string;
    /** mobile-bottom: slides up from bottom on mobile, centered on desktop */
    mode?: 'mobile-bottom' | 'dialog';
    class?: string;
    children: Snippet;
    footer?: Snippet;
  };

  let {
    open = $bindable(false),
    onOpenChange,
    title,
    description,
    mode = 'mobile-bottom',
    class: className = '',
    children,
    footer,
  }: Props = $props();
</script>

<Dialog.Root bind:open onOpenChange={(v) => onOpenChange?.(v)}>
  <Dialog.Portal>
    <Dialog.Overlay
      class="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out backdrop-blur-sm"
    />
    <Dialog.Content
      class={cn(
        'fixed z-50 grid gap-4 bg-background shadow-lg outline-none',
        mode === 'mobile-bottom'
          ? [
              'left-0 right-0 bottom-0 rounded-t-2xl border-t border-border',
              'data-[state=open]:animate-slide-in-bottom data-[state=closed]:animate-slide-out-bottom',
              'p-6 pb-8 max-h-[92dvh] overflow-y-auto',
              'sm:left-1/2 sm:right-auto sm:bottom-auto sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2',
              'sm:w-full sm:max-w-[450px] sm:rounded-xl sm:border sm:p-6',
              'sm:data-[state=open]:animate-zoom-in sm:data-[state=closed]:animate-zoom-out',
            ].join(' ')
          : [
              'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
              'w-[calc(100%-32px)] max-w-[440px] rounded-xl border border-border p-6',
              'data-[state=open]:animate-zoom-in data-[state=closed]:animate-zoom-out',
            ].join(' '),
        className,
      )}
    >
      {#if mode === 'mobile-bottom'}
        <div
          class="sm:hidden mx-auto -mt-2 mb-2 h-1.5 w-10 rounded-full bg-muted-foreground/30"
        ></div>
      {/if}

      {#if title}
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <Dialog.Title
              class="text-lg font-semibold leading-none tracking-tight text-foreground"
            >
              {title}
            </Dialog.Title>
            {#if description}
              <Dialog.Description
                class="mt-1.5 text-sm text-muted-foreground"
              >
                {description}
              </Dialog.Description>
            {/if}
          </div>
          <Dialog.Close
            class="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Cerrar"
          >
            <X class="size-4" />
          </Dialog.Close>
        </div>
      {/if}

      <div class="flex flex-col gap-4">
        {@render children()}
      </div>

      {#if footer}
        <div class="flex flex-col gap-2 pt-2">
          {@render footer()}
        </div>
      {/if}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
