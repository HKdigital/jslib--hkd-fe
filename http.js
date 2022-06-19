
/* ------------------------------------------------------------------ Imports */

import { expectString,
         expectNotEmptyString,
         expectObject } from "@hkd-base/expect.js";

import { sessionId } from "@hkd-fe/stores/session.js";

import { getGlobalConfig } from "@hkd-base/global-config.js";

/* ------------------------------------------------------------------ Exports */

export const CONFIG_LABEL_DEFAULT_API = "default-api";
export const CONFIG_LABEL_SESSIONS_API = "sessions-api";
export const CONFIG_LABEL_LIVE_API = "live-api";

// -----------------------------------------------------------------------------

/**
 * Check if the response status is ok
 *
 * @param {object} response
 *
 * @throws {Error} not found
 * @throws {Error} internal server error
 */
export function expectValidHttpStatus( response, url )
{
  expectObject( url, "Missing or invalid parameter [response]" );

  if( !(url instanceof URL) )
  {
    throw new Error( "Missing or invalid parameter [url]" );
    // url = new URL( url );
  }

  switch( response.status )
  {
    case 404:
      throw new Error(
        `Server returned - 404 Not Found, [${decodeURI(url.href)}]`);

    case 500:
      throw new Error(
        `Server returned - 500 Internal server error, [${decodeURI(url.href)}]`);

    default: // -> ok
      break;
  }
}

// -----------------------------------------------------------------------------

/**
 * Build an URL object by using `origin` and `apiPrefix` from the specified
 * config and a custom `uri`.
 *
 * @param {string} uri - Custom uri part to append
 *
 * @param {string} [configLabel=CONFIG_LABEL_DEFAULT_API]
 *   Label of the global config entry to use
 *
 * @returns {object} URI object
 */
export function buildBackendUrl( uri, configLabel=CONFIG_LABEL_DEFAULT_API )
{
  expectNotEmptyString( configLabel,
    "Missing or invalid parameter [configLabel]");

  expectNotEmptyString( uri,
    "Missing or invalid parameter [uri]");

  const { origin, apiPrefix="" } = getGlobalConfig( configLabel );

  expectNotEmptyString( origin,
    `Missing property [origin] in global config [${configLabel}]` );

  expectString( apiPrefix,
    `Invalid property [apiPrefix] in global config [${configLabel}]` );

  return new URL( apiPrefix + uri, origin );
}

// -----------------------------------------------------------------------------

/**
 * Make GET request to backend
 * - Include [x-session-id] in header
 * - Expect JSON response from server
 *
 * @param {string|URL} url - Url string or URL object
 *
 * @param {object} [options]
 * @param {boolean} [options.includeSessionId=true]
 *
 * @returns {mixed} parsed JSON response from backend server
 */
export async function backendJsonGet( url, options )
{
  const response = await backendGet( url, { returnAbort: false, options } );

  expectValidHttpStatus( response, url );

  let parsedResponse;

  try {
    //
    // @note when security on the client side fails, an `opaque` response
    //       is returned by the browser (empty body) -> parsing fails
    //       (use CORS to fix this)
    //
    parsedResponse = await response.json();
  }
  catch( e )
  {
    // console.log( response );
    throw new Error(
      `Failed to JSON decode server response from [${decodeURI(url.href)}]`);
  }

  if( parsedResponse.error )
  {
    throw new Error( parsedResponse.error );
  }

  return parsedResponse;
}

// -----------------------------------------------------------------------------

/**
 * Make GET request to backend
 * - Include [x-session-id] in header
 *
 * @param {string|URL} url - Url string or URL object
 *
 * @param {object} [options]
 * @param {boolean} [options.includeSessionId=true]
 * @param {boolean} [options.returnAbort=true]
 *
 * @returns {object} if `options.returnAbort` was set to true,
 *   an object is returned that contains an abort function and a response
 *   promise: { abort: <function>, response: <Promise->*> }.
 *   if `options.returnAbort` was false, a response promise is returned
 */
export function backendGet( url, options={} )
{
  let includeSessionId;
  let returnAbort;

  ({ includeSessionId=true, returnAbort=true } = options);

  if( typeof url === "string" )
  {
    console.log( url );

    url = new URL( url );
  }
  else if( !(url instanceof URL) ) {
    throw new Error("Missing or invalid parameter [url]");
  }

  const headers = new Headers(
    [
      [ "accept", "application/json" ],
    ] );

  if( includeSessionId )
  {
    const _sessionId = sessionId.get();

    if( !_sessionId )
    {
      throw new Error(`Missing store value [sessionId]`);
    }

    headers.append( "x-session-id", _sessionId );
  }

  const init =
    {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'omit',
      redirect: 'follow',
      referrerPolicy: 'no-referrer',
      headers
    };

  // @see https://developer.mozilla.org/en-US/docs/Web/API/Request/Request
  // @see https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort

  const request = new Request( url, init );

  if( returnAbort )
  {
    const controller = new AbortController();
    const signal = controller.signal;

    const abort = controller.abort.bind( controller );

    return { abort, response: fetch( request, { signal } ) };
  }
  else {
    return /* async */ fetch( request );
  }
}

// -----------------------------------------------------------------------------

/**
 * Make a POST request to backend and send data from a `FormData` object,
 * which might include binary data.
 *
 * - Include [x-session-id] in header
 *
 * - Expect JSON response from server
 *
 * @param {string|URL} url - Url string or URL object
 *
 * @param {object} formData
 *
 * @param {object} [options={}]
 *
 * @returns {mixed} parsed JSON response from backend server
 */
export async function backendFormDataPost( url, formData, options )
{
  if( typeof url === "string" )
  {
    url = new URL( url );
  }
  else if( !(url instanceof URL) ) {
    throw new Error("Missing or invalid parameter [url]");
  }

  if( !(formData instanceof FormData) )
  {
    throw new Error("Missing or invalid parameter [FormData]");
  }

  const _sessionId = sessionId.get();

  if( !_sessionId )
  {
    throw new Error(`Missing store value [sessionId]`);
  }

  // @see https://developer.mozilla.org/en-US/docs/Web/API/Headers

  const headers = new Headers(
    [
      [ "accept", "application/json" ],
      // `content-type` is set by the browser (includes boundary info)
      // [ "content-type", "multipart/form-data" ],
      [ "x-session-id", _sessionId ]
    ] );

  // @see https://developer.mozilla.org/en-US/docs/Web/API/Request/Request

  // console.log( 123, Array.from( headers.entries() ) );

  const init = {
    method: 'POST',
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'omit',
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    headers,
    body: formData
  };

  const request = new Request( url, init );

  const response = await fetch( request );

  expectValidHttpStatus( response, url );

  let parsedResponse;

  try {
    //
    // @note when security on the client side fails, an `opaque` response
    //       is returned by the browser (empty body) -> parsing fails
    //       (use CORS to fix this)
    //
    parsedResponse = await response.json();
  }
  catch( e )
  {
    throw new Error(
      `Failed to JSON decode server response from [${decodeURI(url.href)}]`);
  }

  if( parsedResponse.error )
  {
    throw new Error( parsedResponse.error );
  }

  return parsedResponse;
}

// -----------------------------------------------------------------------------

/**
 * Make a POST request to backend
 * - Include [x-session-id] in header
 * - Send JSON encoded body
 * - Expect JSON response from server
 *
 * @param {string|URL} url - Url string or URL object
 *
 * @param {*} body
 *
 * @returns {mixed} parsed JSON response from backend server
 */
export async function backendJsonPost( url, body=null )
{
  if( typeof url === "string" )
  {
    url = new URL( url );
  }
  else if( !(url instanceof URL) ) {
    throw new Error("Missing or invalid parameter [url]");
  }

  const _sessionId = sessionId.get();

  if( !_sessionId )
  {
    throw new Error(`Missing store value [sessionId]`);
  }

  // @see https://developer.mozilla.org/en-US/docs/Web/API/Headers

  const headers = new Headers(
    [
      [ "accept", "application/json" ],
      [ "content-type", "application/json" ],
      [ "x-session-id", _sessionId ]
    ] );

  // @see https://developer.mozilla.org/en-US/docs/Web/API/Request/Request

  // console.log( 123, Array.from( headers.entries() ) );

  const init = {
    method: 'POST',
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'omit',
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    headers,
    body: JSON.stringify( body )
  };

  const request = new Request( url, init );

  const response = await fetch( request );

  expectValidHttpStatus( response, url );

  let parsedResponse;

  try {
    //
    // @note when security on the client side fails, an `opaque` response
    //       is returned by the browser (empty body) -> parsing fails
    //       (use CORS to fix this)
    //
    parsedResponse = await response.json();
  }
  catch( e )
  {
    throw new Error(
      `Failed to JSON decode server response from [${decodeURI(url.href)}]`);
  }

  if( parsedResponse.error )
  {
    throw new Error( parsedResponse.error );
  }

  return parsedResponse;
}
