<script context="module">

/**
 * Notes
 *
 * Use g-justify-self-center to center items inside the grid
 * @see jslib--hkd-fe/css/common-classes.css
 */

/* ------------------------------------------------------------------ Imports */

import { REFERENCE_FULL_WIDTH,
         REFERENCE_MAX_COLUMNS } from "@hkd-fe/helpers/breakpoints.js";

import ValueStore from "@hkd-base/classes/ValueStore.js";

/* ---------------------------------------------------------------- Internals */

const SINGLE_SMALL_COLUMN_WIDTH = REFERENCE_FULL_WIDTH / 2;

const referenceFullWidth = new ValueStore( REFERENCE_FULL_WIDTH );

const singleSmallColumnWidth = new ValueStore( SINGLE_SMALL_COLUMN_WIDTH );

/* ------------------------------------------------------------------ Exports */

export { referenceFullWidth };
export { singleSmallColumnWidth };

</script>

<!-- ======================================================================= -->

<script>
/* ------------------------------------------------------------------ Imports */

import { calculateNumberOfColumns } from "@hkd-fe/helpers/breakpoints.js";

/* ---------------------------------------------------------------- Internals */

let rowElemWidth;

let frontElem;
let frontChildElementCount = 0;

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
 * Specify the maximum number of columns inside the front element
 * - Should not be greater than DEFAULT_MAX_COLUMNS
 *
 * @type {number}
 */
export let maxColumns = REFERENCE_MAX_COLUMNS;

export let singleSmallColumn = false;

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
  // - Contains CSS vars: `--column-width` and --number-of-columns
  //
  if( rowElemWidth )
  {
    if( frontChildElementCount > 1 &&
        maxColumns > 1 &&
        !singleSmallColumn )
    {
      let availableWidth;

      if( rowElemWidth < $referenceFullWidth )
      {
        availableWidth = rowElemWidth;
      }
      else {
        availableWidth = $referenceFullWidth;
      }

      let numberOfColumns =
        calculateNumberOfColumns(
          {
            availableWidth,
            maxColumns,
            referenceFullWidth: $referenceFullWidth
          } );

      // console.log(
      //   {
      //     availableWidth,
      //     maxColumns,
      //     referenceFullWidth: $referenceFullWidth,
      //     numberOfColumns
      //   } );

      if( numberOfColumns > frontChildElementCount )
      {
        //
        // Don't use more columns than elements to fill the columns
        //
        numberOfColumns = frontChildElementCount;
      }
      else if( 3 === numberOfColumns && 4 === frontChildElementCount )
      {
        //
        // Not nice to use 3 columns if there are 4 elements
        //
        numberOfColumns = 2;
      }

      const columnWidth = availableWidth / numberOfColumns;

      frontStyleColumns =
        `--column-width: ${columnWidth}px;` +
        `--number-of-columns: ${numberOfColumns};`;
    }
    else {
      //
      // One of the following situations:
      // - Only one element inside front element
      // - maxColumns = 1
      // - singleSmallColumn=true
      //
      if( singleSmallColumn )
      {
        const columnWidth = Math.min( $singleSmallColumnWidth, rowElemWidth );

        frontStyleColumns = `--column-width: ${columnWidth}px`;
      }
      else {
        frontStyleColumns = "";
      }
    }
  }
}

// -----------------------------------------------------------------------------

$: {
  //
  // Determine the number of child element inside the front element
  //
  if( frontElem )
  {
    frontChildElementCount = frontElem.childElementCount;
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

<div {...$$restProps}
     class="c-responsive-grid-row {cssClassNames}"
     bind:clientWidth={rowElemWidth}>

  <div class="cc-front {colorClassesFront}"
       style={frontStyle}
       class:x-justify-center={centerFront}
       bind:this={frontElem}>

    <slot><!-- default slot --></slot>
  </div>

  <div class="cc-background {colorClassesBackground}">
    <slot name="background"></slot>
  </div>

</div>

<style>
  :global( .c-responsive-grid-row )
  {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;

    width: 100vw;
    /*background-color: salmon;*/
  }

  :global( .c-responsive-grid-row .cc-front )
  {
    grid-column: 1 / span 1;
    grid-row: 1 / span 1;
    z-index: 2;
    max-width: min( var(--max-front-width, 100%) );

    width: 100%;

    /*border: dashed 1px green;
    background-color: olive;*/

    display: grid;

    /*grid-template-columns:
      repeat( var(--number-of-columns, 1), var(--column-width, auto) );*/

    grid-template-columns:
      repeat( var(--number-of-columns, 1), auto );

    grid-column-gap: 0px;
    grid-row-gap: 0px;

    grid-template-rows: 1fr;

    align-items: start;
  }

  .cc-front.x-justify-center
  {
    justify-self: center;
  }

  :global( .c-responsive-grid-row .cc-front .x-span-all )
  {
    grid-column: 1/-1;
    /*background-color: red;*/
    max-width: 100% !important;
  }

  :global( .c-responsive-grid-row > .cc-front > * )
  {
    /* prevent row from being too small */
    /*min-width: var(--column-width, auto);*/

    /* prevent 'too big content' to break out */
    max-width: var(--column-width, auto);
    /*max-width: 100%;*/
  }

  :global( .c-responsive-grid-row .cc-background )
  {
    grid-column: 1 / span 1;
    grid-row: 1 / span 1;
    z-index: 1;
    /*background-color: salmon;*/
  }

  /* Justify child elements */

  :global( .c-responsive-grid-row .x-justify-center)
  {
    justify-self: center;
  }

</style>