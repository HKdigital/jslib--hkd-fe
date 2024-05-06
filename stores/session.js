/**
 * This file contains code for working with sessions on the frontend.
 *
 * How it works:
 *
 * A local session id will be generated, so no server roundtrip is needed.
 *
 * There are multiple ways to authenticate a session (login), e.g.
 *
 * tryLoginConfirmByEmail() - The server sends an email to confirm to login
 * tryLoginUsingAccessCode() - Using an access code available on the frontend
 *
 * sessionData
 * -----------
 * The state of the session can be followed by subscribing to the
 * store `sessionData`.
 *
 * e.g. sessionData.subscribe( ( sessionDataValue ) => { ... } )
 *
 * SessionData store values can be the following values:
 *
 *   null - No session data available yet
 *
 *   <object> {} - (empty object) server has no session data assigned to the
 *                 supplied sessionId
 *
 *   <object>
 *   {
 *     username: <string>,    - Unique username
 *     groups: <Set>,         - e.g. { "jedi's", "registered" }
 *     confirmed: <boolean>,  - true if the session has been confirmed (e.g.
 *                              the user clicked on a link in a confirmation mail)
 *     isGuest: <boolean>,    - true if the session is anonymous (no username)
 *     suspended: <boolean>   - true if the user account has been suspended
 *   }
 *
 * - The store sessionData is actually a `Feed` instance, which connects and
 *   disconnects automatically, depending on if there are subscribers.
 *   So to use the `sessionData` store with a connection to the backend server,
 *   there should be at least one subscriber.
 *
 * live
 * ----
 * Additionally a store is exported called `live`. This store value is set to
 * true as soon as the first response has been received from the server and set
 * to false again when the (HTTP2) connection is disconnected
 */

/* ------------------------------------------------------------------ Imports */

import { expectString } from '@hkd-base/helpers/expect.js';

import { randomStringBase58 } from '@hkd-base/helpers/unique.js';

import { getGlobalConfig } from '@hkd-base/helpers/global-config.js';

import Feed from '@hkd-fe/classes/Feed.js';

import DedupValueStore from '@hkd-base/classes/DedupValueStore.js';
import DerivedStore from '@hkd-base/classes/DerivedStore.js';

import { onLoad, onBeforeUnload } from '@hkd-fe/helpers/browser-events.js';

import { backendJsonGet } from '@hkd-fe/helpers/http.js';

/* ------------------------------------------------------------- First export */

export const authenticationBusy = new DedupValueStore( false );

/* ---------------------------------------------------------------- Internals */

const offs = {};

onBeforeUnload( offs );

const CONFIG_LABEL = 'session-backend';

const AUTH_REQUEST_PATH = '/session/request';

/**
 * Get the url that can be used to request session authentication
 *
 * @param {object} params
 * @param {string} [params.username]
 * @param {string} [params.accessCode]
 *
 * @returns {URL} url
 */
function getRequestAuthenticationUrl( { username, accessCode } )
{
  const { origin, apiPrefix='' } = getGlobalConfig( CONFIG_LABEL );

  expectString( origin,
    `Missing or invalid config [${CONFIG_LABEL}].origin` );

  expectString( apiPrefix,
    `Missing or invalid config [${CONFIG_LABEL}].apiPrefix` );

  const url = new URL( apiPrefix + AUTH_REQUEST_PATH, origin);

  if( username )
  {
    url.searchParams.append( 'username', JSON.stringify( username ) );
  }
  else if( accessCode )
  {
    url.searchParams.append( 'ac', JSON.stringify( accessCode ) );
  }
  else {
    throw new Error('Missing parameter [username] or [accessCode]');
  }

  return url; // .toString();
}

// ---------------------------------------------------------------------- Method

/**
 * Get the url that can be used to get session feed data
 *
 * @returns {string} url
 */
function getFeedUrl()
{
  const csid = getClientSessionId();

  const { origin, apiPrefix='' } = getGlobalConfig( CONFIG_LABEL, {} );

  return `${origin}${apiPrefix}/session/feed?csid=${csid}`;
}

/* ------------------------------------------------ Session data feed handler */

export const live = new DedupValueStore( false );

/**
 * Session feed data processor
 *
 * @param {object|Error} eventOrError
 *
 * @returns {object} sessionData
 */
function processor( eventOrError )
{
  // debug( "session.js: processor", eventOrError );

  if( eventOrError instanceof Error )
  {
    // throw new Error("UPS - TODO [eventOrError] is an error");
    // console.log( eventOrError );

    live.set( false );
    authenticationBusy.set( false );

    return null;
  }

  live.set( true );

  if( !event.data )
  {
    console.log( 'event.data is empty', event );
    return null; // Clear session data
  }

  let eventData;

  try {
    eventData = JSON.parse( event.data );
  }
  catch( e )
  {
    console.log( 'event.data', event.data );
    throw new Error( 'Failed to parse [event.data]', { cause: e } );
  }

  if( !eventData )
  {
    return null; // Clear session data
  }

  if( eventData.ping )
  {
    console.log('Received ping', eventData);
    return;
  }

   // e.g. {
  //   "_key": "qoEbiXqWGQ1vwLzAcMqFYZf8r211WRNP4SFpG6RGMnT2ZL2V",
  //   "_id": "Session/qoEbiXqWGQ1vwLzAcMqFYZf8r211WRNP4SFpG6RGMnT2ZL2V",
  //   "_rev": "_cGybRPC---",
  //   "confirmed": true,
  //   "confirmedAt": 1617275210988,
  //   "userAccountKey": "258404"
  // }

  const result = { ...eventData };

  // if( "userAccountKey" in eventData )
  if( 'username' in eventData )
  // if( eventData.groups && eventData.groups.length )
  {
    result.isGuest = false;
  }
  else {
    result.isGuest = true;
  }

  result.groups = new Set( eventData.groups );

  // console.log("**** Got sessionData", result);

  return result;
}

const sessionDataFeed = new Feed( processor );

onLoad( () => {
  const config = getGlobalConfig( CONFIG_LABEL, null );

  if( config )
  {
    const autoReconnect = config.autoReconnect || false;

    sessionDataFeed.configure( { url: getFeedUrl(), autoReconnect } );
  }
  else {
    console.log(`Skip setup session. Missing config [${CONFIG_LABEL}]`);
  }
} );

/* ------------------------------------------------------------------ Exports */

/**
 * Get an existing client session id from local storage or generate a new one
 *
 * @param {boolean} [autoGenerate=true] - Generate a new id if missing
 *
 * @returns {string} client session id
 */
export function getClientSessionId( autoGenerate=true )
{
  // let csid = null;
  let csid = localStorage.getItem( 'session/csid' );

  if( !csid )
  {
    if( !autoGenerate )
    {
      return null;
    }

    const CSID_LENGTH = 48;

    csid = randomStringBase58( CSID_LENGTH );

    localStorage.setItem( 'session/csid', csid );
  }

  return csid;
}

// ---------------------------------------------------------------------- Method

/**
 * Try login using `confirm by email` authentication
 *
 * @param {string} username
 */
export async function tryLoginConfirmByEmail( username )
{
  expectString( username, 'Missing or invalid parameter [username]' );

  const url = getRequestAuthenticationUrl( { username } );

  const data = await backendJsonGet( url );

  // const response = await fetch( url );

  // const text = await response.text();

  // // console.log( { text } );

  // const data = JSON.parse( text );

  if( !data.ok )
  {
    throw new Error(`Request [${url}] failed. Server did not respond [{ok:1}]`);
  }
}

// ---------------------------------------------------------------------- Method

/**
 * Try login using `access code` authentication
 * - Uses session id
 *
 * @param {string} accessCode
 *
 * @returns {object} response
 * e.g. authenticated: reponse = { ok : 1 }
 * e.g. invalid access code: response = { error: invalidUserCode }
 */
export async function tryLoginUsingAccessCode( accessCode )
{
  expectString( accessCode, 'Missing or invalid parameter [accessCode]' );

  const url = getRequestAuthenticationUrl( { accessCode } );

  authenticationBusy.set( true );

  const response = await backendJsonGet( url );

// console.log("tryLoginUsingAccessCode:response", response);

  authenticationBusy.set( false );

  if( response.error && response.error.invalidAccessCode )
  {
    const error = Error('Invalid access code');
    error.invalidAccessCode = true;

    throw error;
  }

  return response;
}

// ---------------------------------------------------------------------- Method

/**
 * Logout
 * - Clear session id
 * - Generate new session id
 * - Reconnect session stream
 */
export async function logout()
{
  console.log('logout');

  // Remove client session id from local storage
  localStorage.removeItem( 'session/csid' );

  // Create new session id in local storage
  getClientSessionId();

  // Reconnect using new session id
  sessionDataFeed.configure( { url: getFeedUrl() } );
}

const sessionDataExport =
  {
    get: sessionDataFeed.get.bind( sessionDataFeed ),
    subscribe: sessionDataFeed.subscribe.bind( sessionDataFeed )
  };

export const sessionId
  = new DerivedStore( [ sessionDataExport ], ( /* stores */ ) =>
    {
      return getClientSessionId();
    } );

export const sessionConfirmed
  = new DerivedStore( [ sessionDataExport ], ( /* stores */ ) =>
    {
      const sessionData = sessionDataExport.get();

      if( sessionData && sessionData.confirmed )
      {
        return true;
      }

      return false;
    } );

export { sessionDataExport as sessionData };

// poll test: prevent event source timeout -> does not work

// let pollEnabled = false;

// async function poll()
// {
//   if( pollEnabled )
//   {
//     const origin = getGlobalConfig( CONFIG_LABEL ).origin;

//     expectString( origin,
//       `Missing or invalid config [${CONFIG_LABEL}].origin` );

//     const url = new URL( "/system/now", origin);

//     const response = await backendJsonGet( url );

//     console.log("poll", response);
//   }
//   setTimeout( poll, 5000 );
// }

// offs.poll =
//   sessionDataFeed.subscribe( ( sessionData ) => {
//     if( sessionData )
//     {
//       pollEnabled = true;
//     }
//     else {
//       pollEnabled = false;
//     }
//   } );

//  poll();

/* --------------------------------------------- Hot Module Replacement (dev) */

if( import.meta.hot )
{
  import.meta.hot.accept( () => {
    // Force page reload
    import.meta.hot.invalidate();
  } );
}