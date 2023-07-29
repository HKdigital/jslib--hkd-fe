<script context="module">

/**
 * Notes
 *
 * Use g-justify-self-center to center items inside the grid
 * @see jslib--hkd-fe/css/common-classes.css
 */

/* ------------------------------------------------------------------ Imports */

import { windowSize }
  from "@hkd-fe/stores/window.js";

import { WIDTH_RANGE_SMALL,
         WIDTH_RANGE_MEDIUM,
         WIDTH_RANGE_LARGE,
         WIDTH_RANGE_XL,
         BREAKPOINTS,
         screenWidthRange }
  from "@hkd-fe/stores/screen-size.js";

/* ---------------------------------------------------------------- Internals */

// const DEFAULT_MAX_COLUMN_WIDTH = 1366;

// const maxColumnWidth = new ValueStore( MAX_COLUMN_WIDTH );

/* ------------------------------------------------------------------ Exports */

// export { maxColumnWidth };

export let onColor;

</script>

<!-- ======================================================================= -->

<script>
/* ------------------------------------------------------------------ Imports */

/* ---------------------------------------------------------------- Internals */

const SMALL = 1;
const MEDIUM = 2;
const LARGE = 3;
const XL = 4;

let outerWidth;

let columnWidthRange;
let columnWidth;

/* ------------------------------------------------------------------ Exports */

// export let maxColumnWidth = DEFAULT_MAX_COLUMN_WIDTH;

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
 * Set maximum column width to size: small, medium or large.
 * - If not set, the default is xl
 * - If multiple sizes are set, ...
 */
export let small = false;
export let medium = false;
export let large = false;

export let collapse = false;

/**
 * Add CSS classes to the components outer element
 *
 * @type {string}
 */
export let cssClassNames = "";
export { cssClassNames as class };

/* ----------------------------------------------------------------- Reactive */

let colorClassesFront = "";
let colorClassesBackground = "";

$: {
  //
  // Use surface colors to determine CSS classes for:
  // - colorClassesFront
  // - colorClassesBackground
  //
  if( surfaceColorFront || surfaceColor )
  {
    colorClassesFront = `g-bg-${surfaceColorFront || surfaceColor}`;
  }

  if( surfaceColorBackground || surfaceColor )
  {
    colorClassesBackground = `g-bg-${surfaceColorBackground || surfaceColor}`;
  }
}

// -----------------------------------------------------------------------------

$: {
  //
  // Determine the current column width based on the `screenWidthRange` and
  // the maximum column width (attributes "small", "medium", "large")
  //
  switch( $screenWidthRange )
  {
    case WIDTH_RANGE_SMALL:
      columnWidthRange = SMALL;
      break;

    case WIDTH_RANGE_MEDIUM:

      if( small )
      {
        columnWidthRange = SMALL;
      }
      else {
        columnWidthRange = MEDIUM;
      }
      break;

    case WIDTH_RANGE_LARGE:

      if( small )
      {
        columnWidthRange = SMALL;
      }
      else if( medium ) {
        columnWidthRange = MEDIUM;
      }
      else {
        columnWidthRange = LARGE;
      }
      break;

    case WIDTH_RANGE_XL:

      if( small )
      {
        columnWidthRange = SMALL;
      }
      else if( medium ) {
        columnWidthRange = MEDIUM;
      }
      else if( large ) {
        columnWidthRange = LARGE;
      }
      else {
        columnWidthRange = XL;
      }
      break;

    case undefined:
      columnWidthRange = 0;
      break;

    default:
      throw new Error(
        `Invalid value [$screenWidthRange=${$screenWidthRange}]`);
  }

  let tmp = BREAKPOINTS[ columnWidthRange ];

  outerWidth = ($windowSize).width;

  if( tmp > outerWidth )
  {
    columnWidth = outerWidth;
  }
  else {
    columnWidth = tmp;
  }
}

</script>

{#if columnWidth}
  <div {...$$restProps}
       c-single-column-row
       class="{cssClassNames}"
       class:x-collapse={collapse}
       style="width: {outerWidth}px; max-width: {outerWidth}px;"

       class:x-small={columnWidthRange === SMALL}
       class:x-medium={columnWidthRange === MEDIUM}
       class:x-large={columnWidthRange === LARGE}
       class:x-xl={columnWidthRange === XL}>

    <div cc-front
         class="{colorClassesFront}"
         style="width: {columnWidth}px; max-width: {columnWidth}px;"
         class:x-justify-center={centerFront}>

      <slot></slot>

    </div>

    <!-- <div class="cc-background {colorClassesBackground}">
      <slot name="background"></slot>
    </div> -->

  </div>
{/if}

<style>
  :global( [c-single-column-row] )
  {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;

    width: 100%;

    overflow-x: hidden;

    /* border: solid 5px green; */

    padding-left: 0 !important;
    padding-right: 0 !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
  }

  :global( [c-single-column-row] > [cc-front] )
  {
    grid-column: 1 / span 1;
    grid-row: 1 / span 1;
    z-index: 2;

    display: grid;
    grid-template-columns: 100%;

    grid-template-rows: 1fr;

    align-items: start;
  }

  [cc-front].x-justify-center
  {
    justify-self: center;
  }

  :global( [c-single-column-row] > [cc-front] > * )
  {
    /* prevent 'too big content' to break out */
    max-width: 100%;
  }

  :global( [c-single-column-row] .cc-background )
  {
    grid-column: 1 / span 1;
    grid-row: 1 / span 1;
    z-index: 1;
    /*background-color: salmon;*/
  }

</style>