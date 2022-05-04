
/**
 * This file contains frontend router functionality.
 * It uses the browsers History API, especially `pushState` and `replaceState`
 * to manage a route's state.
 *
 * - The history state is stored by the browser and restores after a page reload
 *
 * How it works:
 *
 * First routes should be configured using the method `configureRoutes`. This
 * way, the Navigator knows about the available routes and how to respond
 * to route changes.
 *
 * e.g. configureRoutes( ... );
 *
 * Routes can be changed by modifying the address in the browser's location bar
 * or via a Navigator method.
 *
 * e.g. redirectToRoute("/");
 *
 * The current state and route can be watched by subscribing to a store supplied
 * by the Navigator.
 *
 * e.g. const currentState = getCurrentStateStore();
 */

/* ------------------------------------------------------------------ Imports */

import Navigator from "@hkd-fe/classes/Navigator.js";

/* ---------------------------------------------------------------- Internals */

/* ----------------------------------------------------------- Export default */

const nav = new Navigator();

/* Configure navigator */
export const configureRoutes = nav.configureRoutes.bind( nav );

/* Current route and state info */
export const getCurrentStateStore = nav.getCurrentStateStore.bind( nav );
export const currentRouteAndState = nav.currentRouteAndState;

/* Methods that change the current state */
export const redirectTo = nav.redirectTo.bind( nav );
export const redirectToRoute = nav.redirectToRoute.bind( nav );

export const goBack = nav.goBack.bind( nav );
export const canGoBack = nav.canGoBack.bind( nav );

export const updateStateData = nav.updateStateData.bind( nav );

export const removeSearchParams = nav.removeSearchParams.bind( nav );

export const updateReturnStateData = nav.updateReturnStateData.bind( nav );
export const redirectToReturnState = nav.redirectToReturnState.bind( nav );

/* Less used */
export const pushState = nav.pushState.bind( nav );
export const replaceState = nav.replaceState.bind( nav );

export const getStateData = nav.getStateData.bind( nav );
export const getCurrentPath = nav.getCurrentPath.bind( nav );

export const routePath = nav.routePath.bind( nav );
export const getRoute = nav.getRoute.bind( nav );

/* --------------------------------------------- Hot Module Replacement (dev) */

if( import.meta.hot )
{
  import.meta.hot.accept( () => {
    import.meta.hot.invalidate(); // Force page reload
  } );
}
