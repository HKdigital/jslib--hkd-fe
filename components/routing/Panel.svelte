<script>
  // -- Imports

  import { expectObject } from "@hkd-base/expect.js";

  import { expectValidSurfaceColor } from "@hkd-fe/helpers/colors.js";

  // -- Exports

  export let params = {};

  export let onColor;
  $: expectValidSurfaceColor( onColor );

  // -- Logic

  let _component;
  let _viewParams;

  $: {
    if( params )
    {
      expectObject( params,
        "Missing or invalid parameter [params]" );

      _component = params.component;

      expectObject( _component,
        "Missing or invalid parameter [params.component]" );

      _viewParams = {...params};

      // console.log("_viewParams", _viewParams);

      delete _viewParams.component;
    }
  }
</script>

{#if _component}
  <svelte:component
    this={_component}
    {onColor}
    viewParams={_viewParams}
    on:message />
{/if}
