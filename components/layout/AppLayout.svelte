<script context="module">

/* ------------------------------------------------------------------ Imports */

import { DedupValueStore } from "@hkd-base/stores.js";

import { defer } from '@hkd-base/process.js';

/* ------------------------------------------------------------------ Exports */

//
// `ready` stores can be used to mark panels as `ready to show to the user`
//

export const backgroundPanelReady = new DedupValueStore( false );
export const topPanelReady = new DedupValueStore( false );
export const subTopPanelReady = new DedupValueStore( false );
export const contentPanelReady = new DedupValueStore( false );
export const bottomPanelReady = new DedupValueStore( false );

export const overlayPanelReady = new DedupValueStore( false );

/**
 * Mark background panel as ready for showing to the user
 */
export function markBackgroundPanelReady()
{
  // @note using defer, otherwise fade in effect does not trigger
  defer( () => { backgroundPanelReady.set( true ); } );
}

/**
 * Mark top panel as ready for showing to the user
 */
export function markTopPanelReady()
{
  // @note using defer, otherwise fade in effect does not trigger
  defer( () => { topPanelReady.set( true ); } );
}

/**
 * Mark sub top panel as ready for showing to the user
 */
export function markSubTopPanelReady()
{
  // @note using defer, otherwise fade in effect does not trigger
  defer( () => { subTopPanelReady.set( true ); } );
}

/**
 * Mark content panel as ready for showing to the user
 */
export function markContentPanelReady()
{
  // @note using defer, otherwise fade in effect does not trigger
  defer( () => { contentPanelReady.set( true ); } );
}

/**
 * Mark bottom panel as ready for showing to the user
 */
export function markBottomPanelReady()
{
  // @note using defer, otherwise fade in effect does not trigger
  defer( () => { bottomPanelReady.set( true ); } );
}

/**
 * Mark overlay panel as ready for showing to the user
 */
export function markOverlayPanelReady()
{
  // @note using defer, otherwise fade in effect does not trigger
  defer( () => { overlayPanelReady.set( true ); } );
}

</script>

<!-- ======================================================================= -->

<script>
  /* ---------------------------------------------------------------- Imports */

  import { expectString,
           expectPositiveNumber } from "@hkd-base/expect.js";

  import { expectValidSurfaceColor } from "@hkd-fe/helpers/colors.js";

  import { equals } from "@hkd-base/compare.js";

  import Panel from "@hkd-fe/components/layout/Panel.svelte";

  // import PleaseRotateScreen
  //   from "$src/views/special-panels/PleaseRotateScreen.svelte";

  import { routeStateAccessStore } from "@hkd-fe/stores/router.js";

  // import { isLandscapeOnMobile }
  //   from "$skills-fe/stores/screen-orientation.js";

  // import { debug } from "@hkd-base/log.js";

  // import { SURFACE_COLOR_DEFAULT } from "@hkd-fe/helpers/colors.js";

  /* -------------------------------------------------------------- Internals */

  const SURFACE_COLOR_DEFAULT = "surface1"; // To have a sane value

  let bgPanelParams;
  let topPanelParams;
  let subTopPanelParams;
  let contentPanelParams;
  let bottomPanelParams;
  let overlayPanelParams;

  let layoutParams;
  let layoutBackgroundColor;

  let currentRouteReady = true;

  let currentRoute;
  let currentState;
  let currentAccess;

  let readyTimeoutMs = 500;
  let layoutAspect = 0;

  let layoutBackgroundClass = "";

  let bgPanelBackgroundClass = "";
  let topPanelBackgroundClass = "";
  let subTopPanelBackgroundClass = "";
  let contentPanelBackgroundClass = "";
  let bottomPanelBackgroundClass = "";
  let overlayPanelBackgroundClass = "";

  let onColorLayout = SURFACE_COLOR_DEFAULT;

  let onColorBgPanel = SURFACE_COLOR_DEFAULT;
  let onColorTopPanel = SURFACE_COLOR_DEFAULT;
  let onColorSubTopPanel = SURFACE_COLOR_DEFAULT;
  let onColorContentPanel = SURFACE_COLOR_DEFAULT;
  let onColorBottomPanel = SURFACE_COLOR_DEFAULT;
  let onColorOverlayPanel = SURFACE_COLOR_DEFAULT;

  let layoutCssClassNames = "";

  let bgPanelCssClassNames = "";
  let topPanelCssClassNames = "";
  let subTopPanelCssClassNames = "";
  let contentPanelCssClassNames = "";
  let bottomPanelCssClassNames = "";
  let overlayPanelCssClassNames = "";

  let currentPath = null;

  let contentPanelElement;

  let panelWidth;
  let heightStyle = "";

  let contentPanelOuterElem;

  let topPanelHeight = -1;
  let bottomPanelHeight = -1;

  /* ---------------------------------------------------------------- Exports */

  let cssClassNames = "";
  export { cssClassNames as class };

  export let onColor = SURFACE_COLOR_DEFAULT;

  $: {
    // Use property `onColor` as default onColor for layout and panel elements

    expectValidSurfaceColor( onColor );

    if( !onColorLayout ) {
        onColorLayout = onColor;
    }

    if( !onColorBgPanel ) {
      onColorBgPanel = onColor;
    }

    if( !onColorTopPanel ) {
      onColorTopPanel = onColor;
    }

    if( !onColorSubTopPanel ) {
      onColorSubTopPanel = onColor;
    }

    if( !onColorContentPanel ) {
      onColorContentPanel = onColor;
    }

    if( !onColorBottomPanel ) {
      onColorBottomPanel = onColor;
    }

    if( !onColorOverlayPanel ) {
      onColorOverlayPanel = onColor;
    }
  }

  /* ------------------------------------------------------------------ Logic */

  $: {
    // Respond to state and route changes:
    // - Update properties `currentRoute`, `currentState` and `currentAccess`
    //   independently
    // - Set `currentRouteReady` to false on route change
    //
    const { route, state, access } = $routeStateAccessStore;

    //
    // The routeStateAccessStore updates if any of the three properties
    // is updated.
    // - The internal properties `currentRoute`, `currentState` and
    //   `currentAccess` are only updated by the logic below if the properties
    //   really changed.
    //

    if( !equals( currentRoute, route ) )
    {
      currentRoute = route;
      currentRouteReady = false;
    }

    if( !equals( currentState, state ) )
    {
      currentState = state;
    }

    if( !equals( currentAccess, access ) )
    {
      currentAccess = access;
    }
  }

  // ---------------------------------------------------------------------------

  $: {
    // Process layout parameters [readyTimeoutMs]

    if( layoutParams && ("readyTimeoutMs" in layoutParams ) )
    {
      readyTimeoutMs = layoutParams.readyTimeoutMs;

      expectPositiveNumber( readyTimeoutMs,
        "Invalid value for layout parameter [readyTimeoutMs]" );
    }
  }

  // ---------------------------------------------------------------------------

  $: {
    // Process layout parameter [aspect]

    if( layoutParams && ("aspect" in layoutParams ) )
    {
      layoutAspect = layoutParams.aspect; // e.g. 16 / 9

      expectPositiveNumber( layoutAspect,
        "Invalid value for layout parameter [aspect]" );
    }
    else if( layoutAspect )
    {
      layoutAspect = 0;
    }
  }

  // ---------------------------------------------------------------------------

  $: {
    // Set properties `{background,top,subTop,content,bottom}PanelReady`
    // - to false on route change
    // - to true on timeout

    if( currentRoute )
    {
      if( !currentRouteReady )
      {
        const pathOnStart = currentRoute.path;
        // console.log("Route change started", pathOnStart);

        backgroundPanelReady.set( false );
        topPanelReady.set( false );
        subTopPanelReady.set( false );
        contentPanelReady.set( false );
        bottomPanelReady.set( false );
        overlayPanelReady.set( false );

        setTimeout( () => {
          if( currentRoute.path === pathOnStart && !currentRouteReady )
          {
            currentRouteReady = true;
          }
        }, readyTimeoutMs );
      }
      else  {
        // console.log("Route change ready", currentRoute.path);

        backgroundPanelReady.set( true );
        topPanelReady.set( true );
        subTopPanelReady.set( true );
        contentPanelReady.set( true );
        bottomPanelReady.set( true );
        overlayPanelReady.set( true );
      }
    }
  }

  // ---------------------------------------------------------------------------

  $: {
    // - Set properties `{bg,top,subTop,content,bottom}PanelParams`
    //   on route change
    // - Set property `layoutParams` on route change
    // - Set property `layoutBackgroundColor` on route change
    //

    const currentRoutePanels = currentRoute.panels;

    if( currentRoutePanels )
    {
      bgPanelParams = currentRoutePanels.backgroundPanel;
      topPanelParams = currentRoutePanels.topPanel;
      subTopPanelParams = currentRoutePanels.subTopPanel;
      contentPanelParams = currentRoutePanels.contentPanel;
      bottomPanelParams = currentRoutePanels.bottomPanel;
      overlayPanelParams = currentRoutePanels.overlayPanel;
    }
    else {
      bgPanelParams = null;
      topPanelParams = null;
      subTopPanelParams = null;
      contentPanelParams = null;
      bottomPanelParams = null;
      overlayPanelParams = null;
    }

    const currentRouteLayout = currentRoute.layout;

    if( currentRouteLayout )
    {
      layoutParams = currentRouteLayout;
      layoutBackgroundColor = currentRouteLayout.backgroundColor;
    }
    else {
      layoutParams = null;
      layoutBackgroundColor = null;
    }

    if( layoutBackgroundColor )
    {
      expectString( layoutBackgroundColor,
        "Invalid value for app background color");

      // console.log(`Set layout background [${layoutBackgroundColor}]`);

      document.documentElement.style
        .setProperty(
          "background-color",
          `var(--color-${layoutBackgroundColor})` );
    }
    else {
      document.documentElement.style
        .setProperty( "background-color", "transparent" );
    }
  }

  // ---------------------------------------------------------------------------

  $: {
    // If property `layoutParams` changes:
    // - Set properties `onColorLayout` and `layoutBackgroundClass`

    if( layoutParams )
    {
      if( layoutParams.backgroundColor )
      {
        layoutBackgroundClass =
          `g-bgcolor-${layoutParams.backgroundColor}`;

        onColorLayout = layoutParams.backgroundColor;
      }
      else if( layoutParams.onColor )
      {
        layoutBackgroundClass = "";
        onColorLayout = layoutParams.onColor;
      }
      else {
        layoutBackgroundClass = "";
      }
    }

    if( !onColorLayout )
    {
      onColorLayout = onColor;
    }

    // console.log("layout:layout", { layoutParams, onColorLayout, layoutBackgroundClass } );
  }

  // ---------------------------------------------------------------------------

  $: {
    // If property `bgPanelParams` changes:
    // - Set properties `onColorBgPanel` and `bgPanelBackgroundClass`

    if( bgPanelParams )
    {
      if( bgPanelParams.backgroundColor )
      {
        bgPanelBackgroundClass =
          `g-bgcolor-${bgPanelParams.backgroundColor}`;

        onColorBgPanel = bgPanelParams.backgroundColor;
      }
      else if( bgPanelParams.onColor )
      {
        bgPanelBackgroundClass = "";
        onColorBgPanel = bgPanelParams.onColor;
      }
      else {
        bgPanelBackgroundClass = "";
      }
    }

    if( !onColorBgPanel )
    {
      onColorBgPanel = onColor;
    }

    // console.log("layout:bgPanel", { bgPanelParams, onColorBgPanel, bgPanelBackgroundClass } );
  }

  // ---------------------------------------------------------------------------

  $: {
    // If property `topPanelParams` changes:
    // - Set properties `onColorTopPanel` and `topPanelBackgroundClass`

    if( topPanelParams )
    {
      if( topPanelParams.backgroundColor )
      {
        topPanelBackgroundClass =
          `g-bgcolor-${topPanelParams.backgroundColor}`;

        onColorTopPanel = topPanelParams.backgroundColor;
      }
      else if( topPanelParams.onColor )
      {
        topPanelBackgroundClass = "";
        onColorTopPanel = topPanelParams.onColor;
      }
      else {
        topPanelBackgroundClass = "";
      }
    }

    if( !onColorTopPanel )
    {
      onColorTopPanel = onColor;
    }

    // console.log("layout:topPanel", { topPanelParams, onColorTopPanel, topPanelBackgroundClass } );
  }

  // ---------------------------------------------------------------------------

  $: {
    // If property `subTopPanelParams` changes:
    // - Set properties `onColorSubTopPanel` and `subTopPanelBackgroundClass`

    if( subTopPanelParams )
    {
      if( subTopPanelParams.backgroundColor )
      {
        subTopPanelBackgroundClass =
          `g-bgcolor-${subTopPanelParams.backgroundColor}`;

        onColorSubTopPanel = subTopPanelParams.backgroundColor;
      }
      else if( subTopPanelParams.onColor )
      {
        subTopPanelBackgroundClass = "";
        onColorSubTopPanel = subTopPanelParams.onColor;
      }
      else {
        subTopPanelBackgroundClass = "";
      }
    }

    if( !onColorSubTopPanel )
    {
      onColorSubTopPanel = onColor;
    }

    // console.log("layout:subTopPanel", { subTopPanelParams, onColorSubTopPanel, subTopPanelBackgroundClass } );
  }

  // ---------------------------------------------------------------------------

  $: {
    // If property `contentPanelParams` changes:
    // - Set properties `onColorContentPanel` and `contentPanelBackgroundClass`

    if( contentPanelParams )
    {
      if( contentPanelParams.backgroundColor )
      {
        contentPanelBackgroundClass =
          `g-bgcolor-${contentPanelParams.backgroundColor}`;

        onColorContentPanel = contentPanelParams.backgroundColor;
      }
      else if( contentPanelParams.onColor )
      {
        contentPanelBackgroundClass = "";
        onColorContentPanel = contentPanelParams.onColor;
      }
      else {
        contentPanelBackgroundClass = "";
      }
    }

    if( !onColorContentPanel )
    {
      onColorContentPanel = onColor;
    }

    // console.log("layout:contentPanel", { contentPanelParams, onColorContentPanel, contentPanelBackgroundClass } );
  }

  // ---------------------------------------------------------------------------

  $: {
    // If property `bottomPanelParams` changes:
    // - Set properties `onColorBottomPanel` and `bottomPanelBackgroundClass`

    if( bottomPanelParams )
    {
      if( bottomPanelParams.backgroundColor )
      {
        bottomPanelBackgroundClass =
          `g-bgcolor-${bottomPanelParams.backgroundColor}`;

        onColorBottomPanel = bottomPanelParams.backgroundColor;
      }
      else if( bottomPanelParams.onColor )
      {
        bottomPanelBackgroundClass = "";
        onColorBottomPanel = bottomPanelParams.onColor;
      }
      else {
        bottomPanelBackgroundClass = "";
      }
    }

    if( !onColorBottomPanel )
    {
      onColorBottomPanel = onColor;
    }
  }

  // ---------------------------------------------------------------------------

  $: {
    // If property `overlayPanelParams` changes:
    // - Set properties `onColorOverlayPanel` and `overlayPanelBackgroundClass`

    if( overlayPanelParams )
    {
      console.warn("Support for overlay panel is experimental (scroll issues)");

      if( overlayPanelParams.backgroundColor )
      {
        overlayPanelBackgroundClass =
          `g-bgcolor-${overlayPanelParams.backgroundColor}`;

        onColorOverlayPanel = overlayPanelParams.backgroundColor;
      }
      else if( overlayPanelParams.onColor )
      {
        overlayPanelBackgroundClass = "";
        onColorOverlayPanel = overlayPanelParams.onColor;
      }
      else {
        overlayPanelBackgroundClass = "";
      }
    }

    if( !onColorOverlayPanel )
    {
      onColorOverlayPanel = onColor;
    }
  }

  // ---------------------------------------------------------------------------

  $: {
    // If property `layoutParams` changes:
    // - Set property `layoutCssClassNames`

    if( layoutParams && layoutParams.classNames )
    {
      layoutCssClassNames = layoutParams.classNames;
    }
    else {
      layoutCssClassNames = "";
    }
  }

  // ---------------------------------------------------------------------------

  $: {
    if( bgPanelParams && bgPanelParams.classNames )
    {
      bgPanelCssClassNames = bgPanelParams.classNames;
    }
    else {
      bgPanelCssClassNames = "";
    }
  }

  // ---------------------------------------------------------------------------

  $: {
    if( topPanelParams && topPanelParams.classNames )
    {
      topPanelCssClassNames = topPanelParams.classNames;
    }
    else {
      topPanelCssClassNames = "";
    }
  }

  // ---------------------------------------------------------------------------

  $: {
    if( subTopPanelParams && subTopPanelParams.classNames )
    {
      subTopPanelCssClassNames = subTopPanelParams.classNames;
    }
    else {
      subTopPanelCssClassNames = "";
    }
  }

  // ---------------------------------------------------------------------------

  $: {
    if( contentPanelParams && contentPanelParams.classNames )
    {
      contentPanelCssClassNames = contentPanelParams.classNames;
    }
    else {
      contentPanelCssClassNames = "";
    }
  }

  // ---------------------------------------------------------------------------

  $: {
    if( bottomPanelParams && bottomPanelParams.classNames )
    {
      bottomPanelCssClassNames = bottomPanelParams.classNames;
    }
    else {
      bottomPanelCssClassNames = "";
    }
  }

  // ---------------------------------------------------------------------------

  $: {
    if( overlayPanelParams && overlayPanelParams.classNames )
    {
      overlayPanelCssClassNames = overlayPanelParams.classNames;
    }
    else {
      overlayPanelCssClassNames = "";
    }
  }

  // ---------------------------------------------------------------------------

  $: {
    // - Scroll content panel to top on [state.path] change

    if( contentPanelElement )
    {
      const currentState = $routeStateAccessStore.state;

      if( currentPath !== currentState.path )
      {
        currentPath = currentState.path;

        contentPanelElement.scrollTop = 0;
      }
    }
  }

  // ---------------------------------------------------------------------------

  $: {
    // - FIXME: apply aspect to layout element (e.g. for fixed size displays)

    if( layoutAspect )
    {
      heightStyle = `height: ${panelWidth / layoutAspect}px`;
      // console.log( "CHECK", panelWidth, panelHeight );
    }
    else {
      heightStyle = "";
    }
  }

// -----------------------------------------------------------------------------

$: {
  // If topPanel is present:
  // - Adjust contentPanel padding top

  if( contentPanelOuterElem )
  {
    if( topPanelParams && topPanelHeight !== -1 )
    {
      contentPanelOuterElem.style.paddingTop = `${topPanelHeight}px`;
    }
    else {
      contentPanelOuterElem.style.paddingTop = "";
    }
  }
}

// -----------------------------------------------------------------------------

$: {
  // If bottomPanel is present:
  // - Adjust contentPanel padding bottom

  if( contentPanelOuterElem )
  {
    if( bottomPanelParams && bottomPanelHeight !== -1 )
    {
      contentPanelOuterElem.style.paddingBottom = `${bottomPanelHeight}px`;
    }
    else {
      contentPanelOuterElem.style.paddingBottom = "";
    }
  }
}

</script>

<!-- {#if !$isLandscapeOnMobile} -->

  <div class="c-app-layout {cssClassNames}">

    {#if bgPanelParams && onColorBgPanel}
      <div class="layout-grid-background">
        <div class:x-ready={$backgroundPanelReady}
             class="cc-panel-background
                    g-color {bgPanelBackgroundClass}
                    {bgPanelCssClassNames}">

          <Panel component={bgPanelParams.component}
                 onColor={onColorBgPanel}
                 on:message />

        </div>
      </div>
    {/if}

    <div class="layout-grid-main">
      {#if topPanelParams || subTopPanelParams}
        <div class="cc-top-subtop-box" bind:clientHeight={topPanelHeight}>
          {#if topPanelParams && onColorTopPanel}
            <div class:x-ready={$topPanelReady}
                 class="cc-panel-top
                        g-color {topPanelBackgroundClass}
                        {topPanelCssClassNames}">
              <Panel component={topPanelParams.component}
                     onColor={onColorTopPanel}
                     on:message />
            </div>
          {/if}

          {#if subTopPanelParams && onColorSubTopPanel}
            <div class:x-ready={$subTopPanelReady}
                 class="cc-panel-sub-top
                        g-color {subTopPanelBackgroundClass}
                        {subTopPanelCssClassNames}">
              <Panel component={subTopPanelParams.component}
                     onColor={onColorSubTopPanel}
                     on:message />
            </div>
          {/if}
        </div>
      {/if}

      {#if contentPanelParams && onColorContentPanel}
        <div class="content-panel-outer" bind:this={contentPanelOuterElem}>
          <div bind:this={contentPanelElement}
               class:x-ready={$contentPanelReady}
               class="cc-panel-content
                      g-color {contentPanelBackgroundClass}
                      {contentPanelCssClassNames}">

            <Panel component={contentPanelParams.component}
                   onColor={onColorContentPanel}
                  on:message />

          </div>
        </div>
      {/if}

      {#if bottomPanelParams && onColorBottomPanel}
        <div class:x-ready={$bottomPanelReady}
             class="cc-panel-bottom
                    g-color {bottomPanelBackgroundClass}
                    {bottomPanelCssClassNames}">
          <Panel component={bottomPanelParams.component}
                 onColor={onColorBottomPanel}
                 on:message />
        </div>
      {/if}

    </div> <!-- end layout-grid-main -->

    {#if overlayPanelParams && onColorOverlayPanel}
      <div class="layout-grid-overlay">
        <div class:x-ready={$overlayPanelReady}
             class="cc-panel-overlay
                    g-color {overlayPanelBackgroundClass}
                    {overlayPanelCssClassNames}">

          <Panel component={overlayPanelParams.component}
                 onColor={onColorBgPanel}
                 on:message />

        </div>
      </div>
    {/if}

  </div> <!-- end c-app-layout -->

<!-- {:else}
  <PleaseRotateScreen on:message/>
{/if} -->

<!-- <div class="fullscreen" bind:this={fullScreenElem}>Fullscreen</div> -->

<!-- <div class="fullscreen-element">
  Fullscreen element
  <div class="bottomPanel2">Footer2</div>
</div> -->

<style>
  :global(.c-app-layout)
  {
    display: grid;
    grid-template-columns: 1fr; /* 1fr=greedy */

    width: 100%;
  }

  .layout-grid-background
  {
    /*background-color: blue;*/
    grid-area: 1 / 1 / 2 / 2; /* row-start, col-start, row-end, col-end */
    z-index: 10;
  }

  .layout-grid-main
  {
    /*background-color: red;*/
    grid-area: 1 / 1 / 2 / 2; /* row-start, col-start, row-end, col-end */
    z-index: 20;
  }

  .layout-grid-overlay
  {
    /*background-color: blue;*/
    grid-area: 1 / 1 / 2 / 2; /* row-start, col-start, row-end, col-end */
    z-index: 30;
    /*pointer-events: none;*/
  }

  :global(.c-app-layout .cc-panel-background)
  {
    width: 100%;
    height: 100%;
  }

  :global(.c-app-layout .cc-top-subtop-box)
  {
    z-index: 40;

    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
  }

  :global(.c-app-layout .cc-panel-content)
  {
    z-index: 30;

    margin: 0;
    padding: 0;

    width: 100%;
    /*margin: 0 auto;*/
    /*padding: 0 1.2rem;*/
    /*background-color:  green;*/
  }

  :global(.c-app-layout .cc-panel-bottom)
  {
    z-index: 40;

    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    /*background-color: yellow;
    border-top: 2px dashed green;*/

    transition: top 0.2s ease-out 0s;
  }

  :global(.c-app-layout .cc-panel-overlay)
  {
    width: 100%;
    height: 100%;
    /*pointer-events: none;*/
  }

  /*:global(.cc-panel-overlay > div )
  {
    pointer-events: auto;
  }*/

  :global(.c-app-layout.x-click-through-overlay .layout-grid-overlay)
  {
    pointer-events: none;
  }

  :global(.c-app-layout.x-click-through-overlay .cc-panel-overlay)
  {
    pointer-events: none;
  }

  /*:global(.c-app-layout.x-click-through-overlay .cc-panel-overlay > div )
  {
    pointer-events: auto;
  }*/

</style>
