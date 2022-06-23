
/* ------------------------------------------------------------------ Imports */

import { expectArray } from "@hkd-base/helpers/expect.js";

import log from "@hkd-base/helpers/log.js";

/* ---------------------------------------------------------------- Internals */

/* ------------------------------------------------------------------ Exports */

/**
 * Get a program stack(trace) for the current execution point
 * - If a source map is available, the stack will be converted using the
 *   source map
 *
 * @param {number} [skipFirst=3]
 *   Number of entries to skip from the beginning of the returned stack
 *
 * @param {number} [skipLast=1]
 *   Number of entries to skip from the end of the returned stack
 *
 * @returns {object[]} stack(trace)
 */
export function getStack( skipFirst=3, skipLast=0 )
{
  let orig = Error.prepareStackTrace;

  Error.prepareStackTrace = function( _, stack )
    {
      return stack;
    };

  let err = new Error();

  // Error.captureStackTrace( err );

  return err.stack;
}

/**
 * Print the stack(trace) (write to the console)
 *
 * @param {object[]} stack
 */
export function printStack( stack )
{
  for( let j = 0, n = stack.length; j < n; j = j + 1 )
  {
    const CallSite = stack[j];

    log.debug(
      {
        index: j,
        fileName: CallSite.getFileName(),
        lineNumber: CallSite.getLineNumber(),
        functionName: CallSite.getFunctionName()
      } );
  }
}
