<script>

/* ------------------------------------------------------------------ Imports */

  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  import { menu, close }
    from "@hkd-fe/components/icons/paths/material-symbols-f0w100g200os48.js";

  import BlockSymbol from "@hkd-fe/components/icons/BlockSymbol.svelte";

/* ---------------------------------------------------------------- Internals */

/**
 * If the button is not disabled: dispatch a click event
 */
function tryDispatchClick( /* event */ )
{
  if( !disabled )
  {
    if( showMenuButton )
    {
      dispatch('showMenu');
    }
    else {
      dispatch('close');
    }
  }
}

/**
 * Prevent default browser on click event if the user selects the element and
 * presses enter
 *
 * @param {object} event
 */
function preventClickOnEnter( event )
{
  if( 13 === event.keyCode )
  {
    event.preventDefault();
  }
}

/* ------------------------------------------------------------------ Exports */

export let onColor;

export let disabled = false;
export let showMenuButton = false;

/* -------------------------------------------------------------------- Logic */

// import 'material-symbols';

</script>

{#if showMenuButton}
  <BlockSymbol path={menu} on:click={tryDispatchClick} />
{:else}
  <BlockSymbol path={close} on:click={tryDispatchClick} />
{/if}