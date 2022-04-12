
/* ------------------------------------------------------------------ Imports */

import { expectString, expectNumber, expectFunction } from "$hk/expect.js";

import { ValueStore } from "$hk/stores.js";

/* ---------------------------------------------------------------- Internals */

const processor$ = Symbol("processor");

const url$ = Symbol("url");

const data$ = Symbol("data");

const eventSource$ = Symbol("eventSource");

const connect$ = Symbol("connect");
const disconnect$ = Symbol("disconnect");

const autoReconnect$ = Symbol("autoReconnect");

/* ------------------------------------------------------------------ Exports */

export default class Feed
{
  // -------------------------------------------------------------------- Method

  /**
   * Construct a Feed instance
   * - Connects to a server
   * - Receives an event data stream from the server
   * - Outputs events via the store `feed.data`
   *
   * @param {function} processor
   *   This processor function receives a single argument `eventOrError`,
   *   the context `this` is set to the `this` context of the feed instance
   *
   *   The value returned by  the processor is set in the store `feed.data`
   */
  constructor( processor )
  {
    expectFunction( processor, "Missing or invalid parameter [processor]" );

    this[ processor$ ] = ( eventOrError ) => {

      if( !(eventOrError instanceof Error) &&
           "error" === eventOrError.type)
      {
        // console.log( eventOrError );

        eventOrError = new Error(
          `Received event of type [error] from [${this[ url$ ]}]`);
      }

      const value = processor.call( this, eventOrError );

      if( value === undefined )
      {
        throw new Error("Processor function should not return [undefined]");
      }

      this[ data$ ].set( value );
    };

    this[ url$ ] = null;
    this[ eventSource$ ] = null;

    const store =
      this[ data$ ] = new ValueStore( null );

    store.hasSubscribers.subscribe( ( hasSubscribers ) =>
    {
      if( !hasSubscribers )
      {
        // - No subscribers

        // console.log("DEBUG: No feed subscribers");

        this[ disconnect$ ]();
        return;
      }

      // - There are subscribers, connect if an url has been set

      // console.log("DEBUG: First feed subscriber");

      if( this[ url$ ] )
      {
        this[ connect$ ]();
      }

    } );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Get latest feed item
   *
   * @returns {object|null} latest feed item
   */
  get()
  {
    return this[ data$ ].get();
  }

  // -------------------------------------------------------------------- Method

  /**
   * Subscribe to feed
   * -
   *
   * @param {function} callback - Function that will receive feed updates
   *
   * @returns {function} unsubscribe function
   */
  subscribe( /* callback */ )
  {
    return this[ data$ ].subscribe( ...arguments );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Configure
   *
   * @param {string|null} url
   */
  configure( { url, autoReconnect=false } )
  {
    //console.log( `Feed: configure [${url}]` );

    this[ autoReconnect$ ] = autoReconnect;

    if( url )
    {
      expectString( url, "Missing or invalid parameter [url]" );
    }

    if( !url )
    {
      // console.log("Feed: configure: clear url");

      this[ url$ ] = null;

      this.disconnectAndSetNull();
      return;
    }

    if( this[ url$ ] && url !== this[ url$ ] )
    {
      // console.log(
      //   "Feed: configure: url changed",
      //   {
      //     oldUrl: this[ url$ ],
      //     newUrl: url
      //   } );

      // Url changed
      this.disconnectAndSetNull();
    }

    if( this[ eventSource$ ] )
    {
      throw new Error(
        "Property [eventSource] already defined (this should not happen)");
    }

    this[ url$ ] = url;

    if( true === this[ data$ ].hasSubscribers.get() )
    {
      // Subscribers and no event source -> not connected -> connect

      this[ connect$ ]();
    }
  }

  // -------------------------------------------------------------------- Method

  /**
   * Reconnect, e.g. after an error
   *
   * @param {number} [delay=5000]
   *   Number of milliseconds to wait before connecting again
   */
  reconnect( delay=5000 )
  {
    console.log(`reconnect [${delay}]`);

    expectNumber( delay, "Invalid parameter [delay]" );

    this[ disconnect$ ]();
    setTimeout( () => {
      this[ connect$ ]();
    },
    delay );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Disconnect from server
   */
  disconnectAndSetNull()
  {
    // console.log( `Feed: disconnect and set null` );

    this[ disconnect$ ]();

    this[ data$ ].set( null );
  }

  // -------------------------------------------------------------------- Method

  [ disconnect$ ]()
  {
    if( this[ eventSource$ ] )
    {
      // console.log( `Feed: disconnect` );

      // throw new Error("FIXME: disconnect gets called while it shouldn't");

      this[ eventSource$ ].close();
      this[ eventSource$ ] = null;
    }
  }

  // -------------------------------------------------------------------- Method

  /**
   * Create a new EventSource instance
   */
  [ connect$ ]()
  {
    // console.log( `Feed: connect` );

    //
    // Not needed to set data to null:
    //   - disconnect sets value null
    //   - event source will return a value soon
    //
    // this[ data$ ].set( null );
    //

    if( this[ eventSource$ ] )
    {
      throw new Error("Property [eventSource$] should be null");
    }

    this[ eventSource$ ] = new EventSource( this[ url$ ] );

    this[ eventSource$ ].addEventListener( "message", this[ processor$ ] );

    this[ eventSource$ ].addEventListener( "error", ( e ) => {
      this[ processor$ ]( e );

      if( this[ autoReconnect$ ] )
      {
        this.reconnect();
      }
    } );

    // this[ eventSource$ ].addEventListener( "error", () =>
    //   {
    //     this[ disconnect$ ]();
    //     setTimeout( () => { this[ connect$ ](); }, 5000 );
    //   } );
  }

}
