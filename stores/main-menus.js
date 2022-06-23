
/* ------------------------------------------------------------------ Imports */

import MenuTree from "@hkd-fe/classes/MenuTree.js";

import ValueStore from "@hkd-base/classes/ValueStore.js";

/* ---------------------------------------------------------------- Internals */

/* ------------------------------------------------------------------ Exports */

//
// Store instance that contains the main menu tree
//
export let menuTree = new ValueStore();

// -----------------------------------------------------------------------------

/**
 * Configure the main menu tree
 * - Sets exported variable `menuTree`
 *
 * @param {object} Main menu tree
 */
export function configureMainMenus( mainMenus )
{
  const treeData = new MenuTree( mainMenus );

  menuTree.set( treeData );
}
