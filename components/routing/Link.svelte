<script context="module">
  const fetched = new Map();

  export function preventDefaultOnOutbound( node, outbound=false ) {

    function _tryPreventDefault( e )
    {
      console.log( "outbound?", outbound );

      if( !outbound )
      {
        e.preventDefault();
      }
    }

    node.addEventListener("click", _tryPreventDefault, true);

    return {
      destroy() {
        node.removeEventListener("click", _tryPreventDefault, true);
      }
    };
  }

</script>

<script>
  /* ---------------------------------------------------------------- Imports */

  // import { createEventDispatcher } from 'svelte';
  // const dispatch = createEventDispatcher();

  import { redirectTo } from "@hkd-fe/stores/router.js";

  /* -------------------------------------------------------------- Internals */

  let anchorElement;

  /**
   * Prefetch the page from the location specified by href
   */
  async function prefetch()
  {
    if( fetched.has( href ) )
    {
      return;
    }

    const response = await fetch( href );

    if( response.ok )
    {
      fetched.set(href, true);
    }
  }

  function tryRedirect( /* e */ )
  {
    // console.log( "tryRedirect", e );

    if( !outbound )
    {
      redirectTo( href );
    }
    // else {
    //   //
    //   // Let default click handler perform the action
    //   //
    //   console.log("Click on anchor", anchorElement);
    // }
  }

  /* ---------------------------------------------------------------- Exports */

  /** Specify the `href` attribute. */
  export let href = "javascript:void(0);";

  /**
   * Set to `true` to disable the link.
   * A `span` tag will be rendered instead of `a`.
   */
  export let disabled = false;

  /**
   * Set to `true` to set `target="_blank"`
   * and `rel="noopener noreferrer"`.
   * @type {boolean}
   */
  export let outbound = undefined;

  /**
   * Specify the `target` attribute.
   * @type {"_self" | "_blank" | "_parent" | "_top"}
   */
  export let target = undefined;

  /**
   * Specify the `rel` attribute.
   * Set to "prefetch" to fetch the `href` value.
   * @type {string}
   */
  export let rel = undefined;

  /**
   * Set to `true` for the link to be active:
   * - link is given an "active" class
   * - `aria-current` is set to "page"
   */
  export let active = false;

  /* ------------------------------------------------------------------ Logic */

  $: {
    //
    // Automatically set property `outbound` if missing
    //
    if( outbound === undefined )
    {
      const host = new URL(href, location.origin).host;

      if( host !== location.host )
      {
        outbound = true;
      }
      else {
        outbound = false;
      }
    }
  }

  // ---------------------------------------------------------------------------

  $: {
    //
    // Set `target` and `rel` for outbound links
    //
    if( outbound )
    {
      target = "_blank";

      if( rel === undefined )
      {
        rel = "noopener noreferrer";
      }
    }
  }

</script>

{#if disabled}
  <span
    {...$$restProps}
    on:mouseover
    on:mouseenter
    on:mouseout
    on:focus
    on:blur
    on:keydown
  >
    <slot />
  </span>
{:else}
  <a
    bind:this={anchorElement}
    use:preventDefaultOnOutbound={outbound}
    on:click={tryRedirect}
    class:active
    aria-current={active ? "page" : undefined}
    {...$$restProps}
    {href}
    {target}
    {rel}
    on:mouseover
    on:mouseenter
    on:mouseenter={() => {
      if (rel === "prefetch") prefetch();
    }}
    on:mouseout
    on:focus
    on:blur
    on:keydown
  >
<!--

use:preProcessClick={ (e) => { e.jens=123; } }
use:preprocess={{event:"click", fn: (e) => { e.jens=123 } }}
on:click|preventDefault
on:click={tryRedirect}
-->
    <slot />
  </a>
{/if}