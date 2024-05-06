
/**
 * Load a javascript file
 *
 * @param {string} url - Location of the javascript file to load
 *
 * @returns {boolean} true if the file has been loaded
 */
export /*async*/ function loadJavaScript( url )
{
  if( typeof url !== 'string' )
  {
    throw new Error('Missing or invalid parameter [url]');
  }

  if( !loadJavaScript._promises )
  {
    loadJavaScript._promises = {};
  }

  const scriptLoadingPromises = loadJavaScript._promises;

  const existingPromise = scriptLoadingPromises[ url ];

  if( existingPromise )
  {
    return existingPromise;
  }

  console.log(`Load javascript [${url}]`);

  let resolve;
  let reject;

  const promise =
    scriptLoadingPromises[ url ] =
      new Promise( ( _resolve, _reject ) =>
        {
          resolve = _resolve;
          reject = _reject;
        } );

  const domElement = document.createElement('script');
  domElement.type = 'module';
  domElement.src = url;

  domElement.onload = resolve.bind( null, true );

  domElement.onerror = ( /* e */ ) =>
    {
      delete scriptLoadingPromises[ url ];
      document.documentElement.removeChild( domElement );

      reject( new Error(`Failed to load [${url}]` ) );
    };

  document.documentElement.appendChild( domElement );

  return promise;
}