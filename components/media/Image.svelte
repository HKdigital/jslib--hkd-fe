<script>

/**
 * Usage: fit and position
 *
 *   <Image
 *     src={IMAGE_SRC}
 *     fit="cover"
 *     position="center top" />
 *
 * Usage: status
 *
 *   <Image
 *     src={IMAGE_SRC}
 *     fadeIn={200}
 *     bind:status={status} />
 */

/* ------------------------------------------------------------------ Imports */

import { fade } from 'svelte/transition';

import { delay }
  from "@hkd-base/helpers/time.js";

import StateMachine
  from "@hkd-base/classes/StateMachine.js";

import StateTransition
  from "@hkd-base/classes/StateTransition.js";

import { preload }
  from "@hkd-fe/helpers/image.js";

import { EMPTY,
         LOADED,
         SHOW,
         HIDE,
         ERROR }
  from "@hkd-fe/constants/transition-image.js";

/* ---------------------------------------------------------------- Internals */

let cssClassNames = "";
let srcStore;

let style = "";

let fadeInDuration = 0;

// let destroyed = false;

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

//
// TODO: srcset like support, for different sizes and pixel densities
//
// https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/srcset
//

/**
 * Image alt text
 *
 * @type {string}
 */
export let alt = "";

/**
 * Fade in duration in milliseconds
 *
 * @type {number}
 */
export let fadeIn = 0;

export const state = new StateMachine();

export let load = true;
export let show = true;

/* ----------------------------------------------------------------- Reactive */

$: {
  //
  // Make sure that the fade in duration is a number, not a string
  //
  fadeInDuration = parseInt(fadeIn, 10);
}

// -----------------------------------------------------------------------------

state
  .addState( { label: EMPTY } )
  .addState( { label: LOADED } )
  .addState( { label: SHOW } )
  .addState( { label: HIDE } )
  .addState( { label: ERROR } )
  .jumpTo( EMPTY );

const transitionLoad = new StateTransition();

transitionLoad.addStep( async () => {

   while( srcStore && !$srcStore?.length )
   {
    await delay( 25 );
   }

} );

const transitionIn = new StateTransition();

transitionIn.addStep( async () => {
   await delay( fadeInDuration );
} );

state
  .addTransition(
    {
      from: EMPTY,
      to: LOADED,
      transition: transitionLoad,
      // onStart: () => { console.log(`Start load [${src}]`); },
      // onEnded: () => { console.log(`Loaded [${src}]!`); }
    } )
  .addTransition(
    {
      from: LOADED,
      to: SHOW,
      transition: transitionIn,
      // onStart: () => { console.log(`Show image [${src}]`); }
    } );

// -----------------------------------------------------------------------------

$: {
  if( load && !srcStore )
  {
    //
    // Preload image into store
    // - Creates new store object if empty
    //

    state.gotoState( LOADED );

    srcStore = preload( src, srcStore );
  }
}

// -----------------------------------------------------------------------------

$: {
  if( show && $state.current?.label === LOADED && !$state.next )
  {
    //
    // Image has been loaded and property `show=true`
    // => show
    //
    state.gotoState( SHOW );
  }
}

// -----------------------------------------------------------------------------

// $: {
//   //
//   // Update status to MEDIA_READY after fade in
//   //
//   if( $status === BEFORE_READY )
//   {
//     if( !fadeInDuration )
//     {
//       status.setMediaReady();
//     }
//     else {
//       setTimeout( () => {
//         status.setMediaReady();
//       },
//       fadeInDuration );
//     }
//   }
// }

// $: {
//   console.log( "Image.svelte", { $status } );
// }

// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------

// onDestroy( () => { destroyed = true; } );

</script>

{#if $state?.current?.label === SHOW}
  <img c-image
       src={$srcStore} {alt}
       class="{cssClassNames}"
       in:fade={{duration: fadeInDuration}}
       {style}
       on:click
       on:keydown
       on:keyup />
{/if}

<style>

img
{
  display: block; /* display=block removes white space after image */

  /* Using + 0.5px to round up to prevent last pixel errors */
  width: calc( 100% + 0.5px );
  height: calc( 100% + 0.5px );

  max-width: 100%;
  max-height: 100%;

  /*object-fit: cover;
  object-position: center top;*/
}

</style>