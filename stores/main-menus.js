
/* ------------------------------------------------------------------ Imports */

import MenuTree from "$hk-fe/classes/MenuTree.js";

import { readable } from "svelte/store";

let _setMenuTree;

/**
 * Set the main menu tree
 *
 * @param {object} Main menu tree
 */
export function setMainMenus( mainMenus )
{
  if( !_setMenuTree )
  {
    // init
    menuTree.subscribe( () => {} )();
  }

  const tree = new MenuTree( mainMenus );

  _setMenuTree( tree );
}

/* -------------------------------------------------------- Store [mainMenus] */

// Store that contains the main menu tree

export let menuTree = readable( null, ( set ) =>
  {
    _setMenuTree = set;
  } );

/* ------------------------------------------------------------------ Exports */

export default { setMainMenus, menuTree };
