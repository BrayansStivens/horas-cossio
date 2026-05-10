<script lang="ts" module>
  export type ButtonVariant =
    | 'default'
    | 'secondary'
    | 'outline'
    | 'ghost'
    | 'destructive'
    | 'link';
  export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import { cn } from '../../lib/cn';

  type Props = HTMLButtonAttributes & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    class?: string;
    loading?: boolean;
    children: Snippet;
  };

  let {
    variant = 'default',
    size = 'default',
    class: className = '',
    loading = false,
    disabled,
    children,
    ...rest
  }: Props = $props();

  const variants: Record<ButtonVariant, string> = {
    default:
      'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/85 shadow-sm',
    secondary:
      'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70',
    outline:
      'border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground',
    ghost:
      'text-foreground hover:bg-accent hover:text-accent-foreground',
    destructive:
      'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/85 shadow-sm',
    link: 'text-primary underline-offset-4 hover:underline',
  };

  const sizes: Record<ButtonSize, string> = {
    default: 'h-11 px-4 py-2 text-sm',
    sm: 'h-9 rounded-md px-3 text-xs',
    lg: 'h-14 rounded-lg px-6 text-base',
    icon: 'h-11 w-11',
  };
</script>

<button
  {...rest}
  disabled={disabled || loading}
  class={cn(
    'inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap',
    'transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:opacity-50 disabled:pointer-events-none',
    "[&_svg]:size-4 [&_svg]:shrink-0",
    variants[variant],
    sizes[size],
    className,
  )}
>
  {#if loading}
    <span class="size-4 rounded-full border-2 border-current border-t-transparent animate-spin"></span>
  {/if}
  {@render children()}
</button>
