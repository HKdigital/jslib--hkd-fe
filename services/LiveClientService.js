/**
 * LiveClientService.js
 *
 * @description
 * This file contains a backend service that can be used for live communication
 * with a backend.
 *
 * During the initialization of the service two configuration parameters can be
 * supplied:
 * - config.origin - The origin of the live server
 * - config.apiPrefix - A API prefix
 *
 * A built-in URI is used to communicate with a Live service on the backend:
 * - URI_LIVE_FOLLOW (/live/follow)
 *
 * @example
 *
 *   import LiveClientService from "./LiveClientService.js";
 *
 *   await InitService.register(
 *     {
 *      service: LiveClientService,
 *      config: { ... },
 *      startOnBoot: true
 *    } );
 *
 *   await InitService.boot();
 *
 *  ...
 *
 * const LiveService = InitService.service( LIVE_SERVICE_NAME );
 *
 * const TEST_TOKEN_GET_TIME = "...";
 *
 * const store = LiveService.follow( { token: TEST_TOKEN_GET_TIME } );
 *
 * console.log( $store );
 *
 * $: {
 *   console.log( "event source data:", $store );
 * }
 */

/* ------------------------------------------------------------------ Imports */

import { expectString,
         expectNotEmptyString,
         expectBoolean }
  from '@hkd-base/helpers/expect.js';

import { Base }
  from '@hkd-base/helpers/services.js';

import {
    STOPPED,
    STARTING,
    RUNNING,
    STOPPING,
    /* UNAVAILABLE, */
    /* ERROR */ }
  from '@hkd-base/helpers/service-states.js';

import Feed
  from '@hkd-fe/classes/Feed.js';

// import MemoryCache from "@hkd-base/classes/MemoryCache.js";

// import { decodePayload } from "@hkd-base/helpers/jwt-info.js";

/* ---------------------------------------------------------------- Internals */

const URI_LIVE_FOLLOW = '/live/follow';

const TOKEN_LESS_FEED = Symbol('tokenLessFeed');

// const CHECK_TOKEN_EXPIRED_LOOP_INTERVAL = 10000;
// const TOKEN_EXPIRED_MARGIN_MS = 300000; // 300 seconds = 5 minutes

// -----------------------------------------------------------------------------

/**
 * Feed processor that just passes through the unprocessed data
 *
 * @param {object} eventOrError
 *
 * @returns {object} eventOrError
 */
function passThroughProcessor( eventOrError )
{
  return eventOrError;
}

/* ------------------------------------------------------------ Service class */

class LiveClientService extends Base
{
  feeds = {};

  constructor()
  {
    /**
     * @callback configureFn
     *
     * @param {object} config
     *
     * @param {object} config.origin
     * @param {object} config.apiPrefix
     */
    super( /* configureFn */ ( config={} ) =>
      {
        // this.setDependency( BACKEND_SERVICE_NAME );

        // const displayConfig = config;

        expectNotEmptyString( config.origin,
          'Missing or invalid parameter [config.origin]' );

        expectString( config.apiPrefix,
          'Missing or invalid parameter [config.apiPrefix]' );

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
   * Follow a live value from a remote live service
   *
   * @param {string} [token]
   * @param {function} [processor]
   * @param {boolean} [autoReconnect=true]
   *
   * @returns {object} a feed that can be subscribed to
   */
  follow( { token, processor, autoReconnect=true }={} )
  {
    if( token )
    {
      expectNotEmptyString( token,
        'Invalid value for parameter [token]' );
    }
    else {
      token = TOKEN_LESS_FEED;
    }

    expectBoolean( autoReconnect,
      'Invalid value for parameter [autoReconnect]' );

    const { origin,
            apiPrefix } = this.config;

    expectNotEmptyString( origin,
      'Missing or invalid parameter [origin]' );

    expectString( apiPrefix,
      'Missing or invalid parameter [apiPrefix]' );

    if( !processor )
    {
      processor = passThroughProcessor;
    }

    let feed = this.feeds[ token ];

    if( !feed )
    {
      const url = new URL(`${origin}${apiPrefix}${URI_LIVE_FOLLOW}`);

      if( TOKEN_LESS_FEED !== token )
      {
        url.searchParams.append('token', token);
      }

      feed = new Feed( processor );

      // -- Intercept method `destroy`

      feed._destroy = feed.destroy;

      feed.destroy = function() {
        delete this.feeds[ token ];
        this._destroy();
      };

      // --

      feed.configure( { url, autoReconnect: true } );

      if( !this.feeds[ token ] )
      {
        this.feeds[ token ] = feed;
      }
    }

    return feed;
  }

  // ---------------------------------------------------------------------------

  /* ------------------------------------------------------- Internal methods */

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

export default new LiveClientService();
