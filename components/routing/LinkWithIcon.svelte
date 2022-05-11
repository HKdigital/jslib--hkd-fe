<script>

  // -- Imports

  import { expectString, expectObjectOrUndefined } from "$hk/expect.js";

  import { expectValidSurfaceColor } from "$hk-fe/theme.js";

  import Link from "$hk-fe/components/routing/Link.svelte";

  // -- Exports

  export let path = undefined;
  export let routeTo = undefined;
  export let routeToOptions = undefined;

  export let onColor = null;

  $: expectValidSurfaceColor( onColor );

  // -- path and routeTo logic

  $: {
    if( path )
    {
      expectString( path, "Invalid value for property [path]");
    }

    if( routeTo )
    {
      expectString( routeTo, "Invalid value for property [routeTo]");
    }

    expectObjectOrUndefined( routeToOptions,
      "Invalid value for property [routeToOptions]");
  }

  // -- Exports

  let cssClassNames = "";
  export { cssClassNames as class };

  export let iconLeft = null;
  export let iconRight = null;

</script>

{#if path || routeTo}
  <!-- Wrap icon and slot in Link element -->
  <Link {onColor}
      class="{cssClassNames}"
      path="{path}" {routeTo} {routeToOptions} on:click>

    {#if iconLeft}
      <span class="g-color-default-on-{onColor}
                   g-icon x-icon-min-width icon-left {iconLeft}"></span>
      <slot></slot>
    {:else if iconRight}
      <slot></slot>
      <span class="g-color-default-on-{onColor}
                   g-icon x-icon-min-width icon-right {iconRight}"></span>
    {:else}
      <slot></slot>
    {/if}
  </Link>
{:else}
  <!-- No path or routeTo -> no link element -->
  <div class="g-text-link g-color-default-on-{onColor} {cssClassNames}" on:click>
    {#if iconLeft}
      <span>
        <i class="g-icon x-icon-min-width icon-left {iconLeft}"></i>
        <slot></slot>
      </span>
    {:else if iconRight}
      <span>
        <slot></slot>
        <span class="g-icon x-icon-min-width icon-right {iconRight}"></span>
      </span>
    {:else}
      <span><slot></slot></span>
    {/if}
  </div>
{/if}

<style>
  .icon-left { display: inline-block; text-align: left; }
  .icon-right { display: inline-block; text-align: right; }
</style>