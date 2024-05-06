<script>

/* ------------------------------------------------------------------ Imports */

// -- Routing

import { redirectToRoute }
  from '@hkd-fe/stores/router.js';

// // -- Stores

// import { screenWidthSmall }
//   from "@hkd-fe/stores/screen-size.js";

/* ---------------------------------------------------------------- Internals */

let cssClassNames = '';

// -----------------------------------------------------------------------------

/**
 * Try redirect if a route propery has been supplied
 * - Prevents emission of click event if the button is disabled
 * - This is a SVELTE action function
 *
 * @param {object} node - DOM node
 *
 * @returns {object} { destroy: <function> }
 */
function tryRedirect( node )
{
  const handleClick = (event) => {

    // console.log("tryRedirect", { route, routeOptions } );
    // return;

    if( route )
    {
      event.stopPropagation();

      redirectToRoute( route, routeOptions );
    }
  };

  node.addEventListener('click', handleClick, true);

  return {
    destroy() {
      node.removeEventListener('click', handleClick, true);
    }
  };
}

/* ------------------------------------------------------------------ Exports */

export let content;

export { cssClassNames as class };

export let onColor = null;

export let route = null;
export let routeOptions = { replaceCurrent: false };

/* ----------------------------------------------------------------- Reactive */

</script>

<div c-tab-icon
     {...$$restProps}
     class="x-on-{onColor} {cssClassNames}"
     use:tryRedirect
     on:click
     on:keypress
     role="button"
     tabindex="0">
  <svelte:component this={content} />
</div>

<style>
  [c-tab-icon] {
    cursor: pointer;
  }
  /*[c-tab-icon] { border: solid 1px blue; }*/
</style>