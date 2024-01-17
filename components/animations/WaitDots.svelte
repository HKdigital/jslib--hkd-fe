<script>

/* ------------------------------------------------------------------ Imports */

import { onMount, onDestroy } from "svelte";

/* ---------------------------------------------------------------- Internals */

let dotsStr = "";
let timer;

export let numberOfDots = 3;
export let intervalMs = 500;
export let dot = " ·";

// -----------------------------------------------------------------------------

/**
 * Udpdate the number of dots
 *
 * @returns {[type]} [description]
 */
function update()
{
  if( dotsStr.length <  numberOfDots * dot.length )
  {
    dotsStr = dotsStr + dot;
  }
  else {
    dotsStr = "";
  }
}

/* ----------------------------------------------------------------- Reactive */

onMount( () =>
  {
    timer = setInterval( update, intervalMs );
  } );

onDestroy( () =>
  {
    clearTimeout( timer );
  } );

</script>


<span>{dotsStr}</span>