
  // /**
  //  * Start orientation detection
  //  */
  // async _startDeviceOrientationDetection()
  // {
  //   const query = "(orientation: portrait)";

  //   const mq = new MediaQuery( query );

  //   this[ offs$ ].orientation =
  //     mq.listen( ( MediaQueryListEvent ) =>
  //       {
  //         if( MediaQueryListEvent.matches )
  //         {
  //           document.body.classList.add("portrait");
  //           document.body.classList.remove("landscape");

  //           this.device.isPortrait = true;
  //           this.device.isLandscape = false;

  //           this.publish( "device-info-updated", null );
  //         }
  //         else {
  //           document.body.classList.remove("portrait");
  //           document.body.classList.add("landscape");

  //           this.device.isPortrait = false;
  //           this.device.isLandscape = true;

  //           this.publish( "device-info-updated", null );
  //         }
  //       } );
  // }

  // /**
  //  * Start detection of sub pixels
  //  */
  // async _startSubPixelDensityDetection()
  // {
  //   const query = "(-webkit-min-device-pixel-ratio: 2)";

  //   const mq = new MediaQuery( query );

  //   this[ offs$ ].subPixelDetection =
  //     mq.listen( ( MediaQueryListEvent ) =>
  //       {
  //         if( MediaQueryListEvent.matches )
  //         {
  //           document.body.classList.add("subpixel-dense");
  //           document.body.classList.remove("subpixel-sparse");
  //           this.device.isSubpixelDense = true;

  //           this.publish( "device-info-updated", null );
  //         }
  //         else {
  //           document.body.classList.remove("subpixel-dense");
  //           document.body.classList.add("subpixels");

  //           this.device.isSubpixelDense = false;

  //           this.publish( "device-info-updated", null );
  //         }
  //       } );
  // }

  const offs$ = Symbol("offs$");

  export default class MediaQuery
  {
    /**
     * Construct a media query instance
     * - Can be used to match the window against media queries
     *
     * @param {string} query
     *   Media query string, e.g. "(orientation: portrait)"
     */
    constructor( query )
    {
      // Get Media Query List
      this._mql = window.matchMedia( query );

      this[ offs$ ] = new Set();
    }

    // ------------------------------------------------------------------ Method

    /**
     * Check if the document currently matches the media query
     *
     * @returns {boolean} true if the media query matches
     */
    queryDoesMatch()
    {
      return this._mql.matches;
    }

    // ------------------------------------------------------------------ Method

    /**
     * Register a function that will be called if the media query match
     * result changes
     *
     * @param {function} fn
     *
     * @returns {function} unregister funciton
     */
    listen( fn )
    {
      const mql = this._mql;

      // Run listener for the first time upon registration
      fn( mql );

      // Add listener
      mql.addListener( fn );

      const unsubscribeFn = () => {
        mql.removeListener( fn );
      };

      this[ offs$ ].add( unsubscribeFn );

      return unsubscribeFn;
    }

    // ------------------------------------------------------------------ Method

    /**
     * Unsubscribe all listeners
     */
    unsubscribeAll()
    {
      for( const unsubscribeFn in this[ offs$ ] )
      {
        unsubscribeFn();
      }
    }
  }