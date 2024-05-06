/**
 * Watching elem's size changes. If something
 * is changed, calling callback function.
 * Returns unsubscribe method (watch stopper).
 *
 * MODERN: via ResizeObserver
 * LEGACY: via requestAnimationFrame
 *
 * @param elem
 * @param callback
 * @returns {unsubscribe}
 */
export function createObserver(elem, callback) {
  const trueObserverSupported = typeof window.ResizeObserver !== 'undefined';
  let unsubscribe;

  if( trueObserverSupported )
  {
    const ro = new ResizeObserver( (entries) => {

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for( const _ of entries )
      {
        callback();
      }
    });

    ro.observe(elem);

    unsubscribe = () => {
      ro.unobserve(elem);
      ro.disconnect();
    };
  }
  else {
    let lastHeight = null;
    let frameRequester;

    const getElemOffsetHeight = () =>
    {
      const height = elem.offsetHeight;

      if( lastHeight !== null && lastHeight !== height )
      {
        callback();
      }

      lastHeight = height;
      frameRequester = requestAnimationFrame( getElemOffsetHeight );
    };

    frameRequester = requestAnimationFrame( getElemOffsetHeight );

    unsubscribe = () => {
      cancelAnimationFrame( frameRequester );
    };
  }

  return unsubscribe;
}
