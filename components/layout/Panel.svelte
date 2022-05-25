<script>
/* ------------------------------------------------------------------ Imports */

import { expectValidSurfaceColor } from "@hkd-fe/helpers/colors.js";

/* ------------------------------------------------------------------ Exports */

export let onColor;
$: expectValidSurfaceColor( onColor );

export let component;

</script>

{#if component}
  <svelte:component
    this={component}
    {onColor}
    on:message />
{/if}