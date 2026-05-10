<script lang="ts">
  import { Calendar as CalendarPrimitive } from 'bits-ui';
  import type { DateValue } from '@internationalized/date';
  import ChevronLeft from '@lucide/svelte/icons/chevron-left';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import { cn } from '../../lib/cn';

  type Props = {
    value?: DateValue;
    onValueChange?: (v: DateValue | undefined) => void;
    class?: string;
  };

  let {
    value = $bindable(),
    onValueChange,
    class: className = '',
  }: Props = $props();
</script>

<CalendarPrimitive.Root
  bind:value
  onValueChange={(v) => onValueChange?.(v)}
  locale="es"
  weekdayFormat="short"
  fixedWeeks={true}
  class={cn('select-none', className)}
>
  {#snippet children({ months, weekdays })}
    <CalendarPrimitive.Header class="relative flex items-center justify-between pt-1 pb-3">
      <CalendarPrimitive.PrevButton
        class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronLeft class="size-4" />
      </CalendarPrimitive.PrevButton>
      <CalendarPrimitive.Heading class="text-sm font-semibold capitalize" />
      <CalendarPrimitive.NextButton
        class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronRight class="size-4" />
      </CalendarPrimitive.NextButton>
    </CalendarPrimitive.Header>

    {#each months as month (month.value)}
      <CalendarPrimitive.Grid class="w-full border-collapse">
        <CalendarPrimitive.GridHead>
          <CalendarPrimitive.GridRow class="flex">
            {#each weekdays as wd}
              <CalendarPrimitive.HeadCell
                class="w-9 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
              >
                {wd.slice(0, 2)}
              </CalendarPrimitive.HeadCell>
            {/each}
          </CalendarPrimitive.GridRow>
        </CalendarPrimitive.GridHead>
        <CalendarPrimitive.GridBody>
          {#each month.weeks as week (week)}
            <CalendarPrimitive.GridRow class="flex w-full mt-1">
              {#each week as date (date)}
                <CalendarPrimitive.Cell
                  {date}
                  month={month.value}
                  class="relative h-9 w-9 p-0 text-center focus-within:relative focus-within:z-10"
                >
                  <CalendarPrimitive.Day
                    class={cn(
                      'inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium',
                      'transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      'data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:hover:bg-primary',
                      'data-[today]:font-bold data-[today]:underline',
                      'data-[outside-month]:text-muted-foreground/40 data-[outside-month]:pointer-events-none',
                      'data-[disabled]:text-muted-foreground/30 data-[disabled]:pointer-events-none',
                      'data-[unavailable]:text-muted-foreground/30 data-[unavailable]:line-through',
                    )}
                  />
                </CalendarPrimitive.Cell>
              {/each}
            </CalendarPrimitive.GridRow>
          {/each}
        </CalendarPrimitive.GridBody>
      </CalendarPrimitive.Grid>
    {/each}
  {/snippet}
</CalendarPrimitive.Root>
