<script>

/* ------------------------------------------------------------------ Imports */

/* ---------------------------------------------------------------- Internals */

let element;
let lineClampStyle;

/* ------------------------------------------------------------------ Exports */

let cssClassNames = "";
export { cssClassNames as class };

export let onColor = null;

/* Center the element (element should have a width) */
export let center = false;

/**
 * Maximum number of lines inside the body text (0 = unlimited)
 * - By setting this property, the component will set styles for
 *   max-height and overflow-y
 */
export let lineClamp = 0;

/* ----------------------------------------------------------------- Reactive */

let colorClasses = "";

$: {
  if( onColor )
  {
    colorClasses = `x-color-on-${onColor}`;
  }
  else {
    colorClasses = "";
  }
}

// -----------------------------------------------------------------------------

$: {
  //
  // Calculate and set style for line clamping (limit maximum number of lines)
  //
  if( lineClamp && element )
  {
    const lineHeight =
      window.getComputedStyle(element).lineHeight;

    lineClampStyle =
      `overflow-y: hidden; display: -webkit-box;` +
      `-webkit-line-clamp: ${lineClamp};` +
      `-webkit-box-orient: vertical;` +
      `max-height: calc(${lineClamp} * ${lineHeight})`;
  }
  else {
    lineClampStyle = "";
  }
}

</script>

<div c-body-text
     bind:this={element}
     style={lineClampStyle}
     class="{colorClasses}
            {cssClassNames}"
     class:x-center={center}
     on:click>
  <slot></slot>
</div>

<style>
  :global( [c-body-text] )
  {
    /*font-family: sans-serif;
    font-weight: 300;
    font-size: 1.05rem;
    line-height: 1.4;
    letter-spacing: 0.02rem;
    padding: 0.5rem;*/
  }

  .x-center { text-align: center; }

</style>