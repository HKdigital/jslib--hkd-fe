
/* ------------------------------------------------------------------ Imports */

import {
  expectString,
  expectNotEmptyString,
  expectArray,
  expectObject }
  from "@hkd-base/helpers/expect.js";

import { defer }
  from "@hkd-base/helpers/process.js";

import { equals }
  from "@hkd-base/helpers/compare.js";

import { clone, updateObject }
  from "@hkd-base/helpers/object.js";

import { generateLocalId }
  from "@hkd-base/helpers/unique.js";

import ValueStore
  from "@hkd-base/classes/ValueStore.js";

import DerivedStore
  from "@hkd-base/classes/DerivedStore.js";

import { currentLanguage,
         LANG_DEFAULT }
  from "@hkd-base/stores/language.js";

import PathMatcher
  from "@hkd-fe/classes/PathMatcher.js";

import LogBase
  from "@hkd-base/classes/LogBase.js";

import RouteStateStore
  from "@hkd-fe/classes/RouteStateStore.js";

import HistoryStorage
  from "@hkd-fe/classes/HistoryStorage.js";

/* ---------------------------------------------------------------- Internals */

const pathMatcher$ = Symbol();
const routesByLangAndLabel$ = Symbol();

const homeLabel$ = Symbol();
const notFoundLabel$ = Symbol();

const offs$ = Symbol();

// const HISTORY_STORAGE_LABEL = "frontend-router/history";

const ALLOWED_STATE_PROPERTIES = new Set( ["data", "id", "path"] );

const DEFAULT_ROUTE_HOME = "/";
const DEFAULT_ROUTE_NOT_FOUND = "not-found";

// -----------------------------------------------------------------------------

/**
 * Strip hash from a path
 *
 * @param {string} path
 *
 * @returns {string} path without hash part
 */
function stripHash( path )
{
  let index = path.indexOf("#");

  if( index > -1 )
  {
    return path.slice( 0, index );
  }

  return path;
}

// -----------------------------------------------------------------------------

//
// A single instance of the FrontendRouter class will be assigned to the
// variable `router`
//
let router;

/**
 * Class that will be instantiated only once and handles the routing magic
 */
class FrontendRouter extends LogBase
{
  /**
   * Construct a FrontendRouter (frontend router) instance
   */
  constructor()
  {
    super();

    if( router )
    {
      throw new Error("Variable [router] has already been assigned");
    }

    //
    // Assign this (the only) instance to variable `router`
    //
    // - The class uses the variable `router` internally instead of `this`,
    //   so exported methods do not need to be bound
    //
    router = this;

    router[ offs$ ] = {};

    // -- Create path matcher (used to match routes)

    router[ pathMatcher$ ] = new PathMatcher();

    // -- Default route labels

    router[ homeLabel$ ] = DEFAULT_ROUTE_HOME;
    router[ notFoundLabel$ ] = DEFAULT_ROUTE_NOT_FOUND;

    // -- Routes by language and route label

    router[ routesByLangAndLabel$ ] = {};


    // router.log.debug( "-> constructor");

    // -- historyStorage manages history in sessionStorage

    router.historyStorage = new HistoryStorage();

    // -- routeStateStore contains the current route and state

    const routeStateStore =
      router.routeStateStore = new RouteStateStore();

    router.routeLabelStore =
      new DerivedStore( [ routeStateStore ], () =>
        {
          return routeStateStore.get().route.label;
        } );

    router.userHash = new ValueStore();

    // const off =
    routeStateStore.configureEventListener(
      {
        target: window,
        eventName: "popstate",
        callbackFn: ( /* e, { target, stream } */ ) =>
          {
            router.log.debug("Popstate");

            //
            // @note popstate only fires if the page has been interacted with
            //

            let stateFromHistory = router.historyStorage.tryGoBack();

            // router.log.debug( "popstate", { href: location.href, stateFromHistory } );

            if( router._isValidCurrentState( stateFromHistory ) )
            {
              router._updateRouteStateStore();
              //
              // event handler return value
              // `false` prevents browser (safari) from a complete page reload
              //
              return false;
            }
            else {
              //
              // No valid current state found
              //
              // @note popstate only fires if the page has been interacted with
              //
              // -> set value in store `userHash`
              //
              // NOT ANYMORE -> remove hash (contains invalid state id)
              //
              // -> Keeping hash, since it sometimes is used by landing pages
              // -> create new state (add removedHash as property)
              //
              // router.log.debug("popstate: create new state");

              //
              // Remove hash from location.href (if any)
              // - the hash is part of the path and is used to identify the
              //   state in history
              //

              // this.log.debug("popstate");

              router.userHash.set( location.hash.slice(1) );

              const path =
                router._stripPath(
                  location.href, { includeSearch: true, includeHash: false } );

              window.history.replaceState( null, '', path );

              let newState = router._stateFromLocationHref();

              // newState[ "userHash" ] = userHash;
              // console.log( "newState, hash", newState, hash );

              router.historyStorage.push( newState );

              router._updateRouteStateStore();
            }

            return false;
          }
      } );

    // const off =
    routeStateStore.configureStoreSubscriber(
      {
        store: currentLanguage,
        callbackFn: ( value, { store, stream } ) =>
          {
            //
            // An update of the current language might cause a route change
            // (if the routes are configured for multiple languages)
            //

            //
            // !! NOT IMPLEMENTED YET !!!!
            //
            // TODO: GET CURRENT PATH AND FIND THE PATH FOR THE NEW LANGUAGE,
            //       THEN REDIRECT
            //
          }
      } );

    //
    // TEST: subscribe to ensure that the event listeners are enabled
    //
    // defer( () => {
    //   routeStateStore.subscribe( () => {} );
    // } );
  }

  // ---------------------------------------------------------------------------

  /**
   * Configure routes
   * - Process a list of route definitions
   * - Sets or replaces all routes the router knows about
   *
   *  --
   *  @typedef {object} Route
   *
   *  @property {string} label
   *
   *    e.g. label = "/"
   *
   *  @property {string} path
   *
   *    e.g. path="/"
   *
   *  @property {string} [lang=LANG_DEFAULT]
   *
   *  @property {string} [redirectToRoute]
   *
   *    e.g. redirectToRoute: "/welcome"
   *
   *  DEPRECEATED @property {boolean} [allowGuest=true]
   *  DEPRECEATED @property {string} [requireGroup]
   *  DEPRECEATED
   *  DEPRECEATED   e.g. requireGroup: "registered"
   *
   *  @property {object} layout
   *  @property {object} layout.component
   *  @property {object} layout.backgroundColor
   *
   *    e.g.
   *
   *    layout: {
   *      component: AppLayout,
   *      backgroundColor: SURFACE_WHITE
   *    }
   *
   *  @property {object} panels
   *  @property {object} panels.<bar-or-panel-name>
   *
   *    e.g.
   *
   *    panels:
   *    {
   *      topPanel: {
   *        component: TopPanelTitleAndClose,
   *        title: "Instellingen",
   *        backgroundColor: SURFACE_WHITE
   *      },
   *
   *      contentPanel: {
   *        component: TodoEN
   *      }
   *    }
   *
   *  --
   *
   * @param {Route[]} routes
   */
  configureRoutes( routes )
  {
    // router.log.debug("configureRoutes");

    expectArray( routes, "Missing or invalid configuration [routes]" );

    router[ pathMatcher$ ] = new PathMatcher();

    let homeLabel = null;
    let notFoundLabel = null;

    for( const route of routes )
    {
      expectObject( route,
        "Invalid configuration [routes] (items should be objects)" );

      // -- Process property `label`

      const label = route.label;

      expectString( label,
        "Invalid configuration [routes] " +
        "(missing or invalid property item.label)" );

      // -- Process property `isHome`

      if( "isHome" in route )
      {
        homeLabel = label;
      }

      // -- Process property `isNotFound`

      if( "isNotFound" in route )
      {
        notFoundLabel = label;
      }

      // -- Process property  `language`

      let language = route.language;

      if( language )
      {
        expectString( language,
          "Invalid configuration [routes] " +
          "(invalid property item.language)" );
      }
      else {
        language = LANG_DEFAULT;
      }

      // -- Process property `path`

      let path;

      if( "path" in route )
      {
        path = route.path;
      }
      else {
        //
        // No path defined for route: generate path from label
        //
        if( "/" !== label.charAt(0) )
        {
          // Prepend a slash (to make it a path)
          path = `/${label}`;
        }
        else {
          path = label;
        }

        route.path = path;
      }

      expectString( path,
        "Invalid configuration [routes] " +
        "(missing or invalid property item.path)" );

      // -- Process property `layout`

      if( route.layout )
      {
        try {
          router._normalizeLayoutOrPanelParams(
            route.layout, { routePartName: "layout", label } );
        }
        catch( e )
        {
          throw new Error(
            "Invalid configuration [layout]", { cause: e } );
        }
      }
      else {
        route.layout = null;
      }

      // -- Process property `panels`

      if( route.panels )
      {
        const panels = route.panels;

        expectObject( panels,
          "Invalid configuration (missing or invalid property [item.panels])" );

        for( const key in panels )
        {
          const panel = panels[ key ];

          try {
            router._normalizeLayoutOrPanelParams(
              panel, { routePartName: key, label } );
          }
          catch( e )
          {
            throw new Error(
              `Invalid configuration [panels[${key}]]`, { cause: e } );
          }
        }
      }
      else {
        route.panels = {};
      }

      // -- Process property `redirectToRoute`

      if( route.redirectToRoute )
      {
        expectString( route.redirectToRoute,
          "Invalid configuration " +
          "(invalid property [route.redirectToRoute])" );
      }

      // -- Add route to path matcher

      router[ pathMatcher$ ].add( path, route );

      // -- Add route to routesByLangAndLabel (used by method getRoute)

      router[ routesByLangAndLabel$ ][ `${language}:${label}` ] = route;

    } // end for

    // -- Set default routes

    if( homeLabel )
    {
      router[ homeLabel$ ] = homeLabel;
    }
    else {
      router[ homeLabel$ ] = DEFAULT_ROUTE_HOME;
    }

    if( notFoundLabel )
    {
      router[ notFoundLabel$ ] = notFoundLabel;
    }
    else {
      router[ notFoundLabel$ ] = DEFAULT_ROUTE_NOT_FOUND;
    }

    // router.log.debug("Initial update", location.hash);

    router.userHash.set( location.hash.slice(1) );

    // -- Handle redirect if it applies to the current route

    if( !router._tryCurrentRouteIsRedirect() )
    {
      //
      // No redirect in route -> force initial update
      //
      // Use defer, because configureRoutes might be called during bootstrap
      // and components might not be ready yet
      //

      let currentState = router.historyStorage.getLatest();

      if( !router._isValidCurrentState( currentState ) )
      {
        // Not a valid state => remove hash

        const path =
          router._stripPath(
            location.href, { includeSearch: true, includeHash: false } );

        window.history.replaceState( null, '', path );

        let newState = router._stateFromLocationHref();

        // newState[ "userHash" ] = userHash;
        // console.log( "newState, hash", newState, hash );

        router.historyStorage.push( newState );
      }

      router._firstUpdateDone = true;

      // defer( router._updateRouteStateStore );
      router._updateRouteStateStore();
    }
  }

  // ---------------------------------------------------------------------------

  /**
   * Get a store that outputs the state for the current route only
   * - When the route path changes, values in the store will no longer be
   *   updated. This prevents state changes that are meant for other routes
   *   to propagate in the components of the previous route.
   *
   * The store auto destructs when:
   * - When the route path changes
   * - When the last subscriber unsubscribes
   *
   * When the store has been destructed, values in the store will no longer be
   * updated.
   *
   * @returns {object} current state store instance
   */
  getStateStoreForCurrentRoute()
  {
    // router.log.debug( "-> getStateStoreForCurrentRoute()" );

    // -- Store original path upon creation of the store

    const originalPath =
      router.getCurrentPath( { includeSearch: true, includeHash: false } );

    // -- Create new `currentStateStore`

    const { state: initialValue } = router.getRouteAndState();

    const currentStateStore = new ValueStore( initialValue );

    // -- Create unique entries for storing unsubscribe methods

    const unsubscribe$ = Symbol();
    const unsubscribeHasSubscribers$ = Symbol();

    // -- Handle store subscribers and data updates

    let previousState = null;

    router[ offs$ ][ unsubscribeHasSubscribers$ ] =
      currentStateStore
        .hasSubscribers.subscribe( ( $hasSubscribers ) =>
    {
      // console.log(
      //   "currentStateStore.hasSubscribers", $hasSubscribers );

      if( $hasSubscribers )
      {
        router[ offs$ ][ unsubscribe$ ] =
          router.routeStateStore
            .subscribe( ( routeAndState ) =>
          {
            const currentState = routeAndState.state;

            const currentPath = stripHash(currentState.path);

            if( originalPath === currentPath )
            {
              if( !equals( currentState, previousState ) )
              {
                // @note duplicate states are skipped

                previousState = currentState;

                // Set current state

                currentStateStore
                  .set( { data: {}, ...currentState } );
              }
            }
            else {
              // Path changed -> stop store
              router._turnOff( unsubscribe$, unsubscribeHasSubscribers$ );
            }
          } );
      }
      else {
        // No more subscribers -> stop store
        router._turnOff( unsubscribe$, unsubscribeHasSubscribers$ );
      }
    } );

    return currentStateStore;
  }

  // ---------------------------------------------------------------------------

  /**
   * Redirect to the specified path
   * - Updates the window history state
   *
   * @param {string} path - URL path to redirect to
   *
   * @param {boolean} [options.replaceCurrent=false]
   * @param {object} [options.stateData] - Data for the state to set
   * @param {object} [options.returnState]
   *   Return state, can be used by the current route to redirect
   *   `back` to a return state.
   * @param {boolean} [options.defer=false]
   *   Use defer to make redirect async
   */
  redirectTo( path, options )
  {
    expectString( path, "Missing or invalid parameter [path]" );

    // router.log.debug("redirectTo", path, options );

    let plainPath = router._stripPath( path );

    const route = router[ pathMatcher$ ].matchOne( plainPath );

    if( !route )
    {
      throw new Error(`No route found for path [${plainPath}]`);
    }

    // router.log.debug("redirectTo: route found", route);

    // -- Handle [redirectToRoute] property

    if( route.data.redirectToRoute )
    {
      router.redirectToRoute( route.data.redirectToRoute );
      return;
    }

    // -- Navigate [window.history] and update [stateHistory]

    let {
      stateData,
      returnState,
      replaceCurrent=false,
      defer:_defer=false } = options || {};

    // console.log("redirectTo: options", options );

    const newState = { path };

    if( stateData )
    {
      expectObject( stateData,
        "Invalid value for parameter [stateData]" );

      newState.data = stateData;
    }

    if( returnState )
    {
      if( !returnState.data )
      {
        returnState.data = {};
      }

      if( newState.data )
      {
        newState.data.returnState = returnState;
      }
      else {
        newState.data = { returnState };
      }
    }

    // console.log(`redirectTo [path=${path}]`, options);

    if( !_defer )
    {
      if( replaceCurrent )
      {
        router.replaceState( newState );
      }
      else {
        router.pushState( newState );
      }
    }
    else {
      defer( () => {
        if( replaceCurrent )
        {
          router.replaceState( newState );
        }
        else {
          router.pushState( newState );
        }
      } );
    }
  }

  // ---------------------------------------------------------------------------

  /**
   * Redirect to the specified route
   *
   * @param {string} label
   *
   * @param {string|null} [options.lang=null]
   * @param {boolean} [options.replaceCurrent=false]
   *
   * @param {object} [options.stateData] - Data for the state to set
   * @param {object} [options.vars] - Route variables
   */
  redirectToRoute( label, options )
  {
    // router.log.debug("redirectToRoute", label);

    expectString( label, "Missing or invalid parameter [label]" );

    let path;

    if( options )
    {
      expectObject( options, "Missing or invalid parameter [options]" );

      path = router.routePath( label, options.lang );
    }
    else {
      path = router.routePath( label );
    }

    if( !path )
    {
      throw new Error(`No path found for route with label [${label}]`);
    }

    // -- Apply route variables

    if( options && options.vars )
    {
      path = router.applyPathVars( { path, vars: options.vars } );
    }

    // console.log(`redirectToRoute [label=${label}], [path=${path}]`, options);

    router.redirectTo( path, options );
  }

  // ---------------------------------------------------------------------------

  /**
   * Apply variables to a route path
   *
   * @param {string} _.path
   *   Path that contains variables (e.g. /view/:uriName)
   *
   * @param {object} _.vars
   *   Object with key-value pairs for path variables
   *
   * @returns {string} path with substituted variables
   */
  applyPathVars( { path, vars }={} )
  {
    expectString( path,
      "Missing or invalid parameter [path]" );

    expectObject( vars,
      "Missing or invalid parameter [vars]" );

    if( vars )
    {
      for( const key in vars )
      {
        const value = vars[ key ];

        const index = path.indexOf(`:${key}`);

        if( -1 === index)
        {
          throw new Error(`Route does not contain variable [${key}]`);
        }

        const pre = path.slice( 0, index );
        const post = path.slice( index + key.length + 1 );

        path = pre + value + post;

      } // end for
    }

    // -- Check if all route variables have been set

    if( path.includes(":") )
    {
      throw new Error( `Missing route variables in path [${path}]` );
    }

    return path;
  }

  // ---------------------------------------------------------------------------

  /**
   * Return true if the current route is the home route
   *
   * @returns {boolean} true if on the home route
   */
  isHome()
  {
    const homeLabel = router[ homeLabel$ ];

    const { route } = router.routeStateStore.get();

    return ( homeLabel === route.label );
  }

  // ---------------------------------------------------------------------------

  /**
   * Redirect to the home route
   */
  goHome( { replaceCurrent=true }={} )
  {
    const homeLabel = router[ homeLabel$ ];

    const { route } = router.routeStateStore.get();

    if( homeLabel !== route.label )
    {
      // Not already on home route -> redirect
      router.redirectToRoute( homeLabel, { replaceCurrent } );
    }
  }

  // ---------------------------------------------------------------------------

  /**
   * Returns true if a history.back() operation would lead to an "in-app" page
   *
   * @returns {boolean} true if the previous page was an in-app page
   */
  canGoBack()
  {
    return router.historyStorage.canGoBack();
  }

  // ---------------------------------------------------------------------------

  /**
   * Try to go back to the previous page
   * - This method will only navigate back if there a previous history
   *   item exists
   *
   * @returns {boolean} false if the location was not navigated back in history
   */
  goBack()
  {
    const newState = router.historyStorage.tryGoBack();

    if( newState )
    {
      //
      // storage history went back -> update browser history too
      //
      // @note browser history only contains the path since state data is
      //       stored in the historyStorage
      //

      window.history.replaceState( null, '', newState.path );

      router._updateRouteStateStore();

      return true;
    }

    return false;
  }

  // ---------------------------------------------------------------------------

  /**
   * Go back or go home if no previous page is available
   */
  goBackOrHome()
  {
    if( !router.goBack() )
    {
      router.goHome();
    }
  }

  // ---------------------------------------------------------------------------

  /**
   * Update the state data
   * - The update data will be applied to the existing state data
   * - Pushes the new state to the state history
   *
   * @param {object|iterable|null} [updateData]
   *   Mains state data to update. If set to [null] all main state
   *   properties will be cleared.
   *
   * @param {boolean} [{replaceCurrent=false}]
   */
  updateStateData( updateData, { replaceCurrent=false }={} )
  {
    const currentState = router._getOrCreateCurrentState();

    const currentStateData = currentState.data;

    let updatedData =
      router._cloneAndUpdate( currentStateData, updateData );

    if( equals( currentStateData, updatedData ) )
    {
      // State unchanged
      // replaceCurrent = true; // ?
      return;
    }

    //console.log( currentState.data, updatedData );


    const newState = currentState;

    newState.data = updatedData;

    if( !replaceCurrent )
    {
      router.pushState( newState );
    }
    else {
      router.replaceState( newState );
    }
  }

  // ---------------------------------------------------------------------------

  /**
   * Remove the query (search) part of the url
   * - Replaces the current state
   */
  removeSearchParams()
  {
    const currentState = router._getCurrentState();

    if( !currentState.search )
    {
      return;
    }

    let path =
      router._stripPath(
        location.href, { includeSearch: false, includeHash: true } );

    router.redirectTo( path,
      {
        stateData: currentState.data,
        replaceCurrent: true
      } );
  }

  // ---------------------------------------------------------------------------

  /**
   * Update the main state of the return state
   * - The update data will be applied to the existing return state
   * - Replaces the current state in the state history
   *
   * @param {object|iterable|null} [updateData]
   *   Return state data to update. If set to [null] all return state data
   *   properties will be cleared.
   */
  updateReturnStateData( updateData )
  {
    const currentState = router._getOrCreateCurrentState();

    if( !currentState.data || !currentState.data.returnState )
    {
      throw new Error(`Missing [currentState.data.returnState]`);
    }

    const newState = currentState;

    if( updateData )
    {
      const returnState = newState.data.returnState;

      let updatedReturnStateData =
        router._cloneAndUpdate( returnState.data, updateData );

      newState.data.returnState.data = updatedReturnStateData;
    }
    else {
      // updateData = null -> clear return state data
      newState.data = {};
    }

    router.replaceState( newState );
  }

  // ---------------------------------------------------------------------------

  /**
   * Redirect the return state
   * - The `returnState` is determined by the returnState
   *
   * @param {object|iterable|null} updateData
   *   Data to update the property `returnState.data` before redirecting
   *   If set to [null], all return state data will be deleted
   *
   * @param {object} [options]
   * @param {boolen} [options.goBackFirst=true] - If true, the current
   */
  redirectToReturnState( updateData, options )
  {
    let goBackFirst = true;

    if( options && !options.goBackFirst )
    {
      goBackFirst = false;
    }

    let currentState = router.historyStorage.getLatest();

    let returnState = currentState.data.returnState;

    if( !returnState )
    {
      throw new Error("Missing [currentState.data.returnState]");
    }

    if( updateData )
    {
      router.updateReturnStateData( updateData );

      //
      // Latest history item changed -> get again
      //
      // FIXME: make more efficient
      //
      currentState = router.historyStorage.getLatest();

      returnState = currentState.data.returnState;

      // console.log("*** redirectToReturnState: updated currentState", currentState );
    }
    else if( null === updateData )
    {
      // updateData = null -> delete property
      delete returnState.data;
    }

    router._normalizeState( returnState );

    // console.log("*** redirectToReturnState", returnState );

    // Go back and replace the previous state by the `returnState`
    router.replaceState( returnState, { goBackFirst } );
  }

  // ---------------------------------------------------------------------------

  /**
   * Returns the current route label
   */
  getCurrentRouteLabel()
  {
    const { route } = router.routeStateStore.get();

    return route.label;
  }

  // ---------------------------------------------------------------------------

  /**
   * Returns the current path
   * - Gets the path from `location.href`
   *
   * @param {boolean} [options.includeSearch=true]
   * @param {boolean} [options.includeHash=true]
   *
   * @returns {string} the current path
   */
  getCurrentPath( options={} )
  {
    const { includeSearch=true, includeHash=true } = options;

    return router
      ._stripPath( location.href, { includeSearch, includeHash } );
  }

  // ---------------------------------------------------------------------------

  /**
   * Get the current state data
   * - Returns an empty object if no state data was set
   *
   * @returns {object} current main state
   */
  getStateData()
  {
    const currentState = router._getCurrentState();

    if( currentState )
    {
      return currentState.data || {};
    }

    return {};
  }

  // ---------------------------------------------------------------------------

  /**
   * Get the current route and state
   * - The state is the latest item from the history storage or a new
   *   state that is creates form the browser's location
   * - The state's path and configured routes determine the current route
   *
   * @returns {object}
   *   {
   *     route: { ... },
   *     state: { path, data, ... }
   *   }
   */
  getRouteAndState()
  {
    // router.log.debug( "-> getRouteAndState()" );

    if( !router[ pathMatcher$ ] )
    {
      throw new Error(`Not configured yet (call configureRoutes first)`);
    }

    // -- State

    const currentState = router._getOrCreateCurrentState();

    // -- Route

    const path = currentState.path;

    expectString( path, "Missing or invalid parameter [path]" );

    let plainPath = router._stripPath( path );

    let route = router[ pathMatcher$ ].matchOne( plainPath );

    if( !route )
    {
      throw new Error(`No route found for path [${plainPath}]`);
    }

    route = { selector: route.selector, vars: route.vars, ...route.data };

    //console.log( { state } );

    return { route, state: currentState };
  }

  // ---------------------------------------------------------------------------

  /**
   * Get route vars
   * - Returns the routes variables that are set in the browsers location
   *
   * @returns {object} route variables (key value pairs)
   */
  getRouteVars()
  {
    const { route } = router.getRouteAndState();

    return route.vars;
  }

  // ---------------------------------------------------------------------------

  /**
   * Get a single route variable
   * - Returns the routes variables that are set in the browsers location
   *
   * @param {string} label - Name of the route var
   *
   * @returns {string|null} content of the specified route variable
   */
  getRouteVar( label )
  {
    expectNotEmptyString( label,
      "Missing or invalid parameter [label]" );

    const { route } = router.getRouteAndState();

    const content = route.vars[ label ];

    return content !== undefined ? content : null;
  }
  // ---------------------------------------------------------------------------

  /**
   * Get the path that corresponds to the specified label
   *
   * @param {string} [label] - Label that corresponds to the route
   *
   * @param {string} [lang=null]
   *   Language, if not set, the current language will be used
   *
   * @param {boolean} [options.noFollowRedirect=false]
   *   If a route contains a `redirectToRoute` instruction, the redirect will
   *   be followed before a pƒath is returned. Set this option to false to
   *   prevent that behaviour
   *
   * @param {object} vars - Key-value pairs to apply as route variables
   */
  routePath( label, lang=null, options )
  {
    const route = router.getRoute( label, lang );

    if( !route )
    {
      throw new Error(`Route [${label}] has not been defined`);
    }

    const { noFollowRedirect=false, vars } = options || {};

    if( !noFollowRedirect && ("redirectToRoute" in route) )
    {
      return router.routePath( route.redirectToRoute, lang );
    }

    let path = route.path;

    if( !path )
    {
      throw new Error(`Route [${label}] has no path`);
    }

    if( vars )
    {
      path = router.applyPathVars( { path, vars } );
    }

    return path;
  }

  // ---------------------------------------------------------------------------

  /**
   * Get the path that corresponds to the specified label
   *
   * @param {string} [label] - Label that corresponds to the route
   * @param {string} [lang=<current>]
   *   Language, if not specified, the current language will be used
   */
  getRoute( label, lang )
  {
    expectString( label, "Missing or invalid parameter [label]" );

    if( !lang )
    {
      lang = currentLanguage.get();

      expectString( label,
        "Missing or invalid value [currentLanguage]" );
    }
    else {
      expectString( label,
        "Missing or invalid parameter [label]" );
    }

    const route = router[ routesByLangAndLabel$ ][ `${lang}:${label}` ];

    if( !route )
    {
      throw new Error(
        `No route found for label [${label}] and language [${lang}]`);
    }

    return route;
  }

  /* ------------------------------------------- Advanced interaction methods */

  /**
   * Pushes a new state to the state history
   *
   * @param {object} [state] - State object
   * @param {string} [state.path] - Location path related to the state
   * @param {object} [state.data] - State data object
   */
  pushState( state )
  {
    // router.log.debug( "pushState", state );

    router._normalizeState( state );

    if( !router._stateChanged( state ) )
    {
      // router.log.warning("pushState (state has not changed)");
      return;
    }

    //
    // TODO: store scroll restauration info?
    // lastItem.documentScrollTop = documentElement.scrollTop;
    //

    router.historyStorage.push( state );

    router._pushBrowserLocationPath();

    router._updateRouteStateStore();
  }

  // ---------------------------------------------------------------------------

  /**
   * Replace the current state object in the state history
   *
   * @param {object} [state] - State object
   * @param {string} [state.path] - Location path related to the state
   * @param {object} [state.data] - State data object
   *
   * TODO
   * @param {object} [options]
   * @param {boolean} [options.goBackFirst=false]
   *   If set, both the current and the previous state will be removed from
   *   history before the new state is added
   */
  replaceState( state /*, options */ )
  {
    // router.log.debug("replaceState", state);

    router._normalizeState( state );

    if( !router._stateChanged( state ) )
    {
      // router.log.warning("replaceState (state has not changed)");
      return;
    }

    router.historyStorage.replace( state );

    router._replaceBrowserLocationPath();

    router._updateRouteStateStore();
  }

  // ---------------------------------------------------------------------------

  /**
   * Returns the label that belongs to the current `home` route
   *
   * @returns {string} home route label
   */
  getLabelHome() {
    return router[ homeLabel$ ];
  }

  // ---------------------------------------------------------------------------

  /**
   * Returns the label that belongs to the current `not found` route
   *
   * @returns {string} not found route label
   */
  getLabelNotFound() {
    return router[ notFoundLabel$ ];
  }

  // ---------------------------------------------------------------------------

  /**
   * Clear history from session storage
   */
  clearHistoryStorage()
  {
    router.historyStorage.clear();
  }

  // ---------------------------------------------------------------------------

  /**
   * Get the hash value from a path
   * - Returns the part after the `#` hash token
   * - If no hash is present, null will be returned
   *
   * @param {string} path
   *
   * @returns {string|null} the hash value or null
   */
  // getHashFromPath( path )
  // {
  //   expectString( path,
  //     "Missing or invalid parameter [path]" );

  //   const x = path.indexOf("#");

  //   if( x >= 0 )
  //   {
  //     return path.slice( x + 1 );
  //   }

  //   return null;
  // }

  /* ------------------------------------------------------- Internal methods */

  /**
   * Push the path from the currentState to the browser's history
   * (updates the browser's location path)
   */
  _pushBrowserLocationPath()
  {
    const currentState =
      router._getCurrentState( { clearHistoryOnInvalid: false } );

    // router.log.debug("_pushBrowserLocationPath", currentState);

    window.history.pushState( null, '', currentState.path );
  }

  // ---------------------------------------------------------------------------

  /**
   * Replace the from the browser's history with the path from the currentState
   * (updates the browser's location path)
   */
  _replaceBrowserLocationPath()
  {
    const currentState =
      router._getCurrentState( { clearHistoryOnInvalid: false } );

    // router.log.debug("_replaceBrowserLocationPath", currentState);

    window.history.replaceState( null, '', currentState.path );
  }

  // ---------------------------------------------------------------------------

  async _updateScrollRestaurationStore()
  {

    // console.log(
    //   "CHECK scroll restauration", { restore: history.scrollRestoration } );

  }

  // ---------------------------------------------------------------------------

  /**
   * Update route and state store
   * - Gets current state from history storage or creates new state
   * - Finds the corresponding current route
   * - Updates router property `routeAndStateStore`
   */
  async _updateRouteStateStore()
  {
    // router.log.debug( "_updateRouteStateStore" );

    const newRouteAndState = router.getRouteAndState();

    const existingValue = router.routeStateStore.get();

    if( equals( existingValue, newRouteAndState ) )
    {
      // Ignore update if state did not change:
      //
      // Identical states may occur due to:
      // - language change
      // - ...?

      // router.log.debug( "_updateRouteStateStore: state not changed", existingValue );

      return;
    }

    // console.log("UPDATE: routeStateStore");

    // router.routeStateStore.set( newRouteAndState );
    router.routeStateStore.set( newRouteAndState, /* defer */ true );
  }

  // ---------------------------------------------------------------------------

  /**
   * Apply a redirect if the first route contains a `redirectToRoute`
   * instruction
   *
   * @returns {boolean} true if `redirectToRoute` was called
   */
  _tryCurrentRouteIsRedirect()
  {
    let plainPath = router._stripPath( location.href );

    const route = router[ pathMatcher$ ].matchOne( plainPath );

    // (1) -- no route

    if( !route )
    {
      //
      // No route found for current path in browser location
      // -> redirect to `not found page` or `home`
      //

      const notFoundRoute =
        router[ pathMatcher$ ].matchOne( router[ notFoundLabel$ ] );

      if( notFoundRoute )
      {
        //
        // Redirect to `not found` route
        //
        router.redirectToRoute(
          router[ notFoundLabel$ ], { replaceCurrent: true } );
      }
      else {
        //
        // Redirect to `home` route
        //
        router.redirectToRoute(
          router[ homeLabel$ ], { replaceCurrent: true } );
      }

      return true;
    }

    // (2) -- with route

    //
    // A route exists for the current path from the browser's location
    //

    if( route.data.redirectToRoute )
    {
      //
      // The current route contains a `redirectToRoute` instruction
      //
      // router.log.debug("redirectToRoute",
      //   {
      //     plainPath,
      //     redirectToRoute: route.data.redirectToRoute
      //   } );

      router.redirectToRoute(
        route.data.redirectToRoute, { replaceCurrent: true } );

      return true;
    }

    return false;
  }

  // ---------------------------------------------------------------------------

  /**
   * Check if the supplied state is valid
   * - Compares the browser location path with the path from the state
   *   If the paths are not the same, the state is not a valid currentState
   *
   * @param {object|null} currentState
   *
   * @returns {boolean} true if the path in the state is the same as the
   *   current path from the browser's location
   */
  _isValidCurrentState( currentState )
  {
    if( !currentState )
    {
      return false;
    }

    const locationPath =
      router._stripPath(
        location.href, { includeSearch: true, includeHash: true } );

    if( currentState.path === locationPath )
    {
      return true;
    }

    return false;
  }

  // ---------------------------------------------------------------------------

  /**
   * Get current state or create and set a new state
   * - Gets the latest state from the history storage
   * - Resets history storage if the latest state is invalid (by default)
   * - Creates a new state using the browser's current location if no
   *   (valid) state was found in the history storage
   *
   * @returns {object} currentState
   */
  _getOrCreateCurrentState()
  {
    const currentState = router._getCurrentState();

    if( currentState )
    {
      return currentState;
    }

    // -- Create new state

    const newState = router._stateFromLocationHref();

    router.historyStorage.push( newState );

    return newState;
  }

  // ---------------------------------------------------------------------------

  /**
   * Get the current state
   * - Gets the latest state from the history storage
   * - Resets history storage if the latest state is invalid (by default)
   *
   * @param {boolean} [clearHistoryOnInvalid=true]
   *   If false, an invalid state (a state.path that does not match with the
   *   browser's location path) will lead to clearing of the historyStorage
   *   and null will be returned.
   *
   * @returns {object|null}
   *   current state or null if no (valid) current state was found
   */
  _getCurrentState( { clearHistoryOnInvalid=true }={} )
  {
    let currentState = router.historyStorage.getLatest();

    // router.log.debug("_getCurrentState", currentState);

    if( currentState )
    {
      if( !clearHistoryOnInvalid ||
           router._isValidCurrentState( currentState ) )
      {
        return currentState;
      }
    }

    //
    // Missing or not a valid current state
    //
    // path in currentState from historyStorage does not match with current
    // browser history path
    // -> clear historyStorage and create a new currentState
    //

    currentState = null;
    router.historyStorage.clear();

    return currentState;
  }

  // ---------------------------------------------------------------------------

  /**
   * Creates a state object, generated from `location.href`
   *
   * @returns {object} new state object (only contains the current path)
   */
  _stateFromLocationHref()
  {
    const path =
      router._stripPath(
        location.href, { includeSearch: true, includeHash: true } );

    const state = { path /*, data: {} */ };

    if( location.search.length > 1 )
    {
      let searchParams = new URLSearchParams( location.search.substring(1) );

      const search = {};

      for( const [ key, value ] of searchParams.entries() )
      {
        search[ key ] = value;
      }

      state.search = search;
    }

    return state;
  }

  // ---------------------------------------------------------------------------

  /**
   * Check if the state object is valid
   *
   * @param {object} state
   *
   * @returns {boolean} true if the state object is valid
   */
  _isValidState( state )
  {
    if( !(state instanceof Object) || typeof state.path !== "string" )
    {
      return false;
    }

    if( state.data && typeof state.id !== "string" )
    {
      return false;
    }

    return true;
  }

  // ---------------------------------------------------------------------------

  /**
   * Returns true if the supplied state differs from the current state
   *
   * @param {object} state
   *
   * @returns {boolean}
   *   true if the supplied state differs from the current state
   */
  _stateChanged( state )
  {
    expectObject( state, "Missing or invalid parameter [state]" );

    const currentState = router._getCurrentState();

    if( !currentState )
    {
      return true;
    }

    // -- Detect path & main state changes

    //console.log("_stateChanged? check path", state.path, currentState.path );

    if( state.path !== currentState.path )
    {
      return true;
    }

    if( !equals( state.data, currentState.data ) )
    {
      return true;
    }

    //console.log("_stateChanged? not changed", state, currentState );

    return false;
  }

  // ---------------------------------------------------------------------------

  /**
   * Normalize a state object
   * - Inherits `path`, `main` from current state (if any)
   * - Generate new state id's
   *
   * @param {object} state - State object { [path] [,data] }
   */
  _normalizeState( state )
  {
    // router.log.debug("_normalizeState");

    // -- Check input parameters

    expectObject( state, "Missing or invalid value for parameter [state]" );

    router._ensureOnlyAllowedStateProperties( state );

    let { path, data } = state;

    if( path )
    {
      expectString( path, "Invalid value for parameter [path]" );
    }

    if( data )
    {
      expectObject( data, "Invalid value for parameter [data]" );
    }
    else {
      delete state.id;
    }

    const currentState = router._getOrCreateCurrentState();

    if( !path )
    {
      // Inherit path from current state
      state.path = currentState.path;
    }

    if( !data && currentState.data && state.path === currentState.path )
    {
      // Inherit state data from current state
      state.data = currentState.data;
      state.id = currentState.id;
    }
    else if( currentState.data && equals( data, currentState.data ) )
    {
      // Main state not changed -> reuse previous state id
      state.id = currentState.id;
    }
    else if( data )
    {
      state.id = generateLocalId();
    }

    if( data )
    {
      const id = state.id;

      state.path =
        `${router._stripPath( state.path, { includeSearch: true } )}#${id}`;
    }
    else {
      delete state.id;
    }
  }

  // ---------------------------------------------------------------------------

  /**
   * Normalize a part of a route
   * - A route part can be the [app], [layout] or a [panel] part of the route
   *
   * @param {object} routePart
   *
   * @param {object} debug
   * @param {object} debug.part
   * @param {object} debug.label
   */
  _normalizeLayoutOrPanelParams( routePart, { routePartName, label } )
  {
    expectObject( routePart, "Missing or invalid parameter [routePart]" );

    const {
      component,
      classNames,
      backgroundColor } = routePart;

    if( component )
    {
      expectObject( component,
        `Invalid route [${label}], missing or invalid property ` +
        `[${routePartName}.component]` );
    }

    if( classNames )
    {
      expectString( classNames,
        `Invalid route [${label}], missing or invalid property ` +
        `[${routePartName}.classNames]` );
    }
    else {
      routePart.classNames = "";
    }

    if( backgroundColor )
    {
      expectString( backgroundColor,
        `Invalid route [${label}], missing or invalid property ` +
        `[${routePartName}.backgroundColor]` );
    }
  }

  // ---------------------------------------------------------------------------

  /**
   * Create a new updated object
   *
   * @param {object} [obj] - Input object
   *
   * @param {object|iterable|null} updateData
   *   Data to update. If set to [null], a new empty object will be returned
   *
   * @returns {object} updated object
   */
  _cloneAndUpdate( obj=null, updateData=null )
  {
    // -- Check / clone parameter [obj]

    if( obj instanceof Object )
    {
      obj = clone( obj );
    }
    else if( !obj )
    {
      obj = {};
    }
    else {
      expectObject( obj, "Missing or invalid parameter [obj]");
    }


    if( !updateData )
    {
      // No update data -> return new empty object
      return obj;
    }

    // -- Update cloned object

    updateObject( obj, updateData, { replaceArrays: false } );

    return obj;
  }

  // ---------------------------------------------------------------------------

  /**
   * Strip parts from the supplied path
   * - Removes origin
   * - Optionally removes the search part (after the ? token)
   * - Optionally removes the hash part (after the # token)
   *
   * @param {string} path
   * @param {boolean} [options.includeSearch=false] - Include query part of the path
   * @param {boolean} [options.includeHash=false] - Include hash part of the path
   *
   * @returns {string} location path without query or hash
   */
  _stripPath( path, options )
  {
    expectString( path, "Missing or invalid parameter [path]");

    const origin = location.origin;

    if( path.startsWith( origin ) )
    {
      // Strip origin from path [http(s)://hostname:port]
      path = path.slice( origin.length );
    }

    let includeSearch = false;
    let includeHash = false;

    if( options )
    {
      includeSearch = options.includeSearch ? true : false;
      includeHash = options.includeHash ? true : false;
    }

    let x = -1;

    if( !includeSearch )
    {
      x = path.indexOf("?");
    }

    let y = -1;

    if( !includeHash )
    {
      y = path.indexOf("#");
    }

    if( -1 === x && -1 === y )
    {
      return path;
    }

    if( -1 !== x && -1 !== y )
    {
      return path.slice( 0, Math.min( x, y ) );
    }
    else if( -1 === x )
    {
      return path.slice( 0, y );
    }

    return path.slice( 0, x );
  }

  // ---------------------------------------------------------------------------

  /**
   * Throw and exception if the supplied state object contains properties
   * that are not allowed.
   *
   * @param {object} state
   */
  _ensureOnlyAllowedStateProperties( state )
  {
    expectObject( state, "Missing or invalid parameter [state]" );

    for( const key in state )
    {
      if( !ALLOWED_STATE_PROPERTIES.has( key ) )
      {
        throw new Error(`Invalid state property [${key}]`);
      }
    }
  }

  // ---------------------------------------------------------------------------

  /**
   * Turn off
   * - Calls the functions in router[ offs$ ] specified by the parameter
   *   `unsubscribeKeys`
   *
   * @param {...string} unsubscribeKeys
   */
  _turnOff( ...unsubscribeKeys )
  {
    const offs = router[ offs$ ];

    for( const key in unsubscribeKeys )
    {
      if( offs[ key ] )
      {
        offs[ key ]();
        delete offs[ key ];
      }
    }
  }

} // end class

//
// Instantiate a single instance of the FrontendRouter class
// - The instance assigns itself to variable `router`
//
new FrontendRouter();

/* ------------------------------------------------------------------ Exports */

export default router;
