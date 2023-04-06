<script>

/* ------------------------------------------------------------------ Imports */

import { getCurrentPath,
         redirectToRoute } from "@hkd-fe/stores/router.js";

// -- Constants

// import { ROUTE_LOGIN }
//   from "@src/constants/route-labels.js";

import { ROUTE_NO_ACCESS }
  from "@src/constants/route-labels.js";

// -- Services

import { BACKEND_SERVICE_NAME } from "@src/constants/service-names.js";

import InitService
  from "@hkd-base/services/InitService.js";

// -- Logging

import { getModuleLogger }
  from "@hkd-base/helpers/log.js";

const log = getModuleLogger( "IdentityTokenGuard.svelte" );

/* ---------------------------------------------------------------- Internals */

let enableContent = false;

const BackendService = InitService.service( BACKEND_SERVICE_NAME );

const identityTokenStore = BackendService.getIdentityTokenStore();

/* ------------------------------------------------------------------ Exports */

/* ----------------------------------------------------------------- Reactive */

$: {
  // log.debug( "identityToken", identityTokenStore.get() );

  if( null === $identityTokenStore )
  {
    // token has been set to null (expired or it does not exists)
    // -> redirect

    log.debug(
      `Condition failed (missing or expired identity token) ` +
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