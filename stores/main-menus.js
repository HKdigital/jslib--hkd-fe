
/* ------------------------------------------------------------------ Imports */

import MenuTree from "@hkd-fe/classes/MenuTree.js";

import { readable } from "svelte/store";

/* ---------------------------------------------------------------- Internals */

let setMenuTree_;

/* ------------------------------------------------------------------ Exports */

/**
 * Configure the main menu tree
 *
 * @param {object} Main menu tree
 */
export function configureMainMenus( mainMenus )
{
  if( !setMenuTree_ )
  {
    // init
    menuTree.subscribe( () => {} )();
  }

  const tree = new MenuTree( mainMenus );

  setMenuTree_( tree );
}

/* -------------------------------------------------------- Store [mainMenus] */

// Store instance that contains the main menu tree

export let menuTree = readable( null, ( set ) =>
  {
    setMenuTree_ = set;
  } );
