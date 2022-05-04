
/* ------------------------------------------------------------------ Imports */

import { DedupValueStore } from "@hkd-base/stores.js";

import {
  // backgroundPanelReady,
  // topPanelReady,
  // subTopPanelReady,
  contentPanelReady,
  /* bottomPanelReady */ } from "@hkd-fe/stores/layout.js";

import { defer } from '@hkd-base/process.js';

/* ------------------------------------------------------------------ Exports */

export const PRIO_HIGH = 100;
export const PRIO_NORMAL = 50;
export const PRIO_LOW = 20;

export const stage = new DedupValueStore( PRIO_HIGH );

let unsubscribeContentPanelReady;

stage.hasSubscribers.subscribe( ( hasSubscribers ) => {

  if( hasSubscribers )
  {
    if( !unsubscribeContentPanelReady )
    {
      unsubscribeContentPanelReady =
        contentPanelReady.subscribe( ( ready ) => {
          if( ready )
          {
            defer( () => { stage.set( PRIO_LOW ); } );
          }
        } );
    }
  }
  else if( unsubscribeContentPanelReady )
  {
    unsubscribeContentPanelReady();
  }
} );
