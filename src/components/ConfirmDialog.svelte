<script lang="ts">
  import Sheet from './ui/Sheet.svelte';
  import Button from './ui/Button.svelte';

  let {
    open,
    title,
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    danger = false,
    onConfirm,
    onCancel,
  }: {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
  } = $props();
</script>

<Sheet
  {open}
  onOpenChange={(v) => !v && onCancel()}
  mode="dialog"
  {title}
  description={message}
>
  <!-- empty body since description carries the message -->
  <span class="sr-only"></span>

  {#snippet footer()}
    <div class="grid grid-cols-2 gap-2">
      <Button variant="outline" onclick={onCancel}>{cancelLabel}</Button>
      <Button
        variant={danger ? 'destructive' : 'default'}
        onclick={onConfirm}
      >
        {confirmLabel}
      </Button>
    </div>
  {/snippet}
</Sheet>
