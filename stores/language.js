
/* ------------------------------------------------------------------ Imports */

import { expectString } from "$hk/expect.js";
import { ValueStore } from "$hk/stores.js";

/* ------------------------------------------------------------------ Exports */

export const currentLanguage = new ValueStore( "*" );

/**
 * Set the current language
 * - Suggestion: use ISO 639-1 language codes like 'en' or 'es'
 *
 * @param {string} languageCode
 */
export function setLanguage( languageCode )
{
  expectString( languageCode,
    "Missing or invalid parameter [languageCode]" );

  currentLanguage.set( languageCode );
}
