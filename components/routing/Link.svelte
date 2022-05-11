<script>
  // -- Imports

  import { expectString, expectObjectOrUndefined } from "$hk/expect.js";

  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  import { expectValidSurfaceColor } from "$hk-fe/theme.js";

  import {
    redirectTo,
    redirectToRoute,
    routePath } from "$hk-fe/stores/router.js";

  // -- Inherit link color using javascript (no css solution possible)

  let root;
  let inheritedColor;

  $: {
    if( root )
    {
      inheritedColor =
        window.getComputedStyle( root ).getPropertyValue("color");
    }
  }

  // -- Exports

  let cssClassNames = "";
  export { cssClassNames as class };

  export let onColor = null;

  $: expectValidSurfaceColor( onColor );

  export let path = undefined;
  export let routeTo = undefined;
  export let routeToOptions = undefined;

  $: {
    if( routeTo )
    {
      expectString( routeTo, "Invalid value for property [routeTo]");

      // @throws route not found
      path = routePath( routeTo );
    }

    expectObjectOrUndefined( routeToOptions,
      "Invalid value for property [routeToOptions]");

    expectString( path, "Missing or invalid property [path] or [routeTo]");
  }

  export let tabIndex="-1";

  function redirect()
  {
    // Dispatch click so parent can perform additional actions before the
    // route change
    dispatch("click");

    if( routeTo )
    {
      if( !routeToOptions )
      {
        redirectToRoute( routeTo );
      }
      else {
        redirectToRoute( routeTo, routeToOptions );
      }
    }
    else if( path ) {
      redirectTo( path );
    }
  }
</script>

<span bind:this={root}
      class="g-link-container g-no-select g-link-on-{onColor} {cssClassNames}">
  <a href="{path}"
     on:click|preventDefault={redirect} tabIndex={tabIndex}>
    <slot></slot>
  </a>
</span>
