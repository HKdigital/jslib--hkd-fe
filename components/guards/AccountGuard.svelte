<script>

/* ------------------------------------------------------------------ Imports */

import { getCurrentPath,
         redirectToRoute } from "@hkd-fe/stores/router.js";

// -- Constants

import { ROUTE_LOGIN,
         ROUTE_CONFIRM_ACCOUNT } from "@src/config/route-labels.js";

// -- Stores

import { identityTokenStore,
         accountAndIdentityStore }
  from "@src/stores/account-and-identity.js";

// -- Logging

import { getModuleLogger }
  from "@hkd-base/helpers/log.js";

const log = getModuleLogger( "AccountGuard.svelte" );

/* ---------------------------------------------------------------- Internals */

let enableContent = false;

/* ------------------------------------------------------------------ Exports */

/* ----------------------------------------------------------------- Reactive */

$: {
  //
  // - Redirect to ROUTE_LOGIN if no identity has been set
  // - Otherwise start loading user profile
  //
  if( null === $identityTokenStore )
  {
    // token has been set to null (expired or it does not exists)
    // -> redirect

    log.debug(
      `AccountGuard: condition failed (missing or expired identity token) ` +
      `at [${getCurrentPath()}]. Redirecting to [${ROUTE_LOGIN}]`);

    // TODO routeOptions: returnUrl?
    redirectToRoute( ROUTE_LOGIN, { replaceCurrent: true} );
  }
}

$: {
  if( $accountAndIdentityStore )
  {
    if( $accountAndIdentityStore.account._id )
    {
      enableContent = true;
    }
    else {
      // No userProfile => redirect
      redirectToRoute( ROUTE_CONFIRM_ACCOUNT ); // TODO routeOptions: returnUrl?
    }
  }
}

</script>
{#if enableContent}
<slot></slot>
{/if}