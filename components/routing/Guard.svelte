<script>
import { expectString,
         expectObjectOrUndefined } from "$hk/expect.js";

import { getCurrentPath,
         routePath,
         redirectToRoute } from "$hk-fe/stores/router.js";

export let routeTo = undefined;
export let routeToOptions = undefined;

export let redirectIf = false;

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

$: {
  if( redirectIf )
  {
    console.log( "****redirectIf", redirectIf );

    console.log(
      `Guard: condition failed at [${getCurrentPath()}]. ` +
      `Redirecting to [${routeTo}]`);

    redirectToRoute( routeTo, routeToOptions );
  }
}
</script>
<slot></slot>