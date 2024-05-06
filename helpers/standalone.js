
/* ------------------------------------------------------------------ Imports */

/* ------------------------------------------------------------------ Exports */

export const browserInStandaloneMode =
  ('standalone' in window.navigator) ?
    (window.navigator.standalone === true) :
    (window.matchMedia('(display-mode: standalone)').matches);