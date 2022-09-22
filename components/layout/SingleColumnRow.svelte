<script context="module">

/* ------------------------------------------------------------------ Imports */

import { SMALL_COLUMN_WIDTH,
         MEDIUM_COLUMN_WIDTH,
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

/**
 * Set default surface color for front and background element
 *
 * @type {string}
 */
export let surfaceColor = null;

/**
 * Set surface color for front element
 *
 * @type {string}
 */
export let surfaceColorFront = null;

/**
 * Set surface color for background element
 *
 * @type {string}
 */
export let surfaceColorBackground = null;

/**
 * Center the grid that contains the front content
 *
 * @type {boolean}
 */
export let centerFront = true;

/**
 * Enable small, medium or large column width
 * - By default the column will be as wide as the available space,
 *   which is by default limited by `referenceFullWidth`.
 */
export let small = false;
export let medium = false;
export let large = false;

/**
 * Limit front element width to the page's content max width
 * @type {boolean}
 */
export let limitFrontWidth = true;

/**
 * Add CSS classes to the components outer element
 *
 * @type {string}
 */
export let cssClassNames = "";
export { cssClassNames as class };

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
    let columnWidth;

    if( small )
    {
      columnWidth = Math.min( SMALL_COLUMN_WIDTH, rowElemWidth );
    }
    else if( large )
    {
      columnWidth = Math.min( LARGE_COLUMN_WIDTH, rowElemWidth );
    }
    else if( medium )
    {
      columnWidth = Math.min( MEDIUM_COLUMN_WIDTH, rowElemWidth );
    }

    if( columnWidth )
    {
      // frontStyleColumns = `--column-width: min(${columnWidth}px,100%)`;
      frontStyleColumns = `--column-width: ${columnWidth}px`;
    }
    else {
      frontStyleColumns = "--column-width: 100%;";
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

    width: 100vw; /* 100% does not work with dev console open! */
    /*width: 100%;*/
  }

  :global( .c-single-column-row .cc-front )
  {
    grid-column: 1 / span 1;
    grid-row: 1 / span 1;
    z-index: 2;

    width: var(--column-width);
    max-width: var(--max-front-width, 100%);

    /*max-width: 100%;
    width: var(--column-width, 100%);*/

    display: grid;
    grid-template-columns: 100%;
    /*grid-template-columns: var(--column-width, 100%);*/
    /*grid-template-columns: var(--column-width, 100px);*/
    /*grid-template-columns: 400px;*/

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
    /* prevent 'too big content' to break out */
    max-width: 100%;
  }

  :global( .c-single-column-row .cc-background )
  {
    grid-column: 1 / span 1;
    grid-row: 1 / span 1;
    z-index: 1;
    /*background-color: salmon;*/
  }

</style>