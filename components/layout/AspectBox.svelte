<script>

/* ------------------------------------------------------------------ Imports */

import { expectPositiveNumber } from "@hkd-base/helpers/expect.js";

/* ---------------------------------------------------------------- Internals */

let boxWidth;
let boxHeightStyle;

/* ------------------------------------------------------------------ Exports */

export let aspect = 16 / 9;
$: expectPositiveNumber( aspect );

let cssClassNames = "";
export { cssClassNames as class };

/* --------------------------------------------------------------- Reactivity */

$: {
  //
  // - Set box height based on box width and aspect
  //
  if( boxWidth )
  {
    boxHeightStyle = `height: ${boxWidth / aspect}px`;
  }
}

</script>

<div class="c-aspect-box {cssClassNames}"
     bind:clientWidth={boxWidth} style={boxHeightStyle}>
  {#if boxHeightStyle}
    <slot></slot>
  {/if}
</div>

<style>
  :global(.c-aspect-box) {}
</style>
