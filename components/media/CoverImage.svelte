<script>

/**
 * Sizing of the CoverImage:
 * - By default the CoverImage has a style `width: 100%; height: 100%`
 *   so it will fill the surrounding parent
 *
 * - Optionally custom properties `style` or `classNames` can be set
 *   to control the (min/max)width and (min/max)height of the component
 *
 *   e.g. <CoverImage style="height: 20rem;" ... />
 *   e.g. <CoverImage class="rowHeight" ... />
 *
 * - Property `fit` controls how the content should fit in the component.
 *
 *   Possible values: contain|cover|fill|none|scale-down
 *   Default value: cover
 *
 *   For posible values and their functioning:
 *   @see https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit
 *
 * - Property `position` controls how the content should be aligned inside the
 *   component.
 *
 *   Possible values: "left|center|right|... top|center|bottom|..."
 *   Default value: "center top".
 *
 *   For posible values and their functioning:
 *   @see https://developer.mozilla.org/en-US/docs/Web/CSS/object-position
 *
 *   e.g. <CoverImage fit="cover" position="center top" ... />
 */

/* ------------------------------------------------------------------ Imports */

import { expectStringOrNull } from "@hkd-base/expect.js";

import { equals } from "@hkd-base/compare.js";

import ObjectBox from "./media-include/ObjectBox.svelte";

/* ------------------------------------------------------------------ Exports */

export let src = null;
export let alt = "";

let classNames = "";
export { classNames as class };

let customStyle = "";
export { customStyle as style };

let objectFit = "cover";
export { objectFit as fit };

let objectPosition = "center top";
export { objectPosition as position };

/* -------------------------------------------------------------------- Logic */

let objectStyle = "";

$: {
  // Convert fit & position properties to CSS style tag properties

  if( objectFit )
  {
    objectStyle += `object-fit: ${objectFit};`;
  }

  if( objectPosition )
  {
    objectStyle += `object-position: ${objectPosition};`;
  }

  // console.log( { objectStyle } );
}

let imageElem;

let isLoading = false;
let hasError = false;
let hasLoaded = false;

let prevSrc;

$: {
  // - Set or update image url
  // - Update properties `isLoading`, `hasError` and `hasLoaded`

  if( imageElem )
  {
    if( src )
    {
      expectStringOrNull( src, "Invalid property [src]" );

      if( !equals(src, prevSrc) )
      {
        prevSrc = src;
        isLoading = false;
        hasError = false;
        hasLoaded = false;
      }

      if( !isLoading && !hasLoaded )
      {
        isLoading = true;
        imageElem.srcset = src;

        // Set src attribute as fallback
        // - Split `srcset` on first whitespace or comma
        //   (returns whole srcset string if none found)
        imageElem.src = src.split(/[\s,]+/, 1)[0];
      }
    }
  }
}

/**
 * Callback that is called when the image has loaded
 */
function loadedCallback()
{
  // console.log(`Loaded [${src}]`);

  // const boxHeight = imgBoxElem.getBoundingClientRect().height;

  // const imgBoxStyle = window.getComputedStyle( imgBoxElem );
  // const cssHeight = imgBoxStyle.getPropertyValue("height");

  // console.log( {cssHeight} );

  // if( 0 === boxHeight )
  // {
  //   console.log( { h: imageElem.height } );
  //   // imgBoxElem.style.height =
  // }

  hasLoaded = true;
  isLoading = false;
}

/**
 * Callback that is called when the image loading falls
 */
function errorCallback()
{
  console.log(`Error loading [${src}]`);
  hasError = true;
}

// TODO:
// https://css-tricks.com/lazy-loading-images-in-svelte/

</script> <!----------------------------------------------------------- HTML -->

<ObjectBox
    class="c-cover-image {classNames}"
    style={customStyle}>

  <img bind:this={imageElem} {alt}
       class="c-cover-image"
       class:not-loaded={!hasLoaded}
       class:has-error={hasError}
       style={objectStyle}
       on:load={loadedCallback}
       on:error={errorCallback} />

</ObjectBox>

<style> /* ------------------------------------------------------------ Style */

  :global(.c-cover-image) {}

  img
  {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: calc( 100% + 0.5px ); /* round up */
    display: block;
   /* object-fit: cover;*/
  }

  img
  {
    transition: opacity 0.5s;
  }

  img.not-loaded
  {
    opacity: 0;
  }

  img.has-error
  {
    opacity: 0;
  }

</style>