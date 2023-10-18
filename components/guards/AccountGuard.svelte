<script>

/* ------------------------------------------------------------------ Imports */

import { getCurrentPath,
         redirectToRoute }
  from "@hkd-fe/stores/router.js";

// -- Constants

import { ROUTE_LOGIN,
         ROUTE_CONFIRM_ACCOUNT }
  from "@src/constants/route-labels.js";

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

/**
 * Redirect to the login page
 */
function redirectToLogin()
{

  // TODO routeOptions: returnUrl?
  redirectToRoute( routeLogin, { replaceCurrent: true} );
}

/* ------------------------------------------------------------------ Exports */

export let routeLogin = ROUTE_LOGIN;

/* ----------------------------------------------------------------- Reactive */

$: {
  //
  // - Redirect to ROUTE_LOGIN if no identity has been set
  // - Otherwise start loading user profile
  //
  if( null === $identityTokenStore )
  {
    console.log("No $identityTokenStore");

    // token has been set to null (expired or it does not exists)
    // -> redirect

    log.debug(
      `AccountGuard: condition failed (missing or expired identity token) ` +
      `at [${getCurrentPath()}]. Redirecting to [${ROUTE_LOGIN}]`);

    redirectToLogin();
  }
}

// ---- ----

$: {
  //
  // If $accountAndIdentityStore has data
  // => show Content
  //
  // Else if $accountAndIdentityStore has been set to `null`
  // => redirect to login
  //
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
  else if( null === $accountAndIdentityStore )
  {
    console.log("AccountGuard: condition failed (missing account)");
    redirectToLogin();
  }
}

</script>
{#if enableContent}
<slot></slot>
{/if}