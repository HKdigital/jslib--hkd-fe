<script context="module">

/* ------------------------------------------------------------------ Imports */

import { REFERENCE_COLUMN_WIDTH,
         REFERENCE_COLUMN_WIDTH_SMALL }
 from "@hkd-fe/helpers/breakpoints.js";

// import ValueStore from "@hkd-base/classes/ValueStore.js";

import { referenceFullWidth }
  from "@hkd-fe/components/layout/ResponsiveGridRow.svelte";

/* ---------------------------------------------------------------- Internals */

const normalColumnWidth = REFERENCE_COLUMN_WIDTH;
const smallColumnWidth = REFERENCE_COLUMN_WIDTH_SMALL;

/* ------------------------------------------------------------------ Exports */

export { referenceFullWidth };

export let onColor;

</script>

<!-- ======================================================================= -->

<script>
/* ------------------------------------------------------------------ Imports */

/* ---------------------------------------------------------------- Internals */

let rowElemWidth;

let frontStyleMaxWidth = "";
let frontStyleColumns = "";

let frontStyle = "";

/* ------------------------------------------------------------------ Exports */

export let surfaceColor = null;

export let cssClassNames = "";
export { cssClassNames as class };

export let centerFront = true;

/**
 * Limit front element width to the page's content max width
 * @type {boolean}
 */
export let limitFrontWidth = true;

export let small = false;

/* ----------------------------------------------------------------- Reactive */

$: {
  //
  // Determine `frontStyleMaxWidth`
  // - Contains CSS var: `--max-front-width`
  //
  if( limitFrontWidth )
  {
    const value = $referenceFullWidth;

    //
    // Limit front width to max view width
    //
    frontStyleMaxWidth = `--max-front-width: ${value}px;`;
  }
  else if( frontStyleMaxWidth.length )
  {
    frontStyleMaxWidth = "";
  }
}

// -----------------------------------------------------------------------------

$: {
  //
  // Determine `frontStyleColumns`
  // - Contains CSS vars: `--column-width`
  //
  if( rowElemWidth )
  {
    if( small )
    {
      const columnWidth = Math.min( smallColumnWidth, rowElemWidth );

      frontStyleColumns = `--column-width: ${columnWidth}px`;
    }
    else {
      const columnWidth = Math.min( normalColumnWidth, rowElemWidth );

      frontStyleColumns = `--column-width: ${columnWidth}px`;
    }
  }
}

// -----------------------------------------------------------------------------

$: {
  //
  // Combine `frontStyleMaxWidth` and `frontStyleColumns`
  //
  frontStyle = frontStyleMaxWidth + frontStyleColumns;
}

// -----------------------------------------------------------------------------

let colorClasses = "";

$: {
  if( surfaceColor )
  {
    // g-color gx-default-on-surface2 gx-bgcolor-surface2
    colorClasses = `g-bgcolor-${surfaceColor}`;
  }
}

</script>

<div class="c-single-column-row {cssClassNames} {colorClasses}"
     bind:clientWidth={rowElemWidth}>

  <div class="cc-front"
       style={frontStyle}
       class:x-center={centerFront}>

    <slot><!-- default slot --></slot>
  </div>

  <div class="cc-background" style="color: red;">
    <slot name="background"></slot>
  </div>

</div>

<style>
  :global( .c-single-column-row )
  {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
    width: 100vw;
  }

  :global( .c-single-column-row .cc-front )
  {
    grid-column: 1 / span 1;
    grid-row: 1 / span 1;
    z-index: 2;
    max-width: min( var(--max-front-width, 100%) );
    /*border: solid 5px green;*/
    /*background-color: darksalmon;*/

    display: grid;

    grid-template-columns: var(--column-width, auto);

    grid-column-gap: 0px;
    grid-row-gap: 0px;

    grid-template-rows: 1fr;

    align-items: start;
  }

  /*:global( .c-single-column-row.x-row-gap-100 .cc-front )
  {
    grid-row-gap: var(--gx-row-gap-100, 1rem);
  }*/

  :global( .c-single-column-row.x-row-gap-100 .cc-front )
  {
    grid-row-gap: 1rem;
    /*grid-row-gap: var(--gx-row-gap-100, 1rem);*/
  }

  :global( .c-single-column-row > .cc-front > * )
  {
    /* prevent row from being too small */
    /*min-width: var(--column-width, auto);*/

    /* prevent 'too big content' to break out */
    max-width: var(--column-width, auto);
    /*max-width: 100%;*/
  }

  :global( .c-single-column-row .cc-background )
  {
    grid-column: 1 / span 1;
    grid-row: 1 / span 1;
    z-index: 1;
    /*background-color: salmon;*/
  }

  .x-center {
    justify-self: center;
  }

</style>