<script>
/* ------------------------------------------------------------------ Imports */

import { expectValidSurfaceColor } from '@hkd-fe/helpers/colors.js';

/* ------------------------------------------------------------------ Exports */

export let onColor;
$: expectValidSurfaceColor( onColor );

/* content = SVELTE component */
export let content;

</script>

{#if content}
  <svelte:component
    this={content}
    {onColor}
    on:message />
{/if}