<script>
  /**
   * Example data
   *
   * layout: {
   *     component: AppLayout
   *   },
   *
   *   panels:
   *   {
   *     backgroundPanel: {
   *       backgroundColor: SURFACE_DARK_BLUE
   *     },
   *
   *     topPanel: {
   *       component: TopPanelWithLogo,
   *       classNames: "g-something-special"
   *    },
   *
   *     contentPanel: {
   *       component: ContentPanelHome,
   *       backgroundColor: SURFACE_DARK_BLUE
   *     }
   *
   *     // bottomPanel: {
   *     //   component: BottomPanel,
   *     //   backgroundColor: SURFACE_DARK
   *     // }
   *   }
   */

  /* ---------------------------------------------------------------- Imports */

  import { defer } from '@hkd-base/process.js';

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

  import { backgroundPanelReady,
           topPanelReady,
           subTopPanelReady,
           contentPanelReady,
           bottomPanelReady,
           overlayPanelReady } from "./AppLayout.js";

  /* -------------------------------------------------------------- Internals */

  //
  // Disable automatic scroll restauration by browser when navigating back
  //
  history.scrollRestoration = 'manual';

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

  let layoutBackgroundClassNames = "";

  let bgPanelBackgroundClassNames = "";
  let topPanelBackgroundClassNames = "";
  let subTopPanelBackgroundClassNames = "";
  let contentPanelBackgroundClassNames = "";
  let bottomPanelBackgroundClassNames = "";
  let overlayPanelBackgroundClassNames = "";

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

  let contentPanelElement;

  // let panelWidth;
  // let heightStyle = "";

  let contentPanelOuterElem;

  let topPanelHeight = -1;
  let bottomPanelHeight = -1;

  const documentElement = document.documentElement;

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

  //
  // Restore or reset scroll on navigation change
  //
  // FIXME: somehow $contentPanelReady is not triggered by SVELTE, using
  //        manual subscribe and unsubscribe as workaround
  //
  // {
  //   let unsubscribeFn;

  //   let currentPath = null;

  //   onMount( () => {
  //     unsubscribeFn =
  //       contentPanelReady
  //         .subscribe( ( ready ) => {
  //           if( ready )
  //           {
  //             if( currentPath !== currentState.path )
  //             {
  //               // console.log("RESTORE SCROLL", currentState);

  //               if( "documentScrollTop" in currentState  )
  //               {
  //                 defer( () => {
  //                   documentElement.scrollTop = currentState.documentScrollTop; } );
  //               }
  //               else {
  //                 documentElement.scrollTop = 0;
  //               }

  //               currentPath = currentState.path;
  //             }
  //           }
  //         } );
  //   } );

  //   onDestroy( () => {
  //     unsubscribeFn();
  //   } );
  // }

  $: {
    if( currentRouteReady )
    {
      document.documentElement.scrollTop = 0;

      // FIXME: Restore scroll does not work well

      // if( "documentScrollTop" in currentState )
      // {
      //   defer( () => {
      //     document.documentElement.scrollTop = currentState.documentScrollTop; } );
      // }
      // else {
      //   document.documentElement.scrollTop = 0;
      // }
    }
  }

  // ---------------------------------------------------------------------------

  let pathOnStart; // Path on start navigation change

  $: {
    // Set properties `{background,top,subTop,content,bottom}PanelReady`
    // - to false on route change
    // - to true on timeout

    if( currentRoute )
    {
      if( !currentRouteReady )
      {
        pathOnStart = currentRoute.path;
        // console.log("Route change started", pathOnStart);

        backgroundPanelReady.set( false );
        topPanelReady.set( false );
        subTopPanelReady.set( false );
        contentPanelReady.set( false );

        // console.log("JENS1", $contentPanelReady );

        bottomPanelReady.set( false );
        overlayPanelReady.set( false );

        setTimeout( () => {
          if( currentRoute.path === pathOnStart && !currentRouteReady )
          {
            currentRouteReady = true;
          }
        }, readyTimeoutMs );
      }
      else if( currentRoute.path === pathOnStart )
      {
        // console.log("Route change ready", currentRoute.path);

        backgroundPanelReady.set( true );
        topPanelReady.set( true );
        subTopPanelReady.set( true );

        contentPanelReady.set( true );

        // console.log("JENS2", $contentPanelReady );

        bottomPanelReady.set( true );
        overlayPanelReady.set( true );
      }
    }
  }

  // ---------------------------------------------------------------------------

  let previousCurrentRoutePanels = null;

  $: {
    // - Set properties `{bg,top,subTop,content,bottom}PanelParams`
    //   on route change
    // - Set property `layoutParams` on route change
    // - Set property `layoutBackgroundColor` on route change
    //

    const currentRoutePanels = currentRoute.panels;

    if( currentRoutePanels !== previousCurrentRoutePanels )
    {
      // FIXME: workaround to prevent setting params two times
      // FIXME: seems not to work. e.g. topPanelParams changes still
      //        get triggered twice

      if( currentRoutePanels )
      {
        previousCurrentRoutePanels = currentRoutePanels;

        // console.log( { currentRoutePanels } );

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

      documentElement.style
        .setProperty(
          "background-color",
          `var(--color-${layoutBackgroundColor})` );
    }
    else {
      documentElement.style
        .setProperty( "background-color", "transparent" );
    }
  }

  // ---------------------------------------------------------------------------

  $: {
    // If property `layoutParams` changes:
    // - Set properties `onColorLayout` and `layoutBackgroundClassNames`

    if( layoutParams )
    {
      if( layoutParams.backgroundColor )
      {
        layoutBackgroundClassNames =
          `g-color gx-bgcolor-${layoutParams.backgroundColor}`;

        onColorLayout = layoutParams.backgroundColor;
      }
      else if( layoutParams.onColor )
      {
        layoutBackgroundClassNames = "";
        onColorLayout = layoutParams.onColor;
      }
      else {
        layoutBackgroundClassNames = "";
      }
    }

    if( !onColorLayout )
    {
      onColorLayout = onColor;
    }

    // console.log("layout:layout", { layoutParams, onColorLayout, layoutBackgroundClassNames } );
  }

  // ---------------------------------------------------------------------------

  $: {
    // If property `bgPanelParams` changes:
    // - Set properties `onColorBgPanel` and `bgPanelBackgroundClassNames`

    if( bgPanelParams )
    {
      if( bgPanelParams.backgroundColor )
      {
        bgPanelBackgroundClassNames =
          `g-color gx-bgcolor-${bgPanelParams.backgroundColor}`;

        onColorBgPanel = bgPanelParams.backgroundColor;
      }
      else if( bgPanelParams.onColor )
      {
        bgPanelBackgroundClassNames = "";
        onColorBgPanel = bgPanelParams.onColor;
      }
      else {
        bgPanelBackgroundClassNames = "";
      }
    }

    if( !onColorBgPanel )
    {
      onColorBgPanel = onColor;
    }

    // console.log("layout:bgPanel", { bgPanelParams, onColorBgPanel, bgPanelBackgroundClassNames } );
  }

  // ---------------------------------------------------------------------------

  $: {
    // If property `topPanelParams` changes:
    // - Set properties `onColorTopPanel` and `topPanelBackgroundClassNames`

    if( topPanelParams )
    {
      if( topPanelParams.backgroundColor )
      {
        topPanelBackgroundClassNames =
          `g-color gx-bgcolor-${topPanelParams.backgroundColor}`;

        onColorTopPanel = topPanelParams.backgroundColor;
      }
      else if( topPanelParams.onColor )
      {
        topPanelBackgroundClassNames = "";
        onColorTopPanel = topPanelParams.onColor;
      }
      else {
        topPanelBackgroundClassNames = "";
      }
    }

    if( !onColorTopPanel )
    {
      onColorTopPanel = onColor;
    }

    // console.log("layout:topPanel", { topPanelParams } );

    // console.log("layout:topPanel", { topPanelParams, onColorTopPanel, topPanelBackgroundClassNames } );
  }

  // ---------------------------------------------------------------------------

  $: {
    // If property `subTopPanelParams` changes:
    // - Set properties `onColorSubTopPanel` and `subTopPanelBackgroundClassNames`

    if( subTopPanelParams )
    {
      if( subTopPanelParams.backgroundColor )
      {
        subTopPanelBackgroundClassNames =
          `g-color gx-bgcolor-${subTopPanelParams.backgroundColor}`;

        onColorSubTopPanel = subTopPanelParams.backgroundColor;
      }
      else if( subTopPanelParams.onColor )
      {
        subTopPanelBackgroundClassNames = "";
        onColorSubTopPanel = subTopPanelParams.onColor;
      }
      else {
        subTopPanelBackgroundClassNames = "";
      }
    }

    if( !onColorSubTopPanel )
    {
      onColorSubTopPanel = onColor;
    }

    // console.log("layout:subTopPanel", { subTopPanelParams, onColorSubTopPanel, subTopPanelBackgroundClassNames } );
  }

  // ---------------------------------------------------------------------------

  $: {
    // If property `contentPanelParams` changes:
    // - Set properties `onColorContentPanel` and `contentPanelBackgroundClassNames`

    if( contentPanelParams )
    {
      if( contentPanelParams.backgroundColor )
      {
        contentPanelBackgroundClassNames =
          `g-color gx-bgcolor-${contentPanelParams.backgroundColor}`;

        onColorContentPanel = contentPanelParams.backgroundColor;
      }
      else if( contentPanelParams.onColor )
      {
        contentPanelBackgroundClassNames = "";
        onColorContentPanel = contentPanelParams.onColor;
      }
      else {
        contentPanelBackgroundClassNames = "";
      }
    }

    if( !onColorContentPanel )
    {
      onColorContentPanel = onColor;
    }

    // console.log("layout:contentPanel", { contentPanelParams, onColorContentPanel, contentPanelBackgroundClassNames } );
  }

  // ---------------------------------------------------------------------------

  $: {
    // If property `bottomPanelParams` changes:
    // - Set properties `onColorBottomPanel` and `bottomPanelBackgroundClassNames`

    if( bottomPanelParams )
    {
      if( bottomPanelParams.backgroundColor )
      {
        bottomPanelBackgroundClassNames =
          `g-color gx-bgcolor-${bottomPanelParams.backgroundColor}`;

        onColorBottomPanel = bottomPanelParams.backgroundColor;
      }
      else if( bottomPanelParams.onColor )
      {
        bottomPanelBackgroundClassNames = "";
        onColorBottomPanel = bottomPanelParams.onColor;
      }
      else {
        bottomPanelBackgroundClassNames = "";
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
    // - Set properties `onColorOverlayPanel` and `overlayPanelBackgroundClassNames`

    if( overlayPanelParams )
    {
      console.warn("Support for overlay panel is experimental (scroll issues)");

      if( overlayPanelParams.backgroundColor )
      {
        overlayPanelBackgroundClassNames =
          `g-color gx-bgcolor-${overlayPanelParams.backgroundColor}`;

        onColorOverlayPanel = overlayPanelParams.backgroundColor;
      }
      else if( overlayPanelParams.onColor )
      {
        overlayPanelBackgroundClassNames = "";
        onColorOverlayPanel = overlayPanelParams.onColor;
      }
      else {
        overlayPanelBackgroundClassNames = "";
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

  // $: {
  //   // - FIXME: apply aspect to layout element (e.g. for fixed size displays)

  //   if( layoutAspect )
  //   {
  //     heightStyle = `height: ${panelWidth / layoutAspect}px`;
  //     // console.log( "CHECK", panelWidth, panelHeight );
  //   }
  //   else {
  //     heightStyle = "";
  //   }
  // }

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

  <div class="c-app-layout
              {cssClassNames}
              {layoutCssClassNames}
              {layoutBackgroundClassNames}">

    {#if bgPanelParams && onColorBgPanel}
      <div class="layout-grid-background">
        <div class:x-ready={$backgroundPanelReady}
             class="cc-panel-background
                    {bgPanelCssClassNames}
                    {bgPanelBackgroundClassNames}">

          {#if bgPanelParams.component}
            <Panel component={bgPanelParams.component}
                   onColor={onColorBgPanel}
                   on:message />
          {/if}

        </div>
      </div>
    {/if}

    <div class="layout-grid-main">
      {#if topPanelParams || subTopPanelParams}
        <div class="cc-top-subtop-box" bind:clientHeight={topPanelHeight}>
          {#if topPanelParams && onColorTopPanel}
            <div class:x-ready={$topPanelReady}
                 class="cc-panel-top
                        {topPanelBackgroundClassNames}
                        {topPanelCssClassNames}">

              <Panel component={topPanelParams.component}
                     onColor={onColorTopPanel}
                     on:message />

            </div>
          {/if}

          {#if subTopPanelParams && onColorSubTopPanel}
            <div class:x-ready={$subTopPanelReady}
                 class="cc-panel-sub-top
                        {subTopPanelBackgroundClassNames}
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
                      {contentPanelBackgroundClassNames}
                      {contentPanelCssClassNames}">

            <Panel component={contentPanelParams.component}
                   onColor={onColorContentPanel}
                  on:message />

          </div>
        </div>

        <!-- <Scrollbar
          onColor={onColorContentPanel}
          observerTarget={contentPanelElement}
          scrollArea={contentPanelElement}
          showArrows={false}
          buttonPressingMove={10} /> -->

      {/if}

      {#if bottomPanelParams && onColorBottomPanel}
        <div class:x-ready={$bottomPanelReady}
             class="cc-panel-bottom
                    {bottomPanelBackgroundClassNames}
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
                    {overlayPanelBackgroundClassNames}
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
    min-height: 100vh;
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
