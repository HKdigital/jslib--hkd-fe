
/* ------------------------------------------------------------------ Imports */

import {
  expectString,
  expectArray,
  expectObject,
  expectSet } from "@hkd-base/expect.js";

import { defer } from "@hkd-base/process.js";

import { rethrow } from "@hkd-base/exceptions.js";

import { equals } from "@hkd-base/compare.js";

import { clone, updateObject } from "@hkd-base/object.js";

import { generateLocalId } from "@hkd-base/unique.js";

import { ValueStore } from "@hkd-base/stores.js";

import { currentLanguage,
         LANG_DEFAULT } from "@hkd-base/stores/language.js";

import { sessionData,
         authenticationBusy } from "@hkd-fe/stores/session.js";

import PathMatcher from "@hkd-fe/classes/PathMatcher.js";

// import { debug } from "@hkd-base/log.js";

/* ---------------------------------------------------------------- Internals */

const pathMatcher$ = Symbol("pathMatcher");
const routesByLangAndLabel$ = Symbol("routesByLangAndLabel");

const offs$ = Symbol("offs");

// const sessionStorage$ = Symbol("storage");

const HISTORY_STORAGE_LABEL = "navigator/history";

const MAX_HISTORY_LENGTH = 15;

const ALLOWED_STATE_PROPERTIES = new Set( ["data", "id", "path"] );

const NOT_FOUND_ROUTE = "not-found";
const HOME_ROUTE = "/";

/* ------------------------------------------------------------------ Exports */

export default class Navigator
{
  /**
   * Construct a Navigator (frontend router) instance
   */
  constructor()
  {
    this[ offs$ ] = {};

    // Create path matcher, used to find corresponding routes

    this[ pathMatcher$ ] = new PathMatcher();

    // Also keep track of routes by language and route label

    this[ routesByLangAndLabel$ ] = {};

    if( !sessionStorage.getItem( HISTORY_STORAGE_LABEL ) )
    {
      // TODO copy state to server and use access code!!!

      let historyJson = localStorage.getItem( HISTORY_STORAGE_LABEL );

      if( historyJson )
      {
        let currentPath =
          this._stripPath(
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

    // Define store that can be used to listen to navigation updates
    //
    // Set `sane` defaults in case the store is accessed before route and
    // state have been set
    //

    const initialRouteAndState =
      {
        route: { layout: null },
        state: this._getOrCreateCurrentState(),
        access: { validated: false }
      };

    this.currentRouteAndState =
      new ValueStore( initialRouteAndState );

    this.currentRouteAndState
      .hasSubscribers.subscribe( ( hasSubscribers ) =>
        {
          if( !this[ pathMatcher$ ] )
          {
            throw new Error(`Not configured yet (call configureRoutes first)`);
          }

          if( hasSubscribers )
          {
            this._registerLocationAndSessionListeners();
          }
          else {
            this._unregisterLocationAndSessionListeners();
          }
        },
        false );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Configure routes
   * - Process a list of route definitions
   * - Set or replace the routes this instance knows about
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
   *      component: StandardAppLayout,
   *      backgroundColor: SURFACE_WHITE
   *    }
   *
   *  @property {object} views
   *  @property {object} views.<bar-or-panel-name>
   *
   *    e.g.
   *
   *    views:
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

    this[ pathMatcher$ ] = new PathMatcher();

    for( const route of routes )
    {
      expectObject( route,
        "Invalid configuration [routes] (items should be objects)" );

      // -- Process property `label`

      const label = route.label;

      expectString( label,
        "Invalid configuration [routes] " +
        "(missing or invalid property item.label)" );

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

      const path = route.path;

      expectString( path,
        "Invalid configuration [routes] " +
        "(missing or invalid property item.path)" );

      // -- Process property `app`

      if( route.app )
      {
        try {
          this._normalizeAppParams( route.app );
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
          this._normalizeLayoutOrViewParams( route.layout );
        }
        catch( e )
        {
          rethrow( "Invalid configuration [layout]", e );
        }
      }
      else {
        route.layout = null;
      }

      // -- Process property `views`

      if( route.views )
      {
        const views = route.views;

        expectObject( views,
          "Invalid configuration (missing or invalid property [item.views])" );

        for( const key in views )
        {
          const view = views[ key ];

          try {
            this._normalizeLayoutOrViewParams( view );
          }
          catch( e )
          {
            rethrow( `Invalid configuration [views[${key}]]`, e );
          }
        }
      }
      else {
        route.views = {};
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

      this[ pathMatcher$ ].add( path, route );

      // -- Add route to routesByLangAndLabel (used by method getRoute)

      this[ routesByLangAndLabel$ ][ `${language}:${label}` ] = route;

    } // end for


    if( !this._tryCurrentRouteIsRedirect() )
    {
      // Force initial update
      this._updateCurrentRouteAndState();
    }
  }

  // -------------------------------------------------------------------- Method

  /**
   * Get a store that outputs the current state
   * - When the route path changes, the store auto destructs
   * - When the last subscriber unsubscribes, the store auto destructs
   *
   * - When the store is destructed, the store values will no longer be updated
   *
   * @returns {object} current state store instance
   */
  getCurrentStateStore()
  {
    const currentRouteAndState = this.currentRouteAndState;

    const currentState = this._getCurrentStateFromStorage();

    const originalPath =
      this._stripPath( currentState.path, { includeHash: false } );

    const stateForCurrentRouteStore = new ValueStore( currentState );

    const unsubscribe$ =
      Symbol("unsubscribeStateForCurrentRoute");

    const unsubscribeHasSubscribers$ =
      Symbol("unsubscribeStateForCurrentRouteHasSubscribers");

    const destroy = () => {

      // console.log(`*** destroy currentStateStore for [${originalPath}]`);

      if( this[ offs$ ][ unsubscribe$ ] )
      {
        this[ offs$ ][ unsubscribe$ ]();
        delete this[ offs$ ][ unsubscribe$ ];
      }

      // if( null !== stateForCurrentRouteStore.get() )
      // {
      //   // Set null to indicate the store has been destructed
      //   stateForCurrentRouteStore.set( null );
      // }

      if( this[ offs$ ][ unsubscribeHasSubscribers$ ] )
      {
        // Auto destroy
        this[ offs$ ][ unsubscribeHasSubscribers$ ]();
      }
    };

    // let previousState = currentState;
    let previousState = null;

    this[ offs$ ][ unsubscribeHasSubscribers$ ] =
      stateForCurrentRouteStore
        .hasSubscribers.subscribe( ( $hasSubscribers ) =>
    {
      // console.log(
      //   "stateForCurrentRouteStore.hasSubscribers", $hasSubscribers );

      if( $hasSubscribers )
      {
        this[ offs$ ][ unsubscribe$ ] =
          currentRouteAndState.subscribe( ( $currentRouteAndState ) =>
          {
            const currentState = $currentRouteAndState.state;

            const currentPath =
              this._stripPath( currentState.path, { includeHash: false } );

            if( originalPath === currentPath )
            {
              if( !equals( currentState, previousState ) )
              {
                // @note duplicate states are skipped

                previousState = currentState;

                // Set current state

                stateForCurrentRouteStore
                  .set( { data: {}, ...currentState } );
              }
            }
            else {
              // console.log(
              //   "*** path changed -> destroy",
              //   {
              //     originalPath,
              //     currentPath
              //   } );

              // Path changed -> destroy
              destroy();
            }
          } );
      }
      else if( this[ offs$ ][ unsubscribe$ ] ) {
        // subscribed -> destroy
        // console.log("*** no more subscribers -> destroy");
        destroy();
      }
    } );

    return stateForCurrentRouteStore;
  }

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

    let plainPath = this._stripPath( path );

    const route = this[ pathMatcher$ ].matchOne( plainPath );

    if( !route )
    {
      throw new Error(`No route found for path [${plainPath}]`);
    }

    // console.log("redirectTo: route found", route );

    // -- Handle [redirectToRoute] property

    if( route.data.redirectToRoute )
    {
      this.redirectToRoute( route.data.redirectToRoute );
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
      this.replaceState( newState );
    }
    else {
      this.pushState( newState );
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
    console.log("redirectToRoute", label);

    expectString( label, "Missing or invalid parameter [label]" );

    let path;

    if( options )
    {
      expectObject( options, "Missing or invalid parameter [options]" );

      path = this.routePath( label, options.lang );
    }
    else {
      path = this.routePath( label );
    }

    // console.log(`redirectToRoute [label=${label}], [path=${path}]`, options);

    this.redirectTo( path, options );
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

    this._updateCurrentRouteAndState();
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
    const currentState = this._getCurrentStateFromStorage();

    if( !currentState )
    {
      throw new Error("No current state");
    }

    let updatedData =
      this._cloneAndUpdate( currentState.data, updateData );

    const newState = currentState;

    newState.data = updatedData;

    if( !replaceCurrent )
    {
      this.pushState( newState );
    }
    else {
      this.replaceState( newState );
    }
  }

  // -------------------------------------------------------------------- Method

  /**
   * Remove the query (search) part of the url
   * - Replaces the current state
   */
  removeSearchParams()
  {
    let state = this._getCurrentStateFromStorage();

    if( !state.search )
    {
      return;
    }

    let path =
      this._stripPath(
        location.href, { includeSearch: false, includeHash: true } );

    this.redirectTo( path,
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
    const currentState = this._getCurrentStateFromStorage();

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
        this._cloneAndUpdate( returnState.data, updateData );

      newState.data.returnState.data = updatedReturnStateData;
    }
    else {
      // updateData = null -> clear return state data
      newState.data = {};
    }

    // console.log(
    //   "*** updateReturnStateData: newState",
    //   JSON.stringify( newState, null, 2));

    this.replaceState( newState );
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

    let currentState = this._getCurrentStateFromStorage();

    let returnState = currentState.data.returnState;

    if( !returnState )
    {
      throw new Error("Missing [currentState.data.returnState]");
    }

    if( updateData )
    {
      this.updateReturnStateData( updateData );

      currentState = this._getCurrentStateFromStorage();
      returnState = currentState.data.returnState;

      // console.log("*** redirectToReturnState: updated currentState", currentState );
    }
    else if( null === updateData )
    {
      // updateData = null -> delete property
      delete returnState.data;
    }

    this._normalizeState( returnState );

    // console.log("*** redirectToReturnState", returnState );

    // Go back and replace the previous state by the `returnState`
    this.replaceState( returnState, { goBackFirst } );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Returns the current path
   * - Gets the path from location.href
   *
   * @returns {string} the current path
   */
  getCurrentPath()
  {
    const path =
      this._stripPath(
        location.href, { includeSearch: true, includeHash: true } );

    return path;
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
    const currentState = this._getCurrentStateFromStorage();

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
   * @param {string} [lang=<current>]
   *   Language, if not specified, the current language will be used
   */
  routePath( label, lang )
  {
    return this.getRoute( label, lang ).path;
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

    const route = this[ routesByLangAndLabel$ ][ `${lang}:${label}` ];

    if( !route )
    {
      throw new Error(
        `No route found for label [${label}] and language [${lang}]`);
    }

    return route;
  }

  // -------------------------------------------------------------------- Method

  /**
   * Get the current route and state
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
  getRouteAndState()
  {
    let currentState = this._getCurrentStateFromStorage();

    if( !currentState )
    {
      //throw new Error("No current state");
      currentState = this._getOrCreateCurrentState();
    }

    const path = currentState.path;

    expectString( path, "Missing or invalid parameter [path]" );

    let plainPath = this._stripPath( path );

    let route = this[ pathMatcher$ ].matchOne( plainPath );

    if( !route )
    {
      throw new Error(`No route found for path [${plainPath}]`);
    }

    // - Access

    let access;

    const sessionDataValue = sessionData.get();

    // console.log( "Navigator:authenticationBusy", authenticationBusy.get() );
    // console.log( "Navigator:sessionDataValue", sessionDataValue );

    const allowGuest = route.data.allowGuest;
    const requireGroup = route.data.requireGroup;

    if( !authenticationBusy.get() )
    {
      if( requireGroup )
      {
        if( !sessionDataValue )
        {
          access = { allowed: false, validated: false };
        }
        else {
          // Get user groups from session data

          let groups = sessionDataValue.groups;

          if( groups )
          {
            expectSet( groups,
              "Invalid property [groups] in session data " );
          }
          else {
            groups = new Set();
          }

          // console.log("****requireGroup", { requireGroup, groups });

          if( groups.has( requireGroup ) )
          {
            access = { allowed: true, validated: true };
          }
          else {
            access = { allowed: false, validated: true };
          }
        }
      }
      else if( false === allowGuest )
      {
        // User should not be a guest

        // console.log("****!allowGuest", { isGuest: sessionDataValue.isGuest });

        if( !sessionDataValue )
        {
          access = { allowed: false, validated: false };
        }
        else {
          access = {
            allowed: !sessionDataValue.isGuest,
            validated: true };
        }
      }
      else {
        access = { allowed: true, validated: true };
      }
    }
    else {
      // FIXME: use current value for access ????
      access = { allowed: false, validated: false };
    }

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
    this._normalizeState( state );

    if( !this._stateChanged( state ) )
    {
      //throw new Error("Cannot push state (state has not changed)");
      console.error("Cannot push state (state has not changed)");
      return;
    }

    // debug( "pushState", state );

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
    this._updateCurrentRouteAndState();
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
    this._normalizeState( state );

    // debug( "replaceState", state );

    if( !this._stateChanged( state ) )
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

    this._updateCurrentRouteAndState();
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
    let plainPath = this._stripPath( location.href );

    const route = this[ pathMatcher$ ].matchOne( plainPath );

    if( !route )
    {
      const notFoundRoute = this[ pathMatcher$ ].matchOne( NOT_FOUND_ROUTE );

      if( notFoundRoute )
      {
        this.redirectToRoute( NOT_FOUND_ROUTE, { replaceCurrent: true } );
      }
      else {
        this.redirectToRoute( HOME_ROUTE, { replaceCurrent: true } );
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

      this.redirectToRoute(
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

    if( !this[ offs$ ].popstate )
    {
      window.addEventListener('popstate', this._onHistoryPop.bind(this) );

      this[ offs$ ].popstate = () =>
      {
        window.removeEventListener('popstate', this._onHistoryPop.bind(this) );
      }
    }

    // -- Keep track of current language

    this[ offs$ ].currentLanguage =
      currentLanguage.subscribe( ( value ) => {

        // debug("currentLanguage=" + value);

        this._updateCurrentRouteAndState();
      } );

    // -- Keep track of session data (used to update access property)

    this[ offs$ ].sessionData =
      sessionData.subscribe( ( sessionDataValue ) => {

        // debug("sessionData", sessionDataValue);

        this._updateCurrentRouteAndState();
      } );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Unregister location and session listeners
   */
  _unregisterLocationAndSessionListeners()
  {
    for( const key in this[ offs$ ] )
    {
      this[ offs$ ][ key ]();
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

        this._updateCurrentRouteAndState();
        return;
      }
    }

    // No state found for current url -> create empty state
    // (let view decide what to do in case of an error)

    if( history && history.length )
    {
      console.log("_onHistoryPop(): state not found -> redirect to latest");

      const latest = history[ history.length - 1];
      this.redirectTo( latest.path, { replaceCurrent: true } );
    }
    else {
      console.log("_onHistoryPop(): state not found -> redirect to home");
      this.redirectToRoute( "/" );
    }
  }

  // -------------------------------------------------------------------- Method

  /**
   * Get the current state from the state history in the storage
   *
   * @returns {object|null} The current state (cloned) or null if not found
   */
  _getCurrentStateFromStorage()
  {
    // -- Try get latest history item from sessionStorage

    const historyJson = sessionStorage.getItem( HISTORY_STORAGE_LABEL );

    // console.log("_getCurrentStateFromStorage (1)", location.href, historyJson);

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
      this._stripPath(
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
    const currentState = this._getCurrentStateFromStorage();

    if( currentState )
    {
      return currentState;
    }

    // -- Create new state

    const state = this._stateFromLocationHref();

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
      this._stripPath(
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

    let currentState = this._getCurrentStateFromStorage();

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

    this._ensureOnlyAllowedStateProperties( state );

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

    let currentState = this._getCurrentStateFromStorage();

    if( !currentState )
    {
      //throw new Error("Missing [currentState] (not found in storage)");
      console.error("Missing [currentState] (not found in storage)");
      currentState = this._getOrCreateCurrentState();
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
        `${this._stripPath( state.path, { includeSearch: true } )}#${id}`;
    }
    else {
      delete state.id;
    }
  }

  // -------------------------------------------------------------------- Method

  /**
   * Normalize a part of a route
   * - A route part can be the [app], [layout] or a [view] part of the route
   *
   * @param {object} routePart
   */
  _normalizeLayoutOrViewParams( routePart )
  {
    expectObject( routePart, "Missing or invalid parameter [routePart]" );

    const { component, classNames } = routePart;

    expectObject( component,
      "Missing or invalid parameter [routePart.component]" );

    if( classNames )
    {
      expectString( classNames,
        "Missing or invalid parameter [routePart.classNames]" );
    }
    else {
      routePart.classNames = "";
    }
  }

  // -------------------------------------------------------------------- Method

  /**
   * Normalize a part of a route
   * - A route part can be the [app], [layout] or a [view] part of the route
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

    // Update store `currentRouteAndState`
    // - The router is started during bootstrap, using defer gives
    //   components a chance to react upon the initial state

    defer( () => {
      const newRouteAndState = this.getRouteAndState();

      // newRouteAndState.t = Date.now() - 1626254670852;

      // console.log("_updateCurrentRouteAndState", newRouteAndState);

      const existingValue = this.currentRouteAndState.get();

      if( equals( existingValue, newRouteAndState ) )
      {
        // Ignore update if state did not change:
        //
        // Identical states may occur due to:
        // - language change
        // - sessionData that changed (but did not alter the state)

        return;
      }

      // console.log("_updateCurrentRouteAndState", newRouteAndState);

      this.currentRouteAndState.set( newRouteAndState );
    } );
  };

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

};