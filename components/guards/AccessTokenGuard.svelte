<script>

/* ------------------------------------------------------------------ Imports */

import { getCurrentPath,
         redirectToRoute } from "@hkd-fe/stores/router.js";

// -- Constants

import { ROUTE_NO_ACCESS }
  from "@src/constants/route-labels.js";

// -- Services

import { BACKEND_SERVICE_NAME } from "@src/constants/service-names.js";

import InitService
  from "@hkd-base/services/InitService.js";

// -- Logging

import { getModuleLogger }
  from "@hkd-base/helpers/log.js";

const log = getModuleLogger( "AccessTokenGuard.svelte" );

/* ---------------------------------------------------------------- Internals */

let enableContent = false;

const BackendService = InitService.service( BACKEND_SERVICE_NAME );

const accessTokenStore = BackendService.getAccessTokenStore();

/* ------------------------------------------------------------------ Exports */

/* ----------------------------------------------------------------- Reactive */

$: {
  // log.debug( "accessToken", accessTokenStore.get() );

  if( null === $accessTokenStore )
  {
    // token has been set to null (expired or it does not exists)
    // -> redirect

    log.debug(
      `Condition failed (missing or expired access token) ` +
      `at [${getCurrentPath()}]. Redirecting to [${ROUTE_NO_ACCESS}]`);

    redirectToRoute( ROUTE_NO_ACCESS ); // TODO routeOptions: returnUrl?
  }
  else {
    enableContent = true;
  }
}

</script>

{#if enableContent}
<slot></slot>
{/if}