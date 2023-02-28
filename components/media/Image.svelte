<script>

/* ------------------------------------------------------------------ Imports */

import { preload } from "@hkd-fe/helpers/image.js";

import { fade } from 'svelte/transition';

/* ---------------------------------------------------------------- Internals */

let cssClassNames = "";
let srcStore;

let style = "";

/* ------------------------------------------------------------------ Exports */

export { cssClassNames as class };

/**
 * Fit the image inside the containing box
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit
 *
 * @values fill | contain | cover | none
 */
export let fit = "cover";

/**
 * Position the image inside the containing box
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/object-position
 *
 * @values [left | center | right] [top | center | bottom]
 */
export let position = "center top";

export let src;

export let alt = "";

/**
 * Fade in duration in milliseconds
 */
export let fadeIn = 0;

// export let delay = 0;

//
// TODO: srcset like support, for different sizes and pixel densities
//
// https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/srcset
//

/* ----------------------------------------------------------------- Reactive */

$: srcStore = preload( src, srcStore );

$: {
  //
  // Add object-fit and object-position to style
  //
  style = "";

  if( fit )
  {
    style += `object-fit: ${fit};`;
  }

  if( position )
  {
    style += `object-position: ${position};`;
  }
}

</script>

{#if $srcStore}
  <img comp="image"
       src={$srcStore} {alt}
       class="{cssClassNames}"
       in:fade={{duration: parseInt(fadeIn, 10)}}
       {style} />
{/if}

<style>

/*:global( img[comp="image"] )*/
img
{
  display: block; /* display=block removes white space after image */

  /* Using + 0.5px to round up to prevent last pixel errors */
  width: calc( 100% + 0.5px );
  height: calc( 100% + 0.5px );

  /*object-fit: cover;
  object-position: center top;*/
}

</style>