
/* ------------------------------------------------------------------ Imports */

import { expectString, expectArray, expectObject } from "@hkd-base/helpers/expect.js";

/* ------------------------------------------------------------------ Exports */

export default class MenuTree
{
  // -------------------------------------------------------------------- Method

  /**
   * Construct a new menu tree
   *
   * @param {object} menusBylabel
   *   Object that contains all main menus, specified by label
   *
   * e.g. menusBylabel =
   *  {
   *    main: { title: ..., items: ... },
   *    someSubMenu: { title: ..., items: ... }
   *  }
   *
   */
  constructor( menusBylabel )
  {
    this._menusBylabel = {};
    this._parentLabelsBySubMenuLabels = {};

    this._configureMenus( menusBylabel );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Get the specified main menu
   *
   * @param {string} label
   *
   * @returns {object|null} - Menu object or null if not found
   */
  getMenu( label )
  {
    expectString( label, "Missing or invalid parameter [label]" );

    return this._menusBylabel[ label ] || null;
  }

  // -------------------------------------------------------------------- Method

  /**
   * Check menus and set in private property [this._menusBylabel]
   *
   * @param {object} menusBylabel
   */
  _configureMenus( menusBylabel )
  {
    expectObject( menusBylabel,
      "Missing or invalid parameter [menusBylabel]" );

    if( !("main" in menusBylabel) )
    {
      throw new Error( "Missing or invalid menu item [menusBylabel.main]" );
    }

    for( const menuLabel in menusBylabel )
    {
      const menu = menusBylabel[ menuLabel ];

      this._checkMenu( menu, menuLabel );

      // console.log("define menu", menuLabel);

      this._menusBylabel[ menuLabel ] = menu;
    }

    // -- Add property [parentMenuLabel] to sub menus

    const parentLabelsBySubMenuLabels = this._parentLabelsBySubMenuLabels;

    for( const subMenuLabel in parentLabelsBySubMenuLabels )
    {
      const parentMenuLabel = parentLabelsBySubMenuLabels[ subMenuLabel ];

      if( !this._menusBylabel[ subMenuLabel ] )
      {
        throw new Error(
          `Sub menu [${subMenuLabel}] was not found ` +
          `(linked from menu [${parentMenuLabel}]).`);
      }

      this._menusBylabel[ subMenuLabel ].parentMenuLabel = parentMenuLabel;
    }
  }

  // -------------------------------------------------------------------- Method

  /**
   * Check if a menu object is valid
   *
   * @param {object} menu
   * @param {string} menuLabel
   */
  _checkMenu( menu, menuLabel )
  {
    // console.log("_checkMenu", menuLabel);

    // -- Check menu properties

    expectObject( menu, "Missing or invalid parameter [menu]" );

    expectString( menuLabel,
      "Missing or invalid parameter [menuLabel]" );

    // Add [label] to menu
    menu.label = menuLabel;

    const { title, icon, items } = menu;

    expectString( title,
      `Missing or invalid property [title] in menu [${menuLabel}]` );

    if( icon )
    {
      expectString( icon,
        `Invalid property [title] in menu [${menuLabel}]` );
    }

    expectArray( items,
      `Invalid property [items] in menu [${menuLabel}]` );

    //-- Loop over menu items

    for( const menuItem of items )
    {
      const { title, icon, routeTo, subMenuLabel } = menuItem;

      expectString( title,
        `Missing or invalid property [title] ` +
        `in menu item of menu [${menuLabel}]` );

      if( icon )
      {
        expectString( icon,
          `Invalid property [icon] in menu item ` +
          `[${title}] of menu [${menuLabel}]` );
      }

      if( routeTo )
      {
        expectString( routeTo,
          `Invalid property [routeTo] in menu item ` +
          `[${title}] of menu [${menuLabel}]` );
      }

      if( subMenuLabel )
      {
        expectString( subMenuLabel,
          `Invalid property [subMenuLabel] in menu item ` +
          `[${title}] of menu [${menuLabel}]` );

        // Remember from which menu the subMenu has been linked

        if( this._parentLabelsBySubMenuLabels[ subMenuLabel ] )
        {
          throw new Error(
            `Invalid value for property [subMenuLabel] in menu item ` +
           `[${title}] of menu [${menuLabel}]. A sub menu label may ` +
           `only be used once`);
        }

        this._parentLabelsBySubMenuLabels[ subMenuLabel ] = menuLabel;
      }
    } // end for
  }
} // end class