
/* ------------------------------------------------------------------ Imports */

import { expectNotEmptyString,
         expectPositiveNumber,
         expectArray,
         expectObject } from '@hkd-base/helpers/expect.js';

import { equals } from '@hkd-base/helpers/compare.js';

import LogBase from '@hkd-base/classes/LogBase.js';

/* ---------------------------------------------------------------- Internals */

const DEFAULT_STORAGE_LABEL = 'history';
const DEFAULT_MAX_HISTORY_LENGTH = 15;

/* ------------------------------------------------------------------ Exports */

export default class HistoryStorage extends LogBase
{
  browserHistory = window.history;
  // storage;
  // storageLabel;
  // maxHistoryLength;

  /**
   * Construct a new HistoryStorage instance
   *
   * @param {string} [_.storageLabel=DEFAULT_STORAGE_LABEL]
   * @param {number} [_.maxHistoryLength=15]
   * @param {object} [_.storage=window.sessionStorage]
   */
  constructor(
    {
      storageLabel=DEFAULT_STORAGE_LABEL,
      maxHistoryLength=DEFAULT_MAX_HISTORY_LENGTH,
      storage=window.sessionStorage
    }={} )
  {
    super();

    expectNotEmptyString( storageLabel,
      'Invalid parameter [storageLabel]' );

    expectPositiveNumber( maxHistoryLength,
      'Invalid parameter [maxHistoryLength]' );

    expectObject( storage,
      'Invalid parameter [storage]' );

    if( typeof storage.getItem !== 'function' )
    {
      throw new Error( 'Invalid storage. [storage.getItem] is not a function');
    }

    if( typeof storage.setItem !== 'function' )
    {
      throw new Error( 'Invalid storage. [storage.setItem] is not a function');
    }

    this.storage = storage;
    this.storageLabel = storageLabel;
    this.maxHistoryLength = maxHistoryLength;
  }

  // -------------------------------------------------------------------- Method

  /**
   * Get the latest item from the history
   *
   * @returns {object} latest history item
   */
  getLatest()
  {
    const history = this._getHistoryFromStorage();

    if( !history.length )
    {
      return null;
    }

    return history[ history.length - 1 ];
  }

  // -------------------------------------------------------------------- Method

  /**
   * Check if there is a `previous` history item
   *
   * @returns {boolean} true if a previous history item exists
   */
  canGoBack()
  {
    const history = this._getHistoryFromStorage();

    if( history.length < 2 )
    {
      return false;
    }

    return true;
  }

  // -------------------------------------------------------------------- Method

  /**
   * Get and remove the current history item from the history
   * - If only one or no history items exist, this method will do nothing and
   *   return null
   *
   * @returns {object|null} the current history item or null if not found
   */
  tryGoBack()
  {
    const history = this._getHistoryFromStorage();

    if( history.length > 1 )
    {
      history.pop();

      const newState = history[ history.length - 1 ];

      // TODO: call listeners???

      this._setHistoryInStorage( history );

      return newState;
    }

    return null;
  }

  // -------------------------------------------------------------------- Method

  /**
   * Push a new item to the history
   *
   * @param {object} newItem
   * @param {boolean} [expectDifferentItem=true]
   *
   * @returns {object} newItem
   */
  push( newItem, expectDifferentItem=true )
  {
    expectObject( newItem, 'Missing or invalid parameter [newItem]' );

    let history = this._getHistoryFromStorage();

    if( expectDifferentItem && history.length )
    {
      //
      // Make sure the new item differs from the current latest item
      //
      const lastItem = history[ history.length - 1 ];

      if( equals( newItem, lastItem ) )
      {
        throw new Error(
          'Cannot push new item to history (same as current latest item)');
      }
    }

    //
    // TODO: parse newItem?
    //

    history = this._limitHistorySize( history, this.maxHistoryLength - 1 );

    history.push( newItem );

    this._setHistoryInStorage( history );

    return newItem;
  }

  // -------------------------------------------------------------------- Method

  /**
   * Replace the latest history item with the new item
   *
   * @param {object} newItem
   *
   * @returns {object} newItem
   */
  replace( newItem )
  {
    expectObject( newItem, 'Missing or invalid parameter [newItem]' );

    const history = this._getHistoryFromStorage();

    // this.log.debug("HistoryStorage.replace", newItem);
    // this.log.debug("HistoryStorage.replace (before)", newItem, history);

    if( history.length )
    {
      history.pop();
    }

    history.push( newItem );

    // this.log.debug("HistoryStorage.replace (after)", newItem, history);

    this._setHistoryInStorage( history );

    return newItem;
  }

  // -------------------------------------------------------------------- Method

  /**
   * Remove all items from history
   */
  clear()
  {
    this._setHistoryInStorage( [] );
  }

  /* ------------------------------------------------------- Internal methods */

  /**
   * Get the state history from the storage
   * - Returns an empty array if no history data was found
   *
   * @returns {object[]} history
   */
  _getHistoryFromStorage()
  {
    const { storage,
            storageLabel } = this;

    const historyJson = storage.getItem( storageLabel );

    let history;

    if( historyJson )
    {
      try {
        history = JSON.parse( historyJson );

        expectArray( history, 'Invalid history in storage' );

        history = this._limitHistorySize( history );
      }
      catch( e )
      {
        this.log.warning('Clearing invalid history data in storage');
        this.clear();

        return [];
      }
    }

    return history || [];
  }

  // -------------------------------------------------------------------- Method

  /**
   * Set history in the storage
   *
   * @param {object[]} history
   */
  _setHistoryInStorage( history )
  {
    expectArray( history, 'Missing or invvalid parameter [history]' );

    // TODO: more checks?

    const { storage,
            storageLabel } = this;

    const historyJson = JSON.stringify( history );

    storage.setItem( storageLabel, historyJson );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Limit the history size
   *
   * @param {object[]} history
   * @param {number} maxSize
   *
   * @returns {object[]} history with a maximum number of items
   */
  _limitHistorySize( history, maxSize )
  {
    expectArray( history, 'Missing or invvalid parameter [history]' );

    if( undefined !== maxSize )
    {
      expectPositiveNumber( maxSize, 'Invalid parameter [maxSize]' );
    }
    else {
      maxSize = this.maxHistoryLength;
    }

    if( history.length > maxSize )
    {
      history = history.slice( -maxSize );
    }

    return history;
  }


} // end class
