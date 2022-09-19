<script context="module">

/* ------------------------------------------------------------------ Imports */

import { SMALL_COLUMN_WIDTH,
         NORMAL_COLUMN_WIDTH,
         LARGE_COLUMN_WIDTH }
 from "@hkd-fe/helpers/breakpoints.js";

// import ValueStore from "@hkd-base/classes/ValueStore.js";

import { referenceFullWidth }
  from "@hkd-fe/components/layout/ResponsiveGridRow.svelte";

/* ---------------------------------------------------------------- Internals */

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

export let surfaceColorFront = null;
export let surfaceColorBackground = null;

export let cssClassNames = "";
export { cssClassNames as class };

export let centerFront = true;

/**
 * Limit front element width to the page's content max width
 * @type {boolean}
 */
export let limitFrontWidth = true;

/**
 * Enable small, normal (default) or large column width
 */
export let small = false;
export let large = false;

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
      const columnWidth = Math.min( SMALL_COLUMN_WIDTH, rowElemWidth );

      frontStyleColumns = `--column-width: ${columnWidth}px`;
    }
    else if( large )
    {
      const columnWidth = Math.min( LARGE_COLUMN_WIDTH, rowElemWidth );

      frontStyleColumns = `--column-width: ${columnWidth}px`;
    }
    else {
      const columnWidth = Math.min( NORMAL_COLUMN_WIDTH, rowElemWidth );

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

let colorClassesFront = "";
let colorClassesBackground = "";

$: {
  if( surfaceColorFront || surfaceColor )
  {
    colorClassesFront = `g-bg-${surfaceColorFront || surfaceColor}`;
  }

  if( surfaceColorBackground || surfaceColor )
  {
    colorClassesBackground = `g-bg-${surfaceColorBackground || surfaceColor}`;
  }
}

</script>

<div class="c-single-column-row {cssClassNames}"
     bind:clientWidth={rowElemWidth}>

  <div class="cc-front {colorClassesFront}"
       style={frontStyle}
       class:x-justify-center={centerFront}>

    <slot><!-- default slot --></slot>
  </div>

  <div class="cc-background {colorClassesBackground}">
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

  .cc-front.x-justify-center
  {
    justify-self: center;
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

  /* Justify child elements */

/*  :global( .c-single-column-row .xx-justify-center)
  {
    justify-self: center;
  }
*/
</style>