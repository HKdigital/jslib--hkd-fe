<script>

/* ------------------------------------------------------------------ Imports */

import { getCurrentPath,
         redirectToRoute } from "@hkd-fe/stores/router.js";

// -- Constants

import { ROUTE_LOGIN } from "@src/config/route-labels.js";

// -- Services

import { BACKEND_SERVICE_NAME } from "@src/constants/service-names.js";

import InitService
  from "@hkd-base/services/InitService.js";

// -- Logging

import { getModuleLogger }
  from "@hkd-base/helpers/log.js";

const log = getModuleLogger( "Guard.svelte" );

/* ---------------------------------------------------------------- Internals */

let enableContent = false;

const BackendService = InitService.service( BACKEND_SERVICE_NAME );

let identityTokenStore = BackendService.getIdentityTokenStore();

/* ------------------------------------------------------------------ Exports */

/* ----------------------------------------------------------------- Reactive */

$: {
  // log.debug( 123, identityTokenStore );

  if( null === $identityTokenStore )
  {
    // token has been set to null (expired or it does not exists)
    // -> redirect

    log.debug(
      `IndentityGuard: condition failed (missing or expired identity token) ` +
      `at [${getCurrentPath()}]. Redirecting to [${ROUTE_LOGIN}]`);

    redirectToRoute( ROUTE_LOGIN ); // TODO routeOptions: returnUrl?
  }
  else {
    enableContent = true;
  }
}

</script>

{#if enableContent}
<slot></slot>
{/if}