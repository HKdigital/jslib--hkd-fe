
/**
 * This file contains frontend router functionality.
 * It uses the browsers History API, especially `pushState` and `replaceState`
 * to manage a route's state.
 *
 * How it works:
 *
 * - Internally there is a single FrontendRouter instance that keeps track of
 *   the available routes and route and state changes.
 *
 * - This file exports methods to use and control the FrontendRouter instance
 *
 * - The history state is stored by the browser and restores after a page reload
 *
 * - First routes should be configured using the method `configureRoutes`,
 *   to tell the FrontendRouter instance about the available routes
 *
 * e.g. configureRoutes( [
 *   {
 *     label: "/",
 *
 *     layout: {
 *       component: AppLayout,
 *       onColor: SURFACE_LIGHT
 *     },
 *
 *     panels:
 *     {
 *       backgroundPanel: {
 *         component: BackgroundPanelHome
 *       },
 *
 *       topPanel: {
 *         component: TopPanelHome
 *       },
 *
 *       contentPanel: {
 *         component: ContentPanelHome
 *       }
 *     }
 *   },
 *   ...
 * ] );
 *
 * Route changes can be triggered:
 * - Modifying the address in the browser's location bar
 * - Via methods of the FrontendRouter instance
 *
 *   e.g. redirectToRoute("/");
 *
 * The current state and route can be watched, so components can react to route
 * changes.
 * - The FrontendRouter instance offers methods to get `stores` that will
 *   contain the route and or state updates
 *
 *   (1a) e.g. to receive state updates for the current route:
 *
 *   const currentState = getStateStoreForCurrentRoute();
 *
 *   -> This store stops updating value swhen the route changes (to prevent
 *      quicks inside component when the route changes)
 *
 *   (1b) e.g. to receive access updates for the current route:
 *
 *   const currentAccess = getAccessStoreForCurrentRoute();
 *
 *   -> This store stops updating value swhen the route changes (to prevent
 *      quicks inside component when the route changes)
 *
 *   (2) e.g. to receive route, state and access changes
 *
 *   You might want to use this for components that are are not destroyed
 *   when a route changes, e.g. a layout component.
 *
 *   routeStateAccessStore.subscribe( ( route, state, access ) => { ... } );
 */

/* ------------------------------------------------------------------ Imports */

import router from "@hkd-fe/classes/FrontendRouter.js";

/* ---------------------------------------------------------------- Internals */

/* ------------------------------------------------------------------ Exports */

export const {
  configureRoutes,

  getRouteStore,

  getStateStoreForCurrentRoute,
  getAccessStoreForCurrentRoute,

  routeStateAccessStore,

  redirectTo,
  redirectToRoute,

  goHome,
  goBack,
  canGoBack,

  updateStateData,
  removeSearchParams,

  updateReturnStateData,
  redirectToReturnState,

  pushState,
  replaceState,

  getStateData,
  getCurrentPath,

  routePath,
  getRoute,

  gotoRouteMainMenu,

  getLabelHome,
  getLabelNotFound,
  getLabelMainMenu } = router;

/* --------------------------------------------- Hot Module Replacement (dev) */

if( import.meta.hot )
{
  import.meta.hot.accept( () => {
    import.meta.hot.invalidate(); // Force page reload
  } );
}
