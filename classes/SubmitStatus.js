
/* ------------------------------------------------------------------ Imports */

import { expectError } from '@hkd-base/helpers/expect.js';

import ValueStore from '@hkd-base/classes/ValueStore.js';

/* ------------------------------------------------------------------ Exports */

export const SUBMIT_IDLE = 'submit-idle';
export const SUBMIT_IN_PROGRESS = 'submit-in-progress';
export const SUBMIT_OK = 'submit-ok';
export const SUBMIT_ERROR = 'submit-error';

/* ------------------------------------------------------------- Export class */

export default class SubmitStatus extends ValueStore
{
  /**
   * Construct a new instance
   */
  constructor()
  {
    super( SUBMIT_IDLE );

    this.lastErrorMessage = new ValueStore( null );
  }

  /* --------------------------------------------------------- Public methods */

  /**
   * Set the submit status to `SUBMIT_IDLE`
   */
  setIdle()
  {
    this.lastErrorMessage.set( null );
    this.set( SUBMIT_IDLE );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Set the submit status to `SUBMIT_IN_PROGRESS`
   */
  setInProgress()
  {
    this.lastErrorMessage.set( null );
    this.set( SUBMIT_IN_PROGRESS );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Set the submit status to `SUBMIT_OK`
   */
  setOk()
  {
    this.lastErrorMessage.set( null );

    this.set( SUBMIT_OK );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Set the submit status to `SUBMIT_ERROR`
   *
   * @param {Error} error
   */
  setError( error )
  {
    expectError( error, 'Missing or invalid parameter [error]' );

    this.lastErrorMessage.set( error.message );

    this.set( SUBMIT_ERROR );
  }

} // end class
