/**
 * BackendService.js
 *
 * @description
 * This file contains a generic service that can be used to communicate
 * with a backend.
 *
 * During initialization of the service, the service will try to find an
 * indentity token, either in the url or in the session storage.
 * - If an expired identity token is found, it will be erased
 *
 * Functionality includes:
 * - jsonPost - API POST request
 * - jsonGet - API GET request
 * - jsonPostWithIdentity - POST request that includes an identity token
 * - jsonGetWithIdentity - GET request that includes an identity token
 * - setToken - Set a token that can be used for backend communication
 * - getTokenStore - Get the store object in which a token is stored
 * - getIdentityTokenStore - Get the store object of the identity token
 * - tryGetToken - Get a token if set
 * - tryGetDecodedToken - Get a decoded token if set
 * - tryGetDecodedIdentityToken - Get a decoded identity token if set
 * - logout - Clear session data on the browser side (identity token)
 * - decodeToken - Helper function to decode (view) token contents
 *
 * @example
 *
 *   import BackendService from "./BackendService.js";
 *
 *   await InitService.register(
 *     {
 *      service: BackendService,
 *      config: { ... },
 *      startOnBoot: true
 *    } );
 *
 *   await InitService.boot();
 *
 *  ...
 *
 *  const service = InitService.service( "BackendService" );
 *
 *  const result = await service.doSomething();
 */

/* ------------------------------------------------------------------ Imports */

import { expectString,
         expectNotEmptyString } from "@hkd-base/helpers/expect.js";

import { Base } from "@hkd-base/helpers/services.js";

import DedupValueStore from "@hkd-base/classes/DedupValueStore.js";

import {
  STOPPED,
  STARTING,
  RUNNING,
  STOPPING,
  /* UNAVAILABLE, */
  /* ERROR */ } from "@hkd-base/helpers/service-states.js";

import { jsonApiGet,
         jsonApiPost } from "@hkd-base/helpers/json-api.js";

import { decodePayload } from "@hkd-base/helpers/jwt-info.js";

import MemoryCache from "@hkd-base/classes/MemoryCache.js";

import { clearHistoryStorage } from "@hkd-fe/stores/router.js";

import { goHome } from "@hkd-fe/stores/router.js";

/* ------------------------------------------------------------------ Helpers */

/* ---------------------------------------------------------------- Internals */

const CHECK_TOKEN_EXPIRED_LOOP_INTERVAL = 10000;
const TOKEN_EXPIRED_MARGIN_MS = 300000; // 300 seconds = 5 minutes

/* ------------------------------------------------------------------ Exports */

export const IDENTITY_TOKEN_NAME = "jwt-idty";

/* ------------------------------------------------------------ Service class */

class BackendService extends Base
{
  cache = new MemoryCache( { defaultTTL: 60000 } );

  config = null;
  tokens = {};

  constructor()
  {
    /**
     * @callback configureFn
     *
     * @param {object} config
     *
     * @param {object} config.origin
     * @param {object} config.apiPrefix
     *
     * @param {boolean} [config.disableIdentityToken=false]
     */
    super( /* configureFn */ ( config={} ) =>
      {
        const displayConfig = config;

        expectNotEmptyString( config.origin,
          "Missing or invalid parameter [config.origin]" );

        expectString( config.apiPrefix,
          "Missing or invalid parameter [config.apiPrefix]" );

        // -- Setup identity token

        if( !config.disableIdentityToken )
        {
          this.tokens[ IDENTITY_TOKEN_NAME ] = new DedupValueStore();
        }

        // -- Get tokens from URL or session storage

        {
          const tokens = this.tokens;

          for( const tokenName in tokens )
          {
            this.tryUseTokenFromUrl( tokenName );

            if( !this.tryGetToken( tokenName ) )
            {
              // Token not found in URL, try session storage
              this.tryUseTokenFromSessionStorage( tokenName );
            }

            if( !this.tokens[ tokenName ].get() )
            {
              //
              // Set all not-set tokens to null to finish the initialization
              //
              this.tokens[ tokenName ].set( null ) ;
            }

          } // end for
        }

        // -- Store config

        this.config = config;

        // -- Log service state

        // this.subscribeToState( ( /* currentState */ ) =>
        //   {
        //     this.log.info(
        //       `${this.serviceName()} ==> Current state [${this.getState(true)}]`);
        //   } );

        // -- Transition to RUNNING

        this.setTransitionHandler(
          RUNNING, this._transitionToRunning.bind(this) );

        // -- Transition to STOPPED

        this.setTransitionHandler(
          STOPPED, this._transitionToStopped.bind(this) );

        // this.log.debug(`Configured ${this.serviceName()}`, displayConfig);
      } );
  }


  // ---------------------------------------------------------------------------

  /**
   * Send POST request to the backend
   *
   * @param {string} _.uri
   * @param {object|null} _.body
   *
   * @param {string} [_.tokenName]
   *   Name of the token to use (should be defined in service property
   *   `tokens`), e.g. IDENTITY_TOKEN_NAME
   *
   * @returns {object} backend response
   */
  async jsonPost( { uri, body, tokenName=null }={} )
  {
    const remoteConfig =
      {
        origin: this.config.origin,
        apiPrefix: this.config.apiPrefix
      };

    expectNotEmptyString( remoteConfig.origin,
        "Missing or invalid configuration property [origin]" );

    expectString( remoteConfig.apiPrefix,
        "Missing or invalid configuration property [apiPrefix]" );

    if( tokenName )
    {
      const token = this.tryGetToken( tokenName );

      if( !token )
      {
        throw new Error(`The token [${tokenName}] has not been set.`);
      }

      remoteConfig.token = token;
    }

    // this.log.debug(`${this.serviceName()}.jsonPost`, { uri, body }, remoteConfig);

    const result =
      await jsonApiPost(
        {
          uri,
          body,
          config: remoteConfig
        } );

    if( result.error )
    {
      return { error: new Error(`${this.serviceName()}.jsonPost failed`, {} ) };
    }

    return result;
  }

  // ---------------------------------------------------------------------------

  /**
   * Send GET request to the backend
   *
   * @param {string} _.uri
   *
   * @param {object} [urlSearchParams]
   *   Parameters that should be added to the request url
   *
   * @param {string} [_.tokenName]
   *   Name of the token to use (should be defined in service property
   *   `tokens`), e.g. IDENTITY_TOKEN_NAME
   *
   * @returns {object} backend response
   */
  async jsonGet( { uri, urlSearchParams, tokenName=null }={} )
  {
    const remoteConfig =
      {
        origin: this.config.origin,
        apiPrefix: this.config.apiPrefix
      };

    expectNotEmptyString( remoteConfig.origin,
        "Missing or invalid configuration property [origin]" );

    expectString( remoteConfig.apiPrefix,
        "Missing or invalid configuration property [apiPrefix]" );

    if( tokenName )
    {
      const token = this.tryGetToken( tokenName );

      if( !token )
      {
        throw new Error(`The token [${tokenName}] has not been set.`);
      }

      remoteConfig.token = token;
    }

    // this.log.debug(
    //   `${this.serviceName()}.jsonGet`,
    //   { uri, urlSearchParams }, remoteConfig);

    const result =
      await jsonApiGet(
        {
          uri,
          urlSearchParams,
          config: remoteConfig
        } );

    if( result.error )
    {
      return { error: new Error(`${this.serviceName()}.jsonGet failed`, {} ) };
    }

    return result;
  }

  // ---------------------------------------------------------------------------

  /**
   * Send POST request to the backend that includes the identity token service
   * property.
   *
   * @param {string} _.uri
   * @param {object|null} _.body
   *
   * @returns {object} backend response
   */
  async jsonPostWithIdentity( { uri, body }={} )
  {
    return this.jsonPost(
      { uri, body, tokenName: IDENTITY_TOKEN_NAME } );
  }

  // ---------------------------------------------------------------------------

  /**
   * Send GET request to the backend that includes the identity token service
   * property.
   *
   * @param {string} _.uri
   *
   * @param {object} [urlSearchParams]
   *   Parameters that should be added to the request url
   *
   * @returns {object} backend response
   */
  async jsonGetWithIdentity( { uri, urlSearchParams }={} )
  {
    return this.jsonGet(
      { uri, urlSearchParams, tokenName: IDENTITY_TOKEN_NAME } );
  }

  // ---------------------------------------------------------------------------

  // TODO: jsonApiPost debounced

  // ---------------------------------------------------------------------------

  /**
   * Set an identityToken that can be used for personal communication with
   * the backend.
   *
   * @param {string} tokenName
   * @param {string} token
   *
   * @returns {boolean} true if the token has been set
   */
  setToken( { tokenName, token } )
  {
    expectNotEmptyString( tokenName,
      "Missing or invalid item in service config [tokenName]" );

    expectNotEmptyString( token,
      "Missing or invalid item in service config [token]" );

    if( this._tryRemoveExpiredToken( { tokenName, token } ) )
    {
      token = null;
    }

    const existingToken = window.sessionStorage.getItem( tokenName );

    if( token )
    {
      if( existingToken !== token )
      {
        window.sessionStorage.setItem( tokenName, token );
      }
    }
    else if( !token && existingToken )
    {
      this.log.debug("****remove token from storage");
      window.sessionStorage.removeItem( tokenName );
    }

    if( this.tokens[ tokenName ] )
    {
      this.tokens[ tokenName ].set( token );
    }
    else {
      this.tokens[ tokenName ] = new DedupValueStore( token );
    }

    return !!token;
  }

  // ---------------------------------------------------------------------------

  /**
   * Get a token store
   *
   * @param {string} tokenName
   *
   * @returns {object} token store instance
   */
  getTokenStore( tokenName )
  {
    expectNotEmptyString( tokenName,
      "Missing or invalid parameter [tokenName]" );

    const tokenStore = this.tokens[ tokenName ];

    if( !tokenStore )
    {
      throw new Error(
        `No token store has not been defined for token [${tokenName}]`);
    }

    return tokenStore;
  }

  // ---------------------------------------------------------------------------

  /**
   * Get the indentity token store
   *
   * @param {string} tokenName
   *
   * @returns {object} identity token store instance
   */
  getIdentityTokenStore()
  {
    return this.getTokenStore( IDENTITY_TOKEN_NAME );
  }

  // ---------------------------------------------------------------------------

  /**
   * Get the specified token from `this.tokens`
   *
   * @param {string} tokenName
   *
   * @returns {string|null} token or null if not found
   */
  tryGetToken( tokenName )
  {
    expectNotEmptyString( tokenName,
      "Missing or invalid parameter [tokenName]" );

    const tokenStore = this.tokens[ tokenName ];

    if( !tokenStore )
    {
      return null;
    }

    let token = tokenStore.get() || null;

    if( token )
    {
      if( this._tryRemoveExpiredToken( { tokenName, token } ) )
      {
        token = null;
      }
    }

    return token;
  }

  // ---------------------------------------------------------------------------

  /**
   * Get the decoded payload of the token stored in `this.tokens`
   *
   * @param {string} tokenName
   *
   * @returns {object} decoded token
   */
  tryGetDecodedToken( tokenName )
  {
    expectNotEmptyString( tokenName,
      "Missing or invalid parameter [tokenName]" );

    const token = this.tryGetToken( IDENTITY_TOKEN_NAME );

    if( !token )
    {
      throw new Error("The identity token (service property) has been set");
    }

    return this.decodeToken( token );
  }

  // ---------------------------------------------------------------------------

  /**
   * Get the decoded payload of the identity token stored in `this.tokens`
   *
   * @returns {object} decoded token
   */
  tryGetDecodedIdentityToken()
  {
    return this.tryGetDecodedToken( IDENTITY_TOKEN_NAME );
  }

  // ---------------------------------------------------------------------------

  /**
   * Logout
   * - Remove identity token from session storage
   * - Clear routing history from session storage
   * - Redirect to home
   */
  logout()
  {
    // -- Unset identity token

    this.getIdentityTokenStore().set( null );

    // -- Remove identity token from session storage

    try
    {
      window.sessionStorage.removeItem( IDENTITY_TOKEN_NAME );
    }
    catch( e )
    {
      this.log.debug(
        `Failed to remove token [${IDENTITY_TOKEN_NAME}] from session storage`);
    }

    // -- Remove history from session storage

    clearHistoryStorage();

    // -- Redirect to home

    goHome();
    // location.reload( true );
  }

  // ---------------------------------------------------------------------------

  /**
   * Helper function to decode tokens
   * - Uses memory caching to speed up frequently decoded tokens
   *
   * @param {string} token
   *
   * @returns {object} decodedToken
   */
  decodeToken( token )
  {
    expectNotEmptyString( token, "Missing or invalid parameter [token]" );

    let decodedToken = this.cache.get( token );

    if( !decodedToken )
    {
      decodedToken = decodePayload( token );

      this.cache.set( token, decodedToken );
    }

    return decodedToken;
  }

  // ---------------------------------------------------------------------------

  /**
   * Try to use a JWT token from the url and store it as
   * internal property
   *
   * @param {string} tokenName
   *
   * @returns {string|null} token or null if not found
   */
  tryUseTokenFromUrl( tokenName )
  {
    expectNotEmptyString( tokenName,
      "Missing or invalid item in service config [tokenName]" );

    let token;

    try {
      const hash = location.hash;

      if( hash.startsWith(`#${tokenName}=`) )
      {
        token = hash.slice( tokenName.length + 2 );

        // TODO: clear location hash
      }

      // this.log.debug( "tryUseTokenFromUrl", hash );

      if( token )
      {
        if( this.setToken( { tokenName, token } ) )
        {
          const decodedToken = this.decodeToken( token );

          this.log.debug( "Got token from URL", decodedToken );

          return token;
        }

        //
        // FIXME: this also remove other parts of the hash (if any)
        //
        location.hash = "";
      }
    }
    catch( e )
    {
      this.log.debug(`Invalid token in url`, { cause: e } );
    }

    return null;
  }

  // ---------------------------------------------------------------------------

  /**
   * Try to use a JWT token from the session storage and store it as
   * internal property
   *
   * @param {string} tokenName
   *
   * @returns {string|null} token or null if not found
   */
  tryUseTokenFromSessionStorage( tokenName )
  {
    expectNotEmptyString( tokenName,
      "Missing or invalid item in service config [tokenName]" );

    const token = window.sessionStorage.getItem( tokenName );

    if( token )
    {
      // Automatically remove invalid tokens from session storage
      try {
        this.decodeToken( token );
      }
      catch( e )
      {
        this.log.debug( `Remove token from storage`, e );

        window.sessionStorage.removeItem( tokenName );

        return null;
      }
    }

    if( token )
    {
      if( this.setToken( { tokenName, token } ) )
      {
        const decodedToken = this.decodeToken( token );

        this.log.debug(
          `Got token [${tokenName}] from session storage`, decodedToken );
      }

      this.setToken( { token, tokenName } );

      return token;
    }

    return null;
  }

  /* ------------------------------------------------------- Internal methods */

  /**
   * Try to remove an expired token
   *
   * @param {string} tokenName
   * @param {string} [token]
   *
   * @returns {boolean} true if the token has expired (and has been removed)
   */
  _tryRemoveExpiredToken( { tokenName, token=null } )
  {
    if( !token )
    {
      const tokenStore = this.tokens[ tokenName ];

      if( tokenStore )
      {
        token = tokenStore.get();
      }

      if( !token )
      {
        // Token has not been supplied and does not exist in `this.tokens`
        return true;
      }
    }

    const decodedToken = this.decodeToken( token );

    if( "exp" in decodedToken )
    {
      const expiresAtMs = decodedToken.exp * 1000;

      if( expiresAtMs < Date.now() - TOKEN_EXPIRED_MARGIN_MS )
      {
        // token has expired (will expire soon)
        // => remove from session storage
        // => remove from this.tokens

        this.log.debug(`Token [tokenName] has expired -> remove`);

        window.sessionStorage.removeItem( tokenName );

        if( this.tokens[ tokenName ] )
        {
          this.tokens[ tokenName ].set( null );
        }

        // The token has expired and has been removed
        return true;
      }
    }
  }

  // ---------------------------------------------------------------------------

  /**
   * Start a loop that unsets / removes expired tokens
   *
   * @returns {function} unsubscribe function
   */
  _startCheckTokenExpiredLoop()
  {
    let timer = setInterval( () =>
      {
        const tokens = this.tokens;

        for( const tokenName in tokens )
        {
          this._tryRemoveExpiredToken( tokenName );
        }
      },
      CHECK_TOKEN_EXPIRED_LOOP_INTERVAL );

    return () => {
      // unsubscribe fn

      clearInterval( timer );
      timer = null;
    };
  }

  // ---------------------------------------------------------------------------

  /**
   * Transition to service state RUNNING
   *
   * @param {function} setState
   */
  async _transitionToRunning( setState )
  {
    // this.log.debug(`${this.serviceName()}._transitionToRunning()`);

    const currentState = this.getState();

    switch( currentState )
    {
      case STARTING:
      case STOPPING:
        throw new Error(
          `Cannot transition to [RUNNING] from [${currentState.toString()}]`);
    }

    // - Start check token expired loop

    this.__offs.register( this._startCheckTokenExpiredLoop() );

    // - Set service state

    setState( RUNNING );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Transition to service state STOPPED
   *
   * @param {function} setState
   */
  async _transitionToStopped( setState)
  {
    const currentState = this.getState();

      switch( currentState )
      {
        case STARTING:
        case STOPPING:
          throw new Error(
            `Cannot transition to [STOPPED] from [${currentState.toString()}]`);
      }

      // - Execute offs

      this.__offs.unsubscribeAll();

      // - Set service state

      setState( STOPPED );
  }

} // end service class

/* ------------------------------------------------------------------ Exports */

export default new BackendService();
