
export const looksLikeMobileDevice =
    ( ("orientation" in window) && navigator.maxTouchPoints > 0 );
     /* && window.screenX !== 0 */
