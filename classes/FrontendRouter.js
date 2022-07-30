
/* ------------------------------------------------------------------ Imports */

import {
  expectString,
  expectArray,
  expectObject,
  expectSet } from "@hkd-base/helpers/expect.js";

import { defer } from "@hkd-base/helpers/process.js";

import { rethrow } from "@hkd-base/helpers/exceptions.js";

import { equals } from "@hkd-base/helpers/compare.js";

import { clone, updateObject } from "@hkd-base/helpers/object.js";

import { generateLocalId } from "@hkd-base/helpers/unique.js";

import ValueStore from "@hkd-base/classes/ValueStore.js";

import { currentLanguage,
         LANG_DEFAULT } from "@hkd-base/stores/language.js";

// import { sessionData,
//          authenticationBusy } from "@hkd-fe/stores/session.js";

import PathMatcher from "@hkd-fe/classes/PathMatcher.js";

// import { debug } from "@hkd-base/helpers/log.js";

/* ---------------------------------------------------------------- Internals */

const pathMatcher$ = Symbol();
const routesByLangAndLabel$ = Symbol();

const homeLabel$ = Symbol();
const notFoundLabel$ = Symbol();
const mainMenuLabel$ = Symbol();

const offs$ = Symbol();

// const sessionStorage$ = Symbol("storage");

const HISTORY_STORAGE_LABEL = "frontend-router/history";

const MAX_HISTORY_LENGTH = 15;

const ALLOWED_STATE_PROPERTIES = new Set( ["data", "id", "path"] );

const DEFAULT_ROUTE_LABEL_HOME = "/";
const DEFAULT_ROUTE_LABEL_NOT_FOUND = "not-found";
const DEFAULT_ROUTE_LABEL_MAIN_MENU = "main-menu";

//
// A single instance of the FrontendRouter class will be assigned to the
// variable `router`
//
let router;

/**
 * Class that will be instantiated only once and handles the routing magic
 */
class FrontendRouter
{
  /**
   * Construct a FrontendRouter (frontend router) instance
   */
  constructor()
  {
    if( router )
    {
      throw new Error("Variable [router] has already been assigned");
    }

    //
    // Assign this (the only) instance to variable `router`
    // - Internally the variable router is used, so methods do not have to be
    //   bound when exported without the instance context
    //
    router = this;

    router[ offs$ ] = {};

    //-- Create path matcher (used to match routes)

    router[ pathMatcher$ ] = new PathMatcher();

    //-- Default route labels

    router[ homeLabel$ ] = DEFAULT_ROUTE_LABEL_HOME;
    router[ notFoundLabel$ ] = DEFAULT_ROUTE_LABEL_NOT_FOUND;
    router[ mainMenuLabel$ ] = DEFAULT_ROUTE_LABEL_MAIN_MENU;

    //-- Routes by language and route label

    router[ routesByLangAndLabel$ ] = {};

    if( !sessionStorage.getItem( HISTORY_STORAGE_LABEL ) )
    {
      // IDEA: copy state to server and use access code to restore history

      let historyJson = localStorage.getItem( HISTORY_STORAGE_LABEL );

      if( historyJson )
      {
        let currentPath =
          router._stripPath(
            location.href, { includeSearch: false, includeHash: true } );

        // Copy state from localStorage
        // - To support copy current url in same browser

        let history = JSON.parse( historyJson );

        for( let j = history.length - 1; j >= 0; j = j - 1 )
        {
          const item = history[ j ];

          if( item.path === currentPath )
          {
            console.log("Restored state from local storage");

            sessionStorage
              .setItem( HISTORY_STORAGE_LABEL, JSON.stringify( [ item ] ) );
            break;
          }
        } // end for
      }
    }

    //
    // `router[ routeStateAccessStore$ ]` is a store that will updaten on all
    // navigation and state updates
    //
    // `initialData` are `sane` defaults in case the store is accessed
    // before route and state have been set
    //

    const initialData =
      {
        route: { layout: null },
        state: router._getOrCreateCurrentState(),
        access: { validated: false }
      };

    const routeStateAccessStore =
      router.routeStateAccessStore = new ValueStore( initialData );

    routeStateAccessStore
      .hasSubscribers.subscribe( ( hasSubscribers ) =>
        {
          if( !router[ pathMatcher$ ] )
          {
            throw new Error(`Not configured yet (call configureRoutes first)`);
          }

          if( hasSubscribers )
          {
            router._registerLocationAndSessionListeners();
          }
          else {
            router._unregisterLocationAndSessionListeners();
          }
        },
        false );
  }

  // -------------------------------------------------------------------- Method

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
   *  @property {boolean} [allowGuest=true]
   *  @property {string} [requireGroup]
   *
   *    e.g. requireGroup: "registered"
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
   *      appBar: {
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
    // debug( "*****configure: ROUTES", routes );

    expectArray( routes, "Missing or invalid configuration [routes]" );

    router[ pathMatcher$ ] = new PathMatcher();


    let homeLabel = null;
    let notFoundLabel = null;
    let mainMenuLabel = null;

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

      // -- Process property `isMainMenu`

      if( "isMainMenu" in route )
      {
        mainMenuLabel = label;
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

      // -- Process property `app`

      if( route.app )
      {
        try {
          router._normalizeAppParams(
            route.app, { routePartName: "app", label } );
        }
        catch( e )
        {
          rethrow( "Invalid configuration [app]", e );
        }
      }
      else {
        route.app = {};
      }

      // -- Process property `layout`

      if( route.layout )
      {
        try {
          router._normalizeLayoutOrPanelParams(
            route.layout, { routePartName: "layout", label } );
        }
        catch( e )
        {
          rethrow( "Invalid configuration [layout]", e );
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
            rethrow( `Invalid configuration [panels[${key}]]`, e );
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

      // -- Process properties `allowGuest` and `requireGroup` (access)

      if( "allowGuest" in route && "requireGroup" in route )
      {
        throw new Error(
          `Invalid configuration [allowGuest] and [requireGroup] ` +
          `are mutually exclusive`);
      }
      else if( !("allowGuest" in route) && !("requireGroup" in route) )
      {
        route.allowGuest = true;
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
      router[ homeLabel$ ] = DEFAULT_ROUTE_LABEL_HOME;
    }

    if( notFoundLabel )
    {
      router[ notFoundLabel$ ] = notFoundLabel;
    }
    else {
      router[ notFoundLabel$ ] = DEFAULT_ROUTE_LABEL_NOT_FOUND;
    }

    if( mainMenuLabel )
    {
      router[ mainMenuLabel$ ] = mainMenuLabel;
    }
    else {
      router[ mainMenuLabel$ ] = DEFAULT_ROUTE_LABEL_MAIN_MENU;
    }

    // -- Handle redirect if it applies to the current route

    if( !router._tryCurrentRouteIsRedirect() )
    {
      // Force initial update
      router._updateCurrentRouteAndState();
    }
  }

  // -------------------------------------------------------------------- Method

  /**
   * Get a store that contains route values
   * - A new value will be set if the route data changes
   */
  getRouteStore()
  {
    //-- Create new `currentRouteStore`

    const { route: initialValue } = router.getRouteStateAccess();

    const currentRouteStore = new ValueStore( initialValue );

    //-- Create unique entries for storing unsubscribe methods

    const unsubscribe$ = Symbol();
    const unsubscribeHasSubscribers$ = Symbol();

    //-- Handle store subscribers and data updates

    let previousRoute = null;

    router[ offs$ ][ unsubscribeHasSubscribers$ ] =
      currentRouteStore
        .hasSubscribers.subscribe( ( $hasSubscribers ) =>
    {
      // console.log(
      //   "currentRouteStore.hasSubscribers", $hasSubscribers );

      if( $hasSubscribers )
      {
        router[ offs$ ][ unsubscribe$ ] =
          router.routeStateAccessStore.subscribe( ( routeStateAccess ) =>
          {
            const currentRoute = routeStateAccess.route;

            // console.log("FIXME: gets fired twice?");

            // console.log("CHECK", currentRoute, previousRoute );

            if( !equals( currentRoute, previousRoute ) )
            {
              // @note duplicate access data is skipped

              previousRoute = currentRoute;

              // Set current state

              currentRouteStore
                .set( { ...currentRoute } );
            }
          } );
      }
      else {
        // no more subscribers -> stop store
        router._turnOff( unsubscribe$, unsubscribeHasSubscribers$ );
      }
    } );

    return currentRouteStore;
  }

  // -------------------------------------------------------------------- Method

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
    //-- Store original path upon creation of the store

    const originalPath =
      router.getCurrentPath( { includeSearch: true, includeHash: false } );

    //-- Create new `currentStateStore`

    const { state: initialValue } = router.getRouteStateAccess();

    const currentStateStore = new ValueStore( initialValue );

    //-- Create unique entries for storing unsubscribe methods

    const unsubscribe$ = Symbol();
    const unsubscribeHasSubscribers$ = Symbol();

    //-- Handle store subscribers and data updates

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
          router.routeStateAccessStore
            .subscribe( ( routeStateAccess ) =>
          {
            const currentState = routeStateAccess.state;

            const currentPath = currentState.path;

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

  // -------------------------------------------------------------------- Method

  /**
   * Get a store that outputs the access data for the current route only
   * - When the route path changes, values in the store will no longer be
   *   updated. This prevents access changes that are meant for other routes
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
  getAccessStoreForCurrentRoute()
  {
    console.log("TODO: TEST");

    //-- Store original path upon creation of the store

    const originalPath =
      router.getCurrentPath( { includeSearch: true, includeHash: false } );

    //-- Create new `currentAccessStore`

    const { access: initialValue } = router.getRouteStateAccess();

    const currentAccessStore = new ValueStore( initialValue );

    //-- Create unique entries for storing unsubscribe methods

    const unsubscribe$ = Symbol();
    const unsubscribeHasSubscribers$ = Symbol();

    //-- Handle store subscribers and data updates

    let previousAccess = null;

    router[ offs$ ][ unsubscribeHasSubscribers$ ] =
      currentAccessStore
        .hasSubscribers.subscribe( ( $hasSubscribers ) =>
    {
      // console.log(
      //   "currentAccessStore.hasSubscribers", $hasSubscribers );

      if( $hasSubscribers )
      {
        router[ offs$ ][ unsubscribe$ ] =
          router.routeStateAccessStore.subscribe( ( routeStateAccess ) =>
          {
            const currentState = routeStateAccess.state;
            const currentAccess = routeStateAccess.access;

            const currentPath = currentState.path;

            if( originalPath === currentPath )
            {
              if( !equals( currentAccess, previousAccess ) )
              {
                // @note duplicate access data is skipped

                previousAccess = currentAccess;

                // Set current state

                currentAccessStore
                  .set( { ...currentAccess } );
              }
            }
            else {
              // Path changed -> stop store
              router._turnOff( unsubscribe$, unsubscribeHasSubscribers$ );
            }
          } );
      }
      else {
        // no more subscribers -> stop store
        router._turnOff( unsubscribe$, unsubscribeHasSubscribers$ );
      }
    } );

    return currentAccessStore;
  }

  // -------------------------------------------------------------------- Method

  /**
   * Get a store that contains route, state and access values
   * - A new value will be set if either the route, the state or the access
   *   data changes
   */
  // getRouteStateAccessStore()
  // {
  //   return router.routeStateAccessStore;
  // }

  // -------------------------------------------------------------------- Method

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
   */
  redirectTo( path, options )
  {
    expectString( path, "Missing or invalid parameter [path]" );

    let plainPath = router._stripPath( path );

    const route = router[ pathMatcher$ ].matchOne( plainPath );

    if( !route )
    {
      throw new Error(`No route found for path [${plainPath}]`);
    }

    // console.log("redirectTo: route found", route );

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
      replaceCurrent=false } = options || {};

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

    if( replaceCurrent )
    {
      router.replaceState( newState );
    }
    else {
      router.pushState( newState );
    }
  }

  // -------------------------------------------------------------------- Method

  /**
   * Redirect to the specified
   *
   * @param {string} label
   *
   * @param {string|null} [options.lang=null]
   * @param {boolean} [options.replaceCurrent=false]
   * @param {object} [options.stateData] - Data for the state to set
   */
  redirectToRoute( label, options={} )
  {
    // console.log("redirectToRoute", label);

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

    // console.log(`redirectToRoute [label=${label}], [path=${path}]`, options);

    router.redirectTo( path, options );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Redirect to the home route
   */
  goHome( { replaceCurrent=true }={} )
  {
    const homeLabel = router[ homeLabel$ ];

    const { route } = router.routeStateAccessStore.get();

    if( homeLabel !== route.label )
    {
      // Not already on home route -> redirect
      router.redirectToRoute( homeLabel, { replaceCurrent } );
    }
  }

  // -------------------------------------------------------------------- Method

  /**
   * Try to go back to the previous page
   * - This method will only navigate back if there was a route history item
   *
   * @returns {boolean} false if the location was not navigated back in history
   */
  goBack()
  {
    const historyJson = sessionStorage.getItem( HISTORY_STORAGE_LABEL );

    let history;

    if( historyJson )
    {
      history = JSON.parse( historyJson );
    }
    else {
      history = [];
    }

    if( history.length < 2 )
    {
      return false;
    }

    history.pop(); // remove state from history

    let state = history[ history.length - 1 ];

    sessionStorage.setItem( HISTORY_STORAGE_LABEL, JSON.stringify(history) );

    window.history.replaceState( null, '', state.path );

    router._updateCurrentRouteAndState();
  }

  // -------------------------------------------------------------------- Method

  /**
   * Returns true if a history.back() operation would lead to an "in-app" page
   *
   * @returns {boolean} true if the previous page was an in-app page
   */
  canGoBack()
  {
    const historyJson = sessionStorage.getItem( HISTORY_STORAGE_LABEL );

    // debug("canGoBack: historyJson", historyJson);

    let history;

    if( historyJson )
    {
      history = JSON.parse( historyJson );
    }

    // debug("canGoBack: history", history);

    if( !history || history.length < 2 )
    {
      return false;
    }

    return true;
  }

  // -------------------------------------------------------------------- Method

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
    const currentState = router._getCurrentStateFromSessionStorage();

    if( !currentState )
    {
      throw new Error("No current state");
    }

    let updatedData =
      router._cloneAndUpdate( currentState.data, updateData );

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

  // -------------------------------------------------------------------- Method

  /**
   * Remove the query (search) part of the url
   * - Replaces the current state
   */
  removeSearchParams()
  {
    let state = router._getCurrentStateFromSessionStorage();

    if( !state.search )
    {
      return;
    }

    let path =
      router._stripPath(
        location.href, { includeSearch: false, includeHash: true } );

    router.redirectTo( path,
      {
        stateData: state.data,
        replaceCurrent: true
      } );
  }

  // -------------------------------------------------------------------- Method

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
    const currentState = router._getCurrentStateFromSessionStorage();

    if( !currentState )
    {
      throw new Error("No current state");
    }

    // console.log(
    //   "*** updateReturnState: currentState",
    //   JSON.stringify( currentState, null, 2));

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

    // console.log(
    //   "*** updateReturnStateData: newState",
    //   JSON.stringify( newState, null, 2));

    router.replaceState( newState );
  }

  // -------------------------------------------------------------------- Method

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

    let currentState = router._getCurrentStateFromSessionStorage();

    let returnState = currentState.data.returnState;

    if( !returnState )
    {
      throw new Error("Missing [currentState.data.returnState]");
    }

    if( updateData )
    {
      router.updateReturnStateData( updateData );

      currentState = router._getCurrentStateFromSessionStorage();
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

  // -------------------------------------------------------------------- Method

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

  // -------------------------------------------------------------------- Method

  /**
   * Get the current state data
   * - Returns an empty object if no state data was set
   *
   * @returns {object} current main state
   */
  getStateData()
  {
    const currentState = router._getCurrentStateFromSessionStorage();

    if( currentState )
    {
      return currentState.data;
    }

    return {};
  }

  // -------------------------------------------------------------------- Method

  /**
   * Get the path that corresponds to the specified label
   *
   * @param {string} [label] - Label that corresponds to the route
   *
   * @param {string} [lang=<current>]
   *   Language, if not specified, the current language will be used
   *
   * @param {boolean} [options.followRedirect=true]
   *   If a route contains a `redirectToRoute` instruction, the redirect will
   *   be followed before a path is returned. Set this option to false to
   *   prevent that.
   */
  routePath( label, lang, options={followRedirect:true} )
  {
    const route = router.getRoute( label, lang );

    if( !route )
    {
      throw new Error(`Route [${label}] has not been defined`);
    }

    if( !options || options.followRedirect )
    {
      if( "redirectToRoute"in route )
      {
        return router.routePath( route.redirectToRoute, lang );
      }
    }

    let path = route.path;

    if( !path )
    {
      throw new Error(`Route [${label}] has no path`);
    }

    return path;
  }

  // -------------------------------------------------------------------- Method

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

  // -------------------------------------------------------------------- Method

  /**
   * Get the current route, state and access data
   * - If the current route defines access via `allowGuest` or `requireGroup`,
   *   an access property is returned that validates access against credentials
   *   set in session data.
   *
   * @returns {object}
   *   {
   *     route: {},
   *     state: {},
   *     [access={ allowed: <boolean>, validated: <boolean> }]
   *   }
   */
  getRouteStateAccess()
  {
    //-- State

    let currentState = router._getCurrentStateFromSessionStorage();

    if( !currentState )
    {
      //throw new Error("No current state");
      currentState = router._getOrCreateCurrentState();
    }

    //-- Route

    const path = currentState.path;

    expectString( path, "Missing or invalid parameter [path]" );

    let plainPath = router._stripPath( path );

    let route = router[ pathMatcher$ ].matchOne( plainPath );

    if( !route )
    {
      throw new Error(`No route found for path [${plainPath}]`);
    }

    //-- Access

    let access = { allowed: false, validated: false };

    // const sessionDataValue = sessionData.get();

    // console.log( "FrontendRouter:authenticationBusy", authenticationBusy.get() );
    // console.log( "FrontendRouter:sessionDataValue", sessionDataValue );

    // const allowGuest = route.data.allowGuest;
    // const requireGroup = route.data.requireGroup;

    // if( !authenticationBusy.get() )
    // {
    //   if( requireGroup )
    //   {
    //     if( !sessionDataValue )
    //     {
    //       access = { allowed: false, validated: false };
    //     }
    //     else {
    //       // Get user groups from session data

    //       let groups = sessionDataValue.groups;

    //       if( groups )
    //       {
    //         expectSet( groups,
    //           "Invalid property [groups] in session data " );
    //       }
    //       else {
    //         groups = new Set();
    //       }

    //       // console.log("****requireGroup", { requireGroup, groups });

    //       if( groups.has( requireGroup ) )
    //       {
    //         access = { allowed: true, validated: true };
    //       }
    //       else {
    //         access = { allowed: false, validated: true };
    //       }
    //     }
    //   }
    //   else if( false === allowGuest )
    //   {
    //     // User should not be a guest

    //     // console.log("****!allowGuest", { isGuest: sessionDataValue.isGuest });

    //     if( !sessionDataValue )
    //     {
    //       access = { allowed: false, validated: false };
    //     }
    //     else {
    //       access = {
    //         allowed: !sessionDataValue.isGuest,
    //         validated: true };
    //     }
    //   }
    //   else {
    //     access = { allowed: true, validated: true };
    //   }
    // }
    // else {
    //   // FIXME: use current value for access ????
    //   access = { allowed: false, validated: false };
    // }

    route = { selector: route.selector, params: route.params, ...route.data };

    //console.log( { state } );

    return { route, state: currentState, access };
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
    router._normalizeState( state );

    if( !router._stateChanged( state ) )
    {
      //throw new Error("Cannot push state (state has not changed)");
      console.error("Cannot push state (state has not changed)");
      return;
    }

    // console.log( "pushState", state );

    let historyJson = sessionStorage.getItem( HISTORY_STORAGE_LABEL );

    let history;

    if( historyJson )
    {
      history = JSON.parse( historyJson );

      expectArray( history, `Invalid item in storage [${HISTORY_STORAGE_LABEL}]` );

      if( history.length >= MAX_HISTORY_LENGTH )
      {
        // Limit stored history length
        history = history.slice( history.length - MAX_HISTORY_LENGTH + 1 );
      }

      const n = history.length - 1;

      if( n > 0 )
      {
        //
        // Update documentElement.scrollTop information in current state
        //
        const documentElement = document.documentElement;

        history[ n ].documentScrollTop = documentElement.scrollTop;
      }
    }
    else {
      history = [];
    }

    history.push( state );

    // debug( "pushState:history", history );
    // debug( "pushState:history", { path: state.path } );

    historyJson = JSON.stringify(history);

    sessionStorage.setItem( HISTORY_STORAGE_LABEL, historyJson );
    localStorage.setItem( HISTORY_STORAGE_LABEL, historyJson );

    window.history.pushState( null, '', state.path );

    // @note pushState never causes a hashchange event to be fired
    router._updateCurrentRouteAndState();
  }

  // -------------------------------------------------------------------- Method

  /**
   * Replace the current state object in the state history
   *
   * @param {object} [state] - State object
   * @param {string} [state.path] - Location path related to the state
   * @param {object} [state.data] - State data object
   *
   * @param {object} [options]
   * @param {boolean} [options.goBackFirst=false]
   *   If set, both the current and the previous state will be removed from
   *   history before the new state is added
   */
  replaceState( state, options )
  {
    router._normalizeState( state );

    // debug( "replaceState", state );

    if( !router._stateChanged( state ) )
    {
      // Ignore
      return;
    }

    const historyJson = sessionStorage.getItem( HISTORY_STORAGE_LABEL );

    let history;

    if( historyJson )
    {
      history = JSON.parse( historyJson );
    }
    else {
      history = [];
    }

    if( options && options.goBackFirst )
    {
      // Go first back in history (remove extra item from history)
      history.pop();
    }

    // Remove last state
    history.pop();

    for( let j = history.length - 1; j >= 0; j = j - 1 )
    {
      const lastState = history[ j ];

      if( equals( state, lastState ) )
      {
        // Remove identical state
        // (might be present in the stack due to redirects e.g. / -> /dashboard)
        history.pop();
      }
    }

    history.push( state );

    sessionStorage.setItem( HISTORY_STORAGE_LABEL, JSON.stringify(history) );

    window.history.replaceState( null, '', state.path );

    router._updateCurrentRouteAndState();
  }

  // -------------------------------------------------------------------- Method

  /**
   * Go to the main menu route or navigate back if already on the main menu
   * route
   */
  // toggleMainMenu()
  // {
  //   const { route } = router.getRouteStateAccess();

  //   const mainMenuLabel = router.getLabelMainMenu();

  //   if( mainMenuLabel === route.label )
  //   {
  //     //
  //     // Already on main menu route
  //     // -> navigate back or home if no previous route exists
  //     //
  //     router.goBack() || router.goHome();
  //   }
  //   else {
  //     //
  //     // Redirect to the main menu route
  //     // - Leaves current route in history (so we can go back)
  //     //
  //     router.redirectToRoute( mainMenuLabel );
  //   }
  // }

  // -------------------------------------------------------------------- Method

  /**
   * Returns the label that belongs to the current `home` route
   *
   * @returns {string} home route label
   */
  getLabelHome() {
    return router[ homeLabel$ ];
  }

  // -------------------------------------------------------------------- Method

  /**
   * Returns the label that belongs to the current `not found` route
   *
   * @returns {string} not found route label
   */
  getLabelNotFound() {
    return router[ notFoundLabel$ ];
  }

  // -------------------------------------------------------------------- Method

  /**
   * Returns the label that belongs to the current `main menu` route
   *
   * @returns {string} main menu route label
   */
  getLabelMainMenu() {
    return router[ mainMenuLabel$ ];
  }

  // -------------------------------------------------------------------- Method

  /**
   * Go to the `main menu` route
   *
   * @returns {boolean}
   *   true if the route changed, false if already on the main menu route
   */
  gotoRouteMainMenu()
  {
    const mainMenuLabel = router.getLabelMainMenu();

    const { route } = router.getRouteStateAccess();

    // console.log("gotoRouteMainMenu", route, mainMenuLabel );

    if( mainMenuLabel === route.label )
    {
      return false;
    }

    router.redirectToRoute( mainMenuLabel );

    return true;
  }

  /* ------------------------------------------------------- Internal methods */

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

    if( !route )
    {
      // Route not found

      const notFoundRoute =
        router[ pathMatcher$ ].matchOne( router[ notFoundLabel$ ] );

      if( notFoundRoute )
      {
        router.redirectToRoute(
          router[ notFoundLabel$ ], { replaceCurrent: true } );
      }
      else {
        // No `not found` route has been defined -> redirect to `home`

        router.redirectToRoute( router[ homeLabel$ ], { replaceCurrent: true } );
      }

      return true;
    }

    // -- Handle [redirectToRoute] property

    if( route.data.redirectToRoute )
    {
      console.log("redirectToRoute",
        {
          plainPath,
          redirectToRoute: route.data.redirectToRoute
        } );

      router.redirectToRoute(
        route.data.redirectToRoute, { replaceCurrent: true } );

      return true;
    }

    return false;
  }

  // -------------------------------------------------------------------- Method

  /**
   * Register location and session listeners
   */
  _registerLocationAndSessionListeners()
  {
    // -- Catch `navigate back` action from user

    if( !router[ offs$ ].popstate )
    {
      window.addEventListener('popstate', router._onHistoryPop );

      router[ offs$ ].popstate = () =>
      {
        window.removeEventListener('popstate', router._onHistoryPop );
      };
    }

    // -- Keep track of current language

    router[ offs$ ].currentLanguage =
      currentLanguage.subscribe( ( /*value*/ ) => {

        // debug("currentLanguage=" + value);

        router._updateCurrentRouteAndState();
      } );

    // -- Keep track of session data (used to update access property)

    // router[ offs$ ].sessionData =
    //   sessionData.subscribe( ( /*sessionDataValue*/ ) => {

    //     // debug("sessionData", sessionDataValue);

    //     router._updateCurrentRouteAndState();
    //   } );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Unregister location and session listeners
   */
  _unregisterLocationAndSessionListeners()
  {
    for( const key in router[ offs$ ] )
    {
      router[ offs$ ][ key ]();
    }
  }

  // -------------------------------------------------------------------- Method

  /**
   * Handle a browser history pop event (history go back)
   */
  _onHistoryPop()
  {
    // -- Try get latest history item from sessionStorage

    //console.log("*** onHistoryPop");

    const historyJson = sessionStorage.getItem( HISTORY_STORAGE_LABEL );

    let history;

    if( historyJson )
    {
      history = JSON.parse( historyJson );

      if( history.length > 1 )
      {
        history.pop();

        sessionStorage.setItem( HISTORY_STORAGE_LABEL, JSON.stringify(history) );

        const current = history[ history.length - 1 ];

        // Removes forward button, but adds extra property to the stack...
        window.history.pushState( null, '', current.path );

        // console.log("_onHistoryPop(): history", history);

        router._updateCurrentRouteAndState();
        return;
      }
    }

    // No state found for current url -> create empty state
    // (let panel decide what to do in case of an error)

    if( history && history.length )
    {
      console.log("_onHistoryPop(): state not found -> redirect to latest");

      const latest = history[ history.length - 1];
      router.redirectTo( latest.path, { replaceCurrent: true } );
    }
    else {
      console.log("_onHistoryPop(): state not found -> redirect to home");
      router.redirectToRoute( router[ homeLabel$ ] );
    }
  }

  // -------------------------------------------------------------------- Method

  /**
   * Get the current state from the state history in the session storage
   * - Returns null if no state was found in the session storage
   *
   * @returns {object|null} The current state (cloned) or null if not found
   */
  _getCurrentStateFromSessionStorage()
  {
    // -- Try get latest history item from sessionStorage

    const historyJson = sessionStorage.getItem( HISTORY_STORAGE_LABEL );

    // console.log("_getCurrentStateFromSessionStorage (1)", location.href, historyJson);

    let lastItem;

    if( historyJson )
    {
      const history = JSON.parse( historyJson );

      if( history.length )
      {
        lastItem = history[ history.length - 1 ];
      }
    }

    if( !lastItem )
    {
      return null;
    }

    const locationPath =
      router._stripPath(
        location.href, { includeSearch: true, includeHash: true } );

    if( lastItem.path === locationPath )
    {
      if( !lastItem.data )
      {
        // FIXME: replace by validate state?
        lastItem.data = {};
      }

      return lastItem;
    }

    return null;
  }

  // -------------------------------------------------------------------- Method

  /**
   * Get current state or create and set a new state
   */
  _getOrCreateCurrentState()
  {
    const currentState = router._getCurrentStateFromSessionStorage();

    if( currentState )
    {
      return currentState;
    }

    // -- Create new state

    const state = router._stateFromLocationHref();

    let historyJson = sessionStorage.getItem( HISTORY_STORAGE_LABEL );

    let history;

    if( historyJson )
    {
      history = JSON.parse( historyJson );

      expectArray( history,
        `Invalid local storage item [${HISTORY_STORAGE_LABEL}]` );
    }
    else {
      history = [];
    }

    history.push( state );

    // debug( "pushState:history", history );
    // console.log( "_getOrCreateCurrentState: createState", state );

    historyJson = JSON.stringify(history);

    sessionStorage.setItem( HISTORY_STORAGE_LABEL, historyJson );

    // TODO: depreceate?
    localStorage.setItem( HISTORY_STORAGE_LABEL, historyJson );

    window.history.pushState( null, '', state.path );

    return state;
  }

  // -------------------------------------------------------------------- Method

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

    const state = { path, data: {} };

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

  // -------------------------------------------------------------------- Method

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

  // -------------------------------------------------------------------- Method

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

    let currentState = router._getCurrentStateFromSessionStorage();

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

  // -------------------------------------------------------------------- Method

  /**
   * Normalize a state object
   * - Inherits `path`, `main` from current state (if any)
   * - Generate new state id's
   *
   * @param {object} state - State object { [path] [,data] }
   */
  _normalizeState( state )
  {
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

    let currentState = router._getCurrentStateFromSessionStorage();

    if( !currentState )
    {
      //throw new Error("Missing [currentState] (not found in storage)");
      console.error("Missing [currentState] (not found in storage)");
      currentState = router._getOrCreateCurrentState();
    }

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

  // -------------------------------------------------------------------- Method

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

  // -------------------------------------------------------------------- Method

  /**
   * Normalize a part of a route
   * - A route part can be the [app], [layout] or a [panel] part of the route
   *
   * @param {object} routePart
   */
  _normalizeAppParams( routePart )
  {
    expectObject( routePart, "Missing or invalid parameter [routePart]" );

    const background = routePart.background;

    if( background )
    {
      expectString( background,
        "Missing or invalid parameter [routePart.background]" );
    }
    // else {
    //   routePart.background = "";
    // }
  }

  // -------------------------------------------------------------------- Method

  /**
   * Update current route and state
   */
  async _updateCurrentRouteAndState()
  {
    // console.log(
    //   "CHECK scroll restauration", { restore: history.scrollRestoration } );

    // Update store `routeStateAccessStore`
    // - The router is started during bootstrap, using defer gives
    //   components a chance to react upon the initial state

    defer( () => {
      const newRouteStateAccess = router.getRouteStateAccess();

      const existingValue = router.routeStateAccessStore.get();

      if( equals( existingValue, newRouteStateAccess ) )
      {
        // Ignore update if state did not change:
        //
        // Identical states may occur due to:
        // - language change
        // - sessionData that changed (but did not alter the state)

        return;
      }


      router.routeStateAccessStore.set( newRouteStateAccess );
    } );
  }

  // -------------------------------------------------------------------- Method

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

  // -------------------------------------------------------------------- Method

  /**
   * Strip parts from the supplied path
   * - Removes origin
   *
   * @param {string} path
   * @param {boolean} [includeSearch=false] - Include query part of the path
   * @param {boolean} [includeHash=false] - Include hash part of the path
   *
   * @returns {string} location path without query or hash
   */
  _stripPath( path, params )
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

    if( params )
    {
      includeSearch = params.includeSearch ? true : false;
      includeHash = params.includeHash ? true : false;
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

  // -------------------------------------------------------------------- Method

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
