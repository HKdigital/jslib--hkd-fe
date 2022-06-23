
/* ------------------------------------------------------------------ Imports */

import {
  expectString,
  expectDefined,
  expectArray } from "@hkd-base/helpers/expect.js";

import { clone } from "@hkd-base/helpers/object.js";

/* ---------------------------------------------------------------- Internals */

const selectorTree$ = Symbol("selectorTree");

const dataByPathSelector$ = Symbol("dataBySelector");
const separator$ = Symbol("separator");

/* ------------------------------------------------------------------ Exports */

/**
 * The path matcher class can be used to match paths agains a set or routes.
 */
export default class PathMatcher
{
  constructor( separator="/" )
  {
    expectString( separator, "Missing or invalid parameter [separator]" );

    this[ selectorTree$ ] = {};
    this[ dataByPathSelector$ ] = {};

    //this[ selectorTree$ ] = {};

    this[ separator$ ] = separator;
  }

  /* --------------------------------------------------------- User methods */

  // ------------------------------------------------------------------ Method

  /**
   * Store a value and its path selector
   * - The path selector may contain '*', '**' or variables like ':myVar'
   *
   * @param {string} selector - Path selector
   *
   *   e.g. `/some/where` or `/other/space/**`
   *
   * @param {mixed} data - Data to associate with the selector
   */
  add( pathSelector, data )
  {
    expectString( pathSelector,
      'Invalid or missing parameter [pathSelector]' );

    expectDefined( data, 'Missing parameter [data]' );

    const pathSelectorArr = this._splitPath( pathSelector );

    pathSelector = pathSelectorArr.join( this[ separator$ ] );

    // -- Insert selector into the selector tree

    let currentNode = this[ selectorTree$ ];

    for( let j = 0, n = pathSelectorArr.length; j < n; j = j + 1 )
    {
      let key = pathSelectorArr[ j ];

      if( !currentNode[ key ] )
      {
        currentNode[ key ] = {};
      }

      if( -1 !== key.indexOf('**') && '**' !== key )
      {
        throw new Error(
          "Invalid parameter [pathSelector]. "+
          "[**] must be a separate part of the path. "+
          "e.g. [/some/**thing] is invalid.");
      }

      if( '**' === key && j < n - 1 )
      {
        throw new Error(
          "Invalid parameter [pathSelector]. "+
          "[**] should always be the last part of a path selector");
      }

      currentNode = currentNode[ key ];
    } // end for

    // console.log( "selectorTree", this[ selectorTree$ ]);

    // -- Add value to dataBySelector

    this[ dataByPathSelector$ ][ pathSelector ] = data;

    //console.log( "dataByPathSelector", this[ dataByPathSelector$ ]);
  }

  // ------------------------------------------------------------------ Method

  /**
   * Clear all selectors and associated values
   */
  clearAll()
  {
    this[ selectorTree$ ] = {};
    this[ dataByPathSelector$ ] = {};
  }

  // ------------------------------------------------------------------ Method

  /**
   * Find all selector / value pairs that match.
   * - Sorted in order of 'best match first'
   *
   * @param  {string} path - Query path
   * @return {array} matched results
   */
  matchOne( path )
  {
    expectString( path, 'Invalid or missing parameter [path]');

    const arrPath = this._splitPath(path);

    const match = this._findBestMatch( arrPath );

    if( !match )
    {
      return null;
    }

    const result =
      {
        selector: match.selector,
        params: match.params,
        data: match.data
      };

    // console.log('matchOne', arrPath, result);

    return result;
  }

  /* ----------------------------------------------------- Internal methods */

  /**
   * Returns the best match: the best selector and parameters used to make
   * the selector match the input path.
   *
   * @param  {string} arrPath - Query path as array
   *
   * @return {object|null}
   *   match object: { selector: <string>, params: <object> }
   */
  _findBestMatch( arrPath, _node, _selectorComponentsFound, _paramsFound )
  {
    expectArray( arrPath, 'Invalid or missing parameter [arrPath]' );

    arrPath = arrPath.slice(); // clone arrPath

    if( !_node )
    {
      _node = this[ selectorTree$ ];
    }

    if( !_selectorComponentsFound )
    {
      _selectorComponentsFound = [];
    }

    if( !_paramsFound )
    {
      _paramsFound = {};
    }

    const pathPart = arrPath.shift();
    let isLastPathPart = !arrPath.length;

    let selectorComponent;
    let nextNode;

    const selectorComponentsFoundOrg = _selectorComponentsFound.slice();
    const paramsFoundOrg = clone( _paramsFound );

    let selector;
    let data;

    /**
     * Helper function: restores work variables after a failed match using
     * recursion.
     */
    function restoreWorkVariables()
    {
      _selectorComponentsFound = selectorComponentsFoundOrg;
      _paramsFound = paramsFoundOrg;
    }

    let recurseResult;

    // console.log(
    //   "_findBestMatch: step ["+pathPart+"]"+
    //   " (isLastPathPart = " + isLastPathPart + ")" );

    // -- Step 1: Try exact match

    nextNode = _node[ pathPart ];

    if( nextNode )
    {
      selectorComponent = pathPart;

      _selectorComponentsFound.push(selectorComponent);

      if( isLastPathPart )
      {
        selector = _selectorComponentsFound.join( this[ separator$ ] );

        data = this[ dataByPathSelector$ ][ selector ];

        if( this[ dataByPathSelector$ ][ selector ] )
        {
          return {
            selector,
            params: _paramsFound,
            data
          };
        }
      }
      else {
        // recurse
        recurseResult =
          this._findBestMatch(
            arrPath,
            nextNode,
            _selectorComponentsFound, _paramsFound );

        if( recurseResult )
        {
          return recurseResult;
        }
        else {
          restoreWorkVariables();
        }
      }
    }

    // Step 2: Try `:myVar` match

    let key;

    nextNode = null;

    for( key in _node )
    {
      if( ":" === key.charAt(0) )
      {
        nextNode = _node[key];
        break;
      }
    }

    if( nextNode )
    {
      selectorComponent = key;

      _selectorComponentsFound.push(selectorComponent);

      _paramsFound[key.slice(1)] = pathPart;

      if( isLastPathPart )
      {
        selector = _selectorComponentsFound.join( this[ separator$ ] );
        data = this[ dataByPathSelector$ ][ selector ];

        if( this[ dataByPathSelector$ ][ selector ] )
        {
          return {
            selector,
            params: _paramsFound,
            data
          };
        }
      }
      else {
        // recurse
        recurseResult =
          this._findBestMatch(
            arrPath,
            nextNode,
            _selectorComponentsFound, _paramsFound );

        if( recurseResult )
        {
          return recurseResult;
        }
        else {
          restoreWorkVariables();
        }
      }
    }

    // 3. Try '*' match

    nextNode = _node['*'];

    if( nextNode )
    {
      selectorComponent = '*';

      _selectorComponentsFound.push(selectorComponent);

      if( isLastPathPart )
      {
        selector = _selectorComponentsFound.join( this[ separator$ ] );
        data = this[ dataByPathSelector$ ][ selector ];

        if( this[ dataByPathSelector$ ][ selector ] )
        {
          return {
            selector,
            params: _paramsFound,
            data
          };
        }
      }
      else {
        // recurse
        recurseResult =
          this._findBestMatch(
            arrPath,
            nextNode,
            _selectorComponentsFound, _paramsFound );

        if( recurseResult )
        {
          return recurseResult;
        }
        else {
          restoreWorkVariables();
        }
      }
    }

    // 4. Try '**' match

    nextNode = _node['**'];

    if( nextNode )
    {
      selectorComponent = '**';

      _selectorComponentsFound.push(selectorComponent);

      // A '**' match is always the last step
      selector = _selectorComponentsFound.join( this[ separator$ ] );
      data = this[ dataByPathSelector$ ][ selector ];

      if( this[ dataByPathSelector$ ][ selector ] )
      {
        return {
          selector,
          params: _paramsFound,
          data
        };
      }
    }

    return null;
  }

  // -------------------------------------------------------------------- Method

  /**
   * Split a (string) path into an array of path parts.
   * - The path is split at places where a slash / is found
   * - The root path "/" is returned as ["/"]
   * - Removes empty path parts
   *
   * @param {string} path - Path to split
   *
   * @returns {array} Path in array representation
   */
  _splitPath( path )
  {
    expectString( 'Invalid or missing parameter [path]' );

    const separator = this[ separator$ ];

    if( separator === path )
    {
      return [ path ];
    }

    const arrPath = path.split(separator);

    for( let j = arrPath.length; j >= 0; j = j - 1 )
    {
      if( "" === arrPath[j] )
      {
        // remove empty path part
        arrPath.splice(j, 1);
      }
    } // end for

    return arrPath;
  }

} // end class
