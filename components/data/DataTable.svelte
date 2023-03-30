<script>

/* ------------------------------------------------------------------ Imports */

import { expectValidSurfaceColor } from "@hkd-fe/helpers/theme.js";

import BodyText
  from "@hkd-fe/components/text/BodyText.svelte";

import { text } from "@hkd-base/helpers/translate.js";
import { NO_DATA } from "@hkd-fe/lang/messages.js";

/* ---------------------------------------------------------------- Internals */

let displayRows = [];
let cssClassNames = "";

/* ------------------------------------------------------------------ Exports */

export { cssClassNames as class };

export let onColor;
$: expectValidSurfaceColor( onColor );

// export let items;
// export let headers;

/* --------------------------------------------------------------- Reactivity */

// $: {
//   if( items )
//   {
//     displayRows =
//     [
//       [ 1, 2, 3, 4, 5 ],
//       [ 1, 2, 3, 4, 5 ],
//       [ "a", "b", "c", "d", "e" ]
//     ];
//   }
//   else {
//     displayRows = null;
//   }
// }

</script>

<div class="g-data-table
            g-color gx-default-on-{onColor}
            {cssClassNames}">

  {#if displayRows}
    DATA TABLE

    {#each displayRows as row}
      <div class="row">
        {#each row as cellContent}
          <div class="cell">
            {cellContent}
          </div>
        {/each}
      </div>
    {/each}

  {:else}
    <div class="no-data" name="no-data">
      <slot >
        <BodyText {onColor}>{ text(NO_DATA) }</BodyText>
      </slot>
    </div>
  {/if}

</div>

<style>

:global(.g-data-table)
{
  display: grid;
  grid-template-columns: 1fr;
}

:global(.g-data-table > .row)
{
  display: grid;
  grid-template-rows: 1fr;
}

:global(.g-data-table > .no-data)
{
  display: grid;
  grid-template-rows: 1fr;
}

</style>