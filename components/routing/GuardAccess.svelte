<script>

// -- Imports

import { expectString,
         expectObjectOrUndefined } from "$hk/expect.js";

import { currentRouteAndState,
         getCurrentPath,
         routePath,
         redirectToRoute } from "$hk-fe/stores/router.js";


// -- Exports

export let routeTo = "login";
export let routeToOptions = undefined;

// -- Check properties

$: {
  if( routeTo )
  {
    expectString( routeTo, "Invalid value for property [routeTo]");

    // @throws route not found
    /* path = */ routePath( routeTo );
  }

  expectObjectOrUndefined( routeToOptions,
    "Invalid value for property [routeToOptions]");

  // expectString( path, "Missing or invalid property [path] or [routeTo]");
}

// -- Validate access and redirect if no access

let accessAllowed = false;
let accessValidated = false;

$: {
  const access = $currentRouteAndState.access;

  accessAllowed = access.allowed;
  accessValidated = access.validated;

  if( accessValidated )
  {
    if( !accessAllowed )
    {
      console.log(
        `GuardAccess: no access at [${getCurrentPath()}]. ` +
        `Redirecting to [${routeTo}]`);

      // TODO: set route to use after login?

      redirectToRoute( routeTo, { replaceCurrent: true } );
    }
  }
}

</script>
{#if accessValidated && accessAllowed}
  <slot></slot>
{/if}