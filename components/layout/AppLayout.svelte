<script>
  /**
   * Example data
   *
   * route =
   *  {
   *     layout: {
   *       component: AppLayout
   *     },
   *
   *     panels:
   *     {
   *       backgroundPanel: {
   *         backgroundColor: SURFACE_DARK_BLUE
   *       },
   *
   *       topPanel: {
   *         component: TopPanelWithLogo,
   *         classNames: "g-something-special"
   *      },
   *
   *       contentPanel: {
   *         component: ContentPanelHome,
   *         backgroundColor: SURFACE_DARK_BLUE
   *       }
   *
   *       bottomPanel: {
   *         component: BottomPanel,
   *         backgroundColor: SURFACE_DARK
   *       }
   *     }
   *   }
   */

  /* ---------------------------------------------------------------- Imports */

  // import { defer } from '@hkd-base/helpers/process.js';

  import { expectString,
           expectPositiveNumber } from "@hkd-base/helpers/expect.js";

  // import { expectValidSurfaceColor } from "@hkd-fe/helpers/colors.js";

  import { equals } from "@hkd-base/helpers/compare.js";

  import Panel from "@hkd-fe/components/layout/Panel.svelte";

  // import Scrollbar from "@hkd-fe/components/scrollbar/Scrollbar.svelte";

  // import PleaseRotateScreen
  //   from "$src/views/special-panels/PleaseRotateScreen.svelte";

  import { routeStateStore } from "@hkd-fe/stores/router.js";

  // import { isLandscapeOnMobile }
  //   from "$skills-fe/stores/screen-orientation.js";

  // import { debug } from "@hkd-base/helpers/log.js";

  import { backgroundPanelReady,
           topPanelReady,
           subTopPanelReady,
           contentPanelReady,
           superBottomPanelReady,
           bottomPanelReady } from "./AppLayout.js";

  import { expectValidRoute }
    from "@hkd-fe/helpers/frontend-router.js";

   import { log } from "@hkd-base/helpers/log.js";

   import { onMount,
            onDestroy } from 'svelte';

   import Offs from "@hkd-base/classes/Offs.js";

   import ValueStore from "@hkd-base/classes/ValueStore.js";

  /* -------------------------------------------------------------- Internals */

  const offs = new Offs();

  //
  // Disable automatic scroll restauration by browser when navigating back
  //
  history.scrollRestoration = 'manual';

  // --

  const SURFACE_COLOR_DEFAULT = "surface1";

  // --

  let currentRoute = new ValueStore();
  let currentRouteReady = true;

  let readyTimeoutMs = 500;
  let layoutAspect = 0;

  let layoutParams;

  let backgroundPanelParams;
  let topPanelParams;
  let subTopPanelParams;
  let contentPanelParams;
  let superBottomPanelParams;
  let bottomPanelParams;

  let layoutBgClassNames = "";

  let backgroundPanelBgClassNames = "";
  let topPanelBgClassNames = "";
  let subTopPanelBgClassNames = "";
  let contentPanelBgClassNames = "";
  let superBottomPanelBgClassNames = "";
  let bottomPanelBgClassNames = "";

  let bgColorLayout;

  let bgColorBackgroundPanel;
  let bgColorTopPanel;
  let bgColorSubTopPanel;
  let bgColorContentPanel;
  let bgColorBottomPanel;
  let bgColorSuperBottomPanel;

  let onColorLayout;

  let onColorBackgroundPanel;
  let onColorTopPanel;
  let onColorSubTopPanel;
  let onColorContentPanel;
  let onColorBottomPanel;
  let onColorSuperBottomPanel;

  let layoutCssClassNames = "";

  let backgroundPanelCssClassNames = "";
  let topPanelCssClassNames = "";
  let subTopPanelCssClassNames = "";
  let contentPanelCssClassNames = "";
  let superBottomPanelCssClassNames = "";
  let bottomPanelCssClassNames = "";

  let contentPanelElement;
  let contentPanelOuterElem;

  let topPanelHeight = -1;
  let bottomPanelHeight = -1;

  // const documentElement = document.documentElement;

  // ---------------------------------------------------------------------------

  /**
   * Update internal properties when a route changes
   *
   * @param {object} route
   */
  function handleRouteUpdate( route )
  {
    if( !route )
    {
      return;
    }

    // log.debug( ">>>>> route", route );

    if( !equals( currentRoute.get(), route ) )
    {
      currentRoute.set( route );
      currentRouteReady = false;

      // == Layout

      layoutParams = $currentRoute.layout;

      bgColorLayout = layoutParams.backgroundColor;
      onColorLayout = layoutParams.onColor || bgColorLayout || null;

      layoutCssClassNames = layoutParams.classNames;

      // == Panels

      const currentRoutePanels = $currentRoute.panels;

      // -- Background panel

      backgroundPanelParams = currentRoutePanels.backgroundPanel;

      if( backgroundPanelParams )
      {
        bgColorBackgroundPanel = backgroundPanelParams.backgroundColor;

        onColorBackgroundPanel =
          backgroundPanelParams.onColor || bgColorBackgroundPanel;

        backgroundPanelCssClassNames = backgroundPanelParams.classNames;
      }
      else {
        bgColorBackgroundPanel = null;
        onColorBackgroundPanel = null;

        backgroundPanelCssClassNames = "";
      }

      // -- Top panel

      topPanelParams = currentRoutePanels.topPanel;

      if( topPanelParams )
      {
        bgColorTopPanel = topPanelParams.backgroundColor;

        onColorTopPanel =
          topPanelParams.onColor || bgColorTopPanel;

        topPanelCssClassNames = topPanelParams.classNames;
      }
      else {
        bgColorTopPanel = null;
        onColorTopPanel = null;

        topPanelCssClassNames = "";
      }

      // -- Sub top panel

      subTopPanelParams = currentRoutePanels.subTopPanel;

      if( subTopPanelParams )
      {
        bgColorSubTopPanel = subTopPanelParams.backgroundColor;

        onColorSubTopPanel =
          subTopPanelParams.onColor || bgColorSubTopPanel;

        subTopPanelCssClassNames = subTopPanelParams.classNames;
      }
      else {
        bgColorSubTopPanel = null;
        onColorSubTopPanel = null;

        subTopPanelCssClassNames = "";
      }

      // -- Content panel

      contentPanelParams = currentRoutePanels.contentPanel;

      if( contentPanelParams )
      {
        bgColorContentPanel = contentPanelParams.backgroundColor;

        onColorContentPanel =
          contentPanelParams.onColor || bgColorContentPanel;

        contentPanelCssClassNames = contentPanelParams.classNames;
      }
      else {
        bgColorContentPanel = null;
        onColorContentPanel = null;

        contentPanelCssClassNames = "";
      }

      // -- Super bottom panel

      superBottomPanelParams = currentRoutePanels.superBottomPanel;

      if( superBottomPanelParams )
      {
        bgColorSuperBottomPanel = superBottomPanelParams.backgroundColor;

        onColorSuperBottomPanel =
          superBottomPanelParams.onColor || bgColorSuperBottomPanel;

        superBottomPanelCssClassNames = superBottomPanelParams.classNames;
      }
      else {
        bgColorSuperBottomPanel = null;
        onColorSuperBottomPanel = null;

        superBottomPanelCssClassNames = "";
      }

      // -- Bottom panel

      bottomPanelParams = currentRoutePanels.bottomPanel;

      if( bottomPanelParams )
      {
        bgColorBottomPanel = bottomPanelParams.backgroundColor;

        onColorBottomPanel =
          bottomPanelParams.onColor || bgColorBottomPanel;

        bottomPanelCssClassNames = bottomPanelParams.classNames;
      }
      else {
        bgColorBottomPanel = null;
        onColorBottomPanel = null;

        bottomPanelCssClassNames = "";
      }
    }
  }

  /* ---------------------------------------------------------------- Exports */

  let cssClassNames = "";
  export { cssClassNames as class };

  export let onColor = SURFACE_COLOR_DEFAULT;

  /* ------------------------------------------------------------------ Logic */

  //
  // React to route changes
  //
  $: {
    if( $routeStateStore.route )
    {
      handleRouteUpdate( $routeStateStore.route );
    }
  }

  onDestroy( () => { offs.unsubscribeAll(); } );

  // ===========================================================================
  // Ready states

  $: {
    //
    // If `currentRouteReady` is false
    // => set panels not ready
    // => set timeout
    //
    if( !currentRouteReady )
    {
      const LABEL = "currentRouteReady";

      offs.tryUnregister( LABEL );

      let pathOnStart = $currentRoute.path;

      backgroundPanelReady.set( false );
      topPanelReady.set( false );
      subTopPanelReady.set( false );
      contentPanelReady.set( false );
      superBottomPanelReady.set( false );
      bottomPanelReady.set( false );


      offs.executeDelayed( LABEL, () =>
        {
          const currentPath = currentRoute.get().path;

          if( currentPath === pathOnStart && !currentRouteReady )
          {
            currentRouteReady = true;
          }
        },
        readyTimeoutMs );
    }
  }

  // ---------------------------------------------------------------------------

  $: {
    //
    // Make all panels as ready if `currentRouteReady` (after timeout)
    //
    if( currentRouteReady )
    {
      backgroundPanelReady.set( true );
      topPanelReady.set( true );
      subTopPanelReady.set( true );
      contentPanelReady.set( true );
      superBottomPanelReady.set( true );
      bottomPanelReady.set( true );
    }
  }

  // ===========================================================================
  // Layout component

  $: {
    //
    // Process layoutParams
    //
    if( layoutParams )
    {
      // console.log("layoutParams", layoutParams);

      if( "readyTimeoutMs" in layoutParams )
      {
        readyTimeoutMs = layoutParams.readyTimeoutMs;

        expectPositiveNumber( readyTimeoutMs,
          "Invalid value for layout parameter [readyTimeoutMs]" );
      }

      if( "aspect" in layoutParams )
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
  }

  // ===========================================================================
  // Scroll restauration

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
      // console.log( "currentRouteReady: restore scroll" );
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

  // ===========================================================================
  // Background CSS classes

  $: {
    //
    // Update layout background classNames
    //

    if( bgColorLayout )
    {
      layoutBgClassNames =
        `g-bg-${bgColorLayout}`;
    }
    else {
      layoutBgClassNames = "";
    }
  }

  // ---------------------------------------------------------------------------

  $: {
    //
    // Update backgroundPanel background CSS
    //

    if( backgroundPanelParams )
    {
      if( bgColorBackgroundPanel )
      {
        backgroundPanelBgClassNames =
          `g-bg-${bgColorBackgroundPanel}`;
      }
      else {
        backgroundPanelBgClassNames = "";
      }
    }
  }

  // ---------------------------------------------------------------------------

  $: {
    //
    // Update topPanel background CSS
    //

    if( topPanelParams )
    {
      if( bgColorBackgroundPanel )
      {
        topPanelBgClassNames =
          `g-bg-${bgColorBackgroundPanel}`;
      }
      else {
        topPanelBgClassNames = "";
      }
    }
  }

  // ---------------------------------------------------------------------------

  $: {
    //
    // Update subTopPanel background CSS
    //

    if( subTopPanelParams )
    {
      if( bgColorBackgroundPanel )
      {
        subTopPanelBgClassNames =
          `g-bg-${bgColorBackgroundPanel}`;
      }
      else {
        subTopPanelBgClassNames = "";
      }
    }
  }

  // ---------------------------------------------------------------------------

  $: {
    //
    // Update contentPanel background CSS
    //

    if( contentPanelParams )
    {
      if( bgColorBackgroundPanel )
      {
        contentPanelBgClassNames =
          `g-bg-${bgColorBackgroundPanel}`;
      }
      else {
        contentPanelBgClassNames = "";
      }
    }
  }

  // ---------------------------------------------------------------------------

  $: {
    //
    // Update superBottomPanel background CSS
    //

    if( superBottomPanelParams )
    {
      if( bgColorBackgroundPanel )
      {
        superBottomPanelBgClassNames =
          `g-bg-${bgColorBackgroundPanel}`;
      }
      else {
        superBottomPanelBgClassNames = "";
      }
    }
  }

  // ---------------------------------------------------------------------------

  $: {
    //
    // Update bottomPanel background CSS
    //

    if( bottomPanelParams )
    {
      if( bgColorBottomPanel )
      {
        bottomPanelBgClassNames =
          `g-bg-${bgColorBottomPanel}`;
      }
      else {
        bottomPanelBgClassNames = "";
      }

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

// $: {
//   console.log(
//     789,
//     {
//       onColorContentPanel,
//       onColorLayout,
//       onColor
//     } );
// }

</script>

<!-- <svelte:window bind:scrollY={y}/> -->

<!-- {#if !$isLandscapeOnMobile} -->

  <div class="c-app-layout
              {cssClassNames}
              {layoutCssClassNames}
              {layoutBgClassNames}">

    {#if backgroundPanelParams}
      <div class="app-layout-grid-background">
        <div class:x-ready={$backgroundPanelReady}
             class="cc-panel-background
                    {backgroundPanelCssClassNames}
                    {backgroundPanelBgClassNames}">

          {#if backgroundPanelParams.component}
            <Panel content={backgroundPanelParams.component}
                   onColor={onColorBackgroundPanel || onColorLayout || onColor}
                   on:message />
          {/if}

        </div>
      </div>
    {/if}

    <div class="app-layout-grid-front">
      {#if topPanelParams || subTopPanelParams}
        <div class="cc-top-subtop-box" bind:clientHeight={topPanelHeight}>
          {#if topPanelParams}
            <div class:x-ready={$topPanelReady}
                 class="cc-panel-top
                        {topPanelBgClassNames}
                        {topPanelCssClassNames}">

              <Panel content={topPanelParams.component}
                     onColor={onColorTopPanel || onColorLayout || onColor}
                     on:message />

            </div>
          {/if}

          {#if subTopPanelParams}
            <div class:x-ready={$subTopPanelReady}
                 class="cc-panel-sub-top
                        {subTopPanelBgClassNames}
                        {subTopPanelCssClassNames}">
              <Panel content={subTopPanelParams.component}
                     onColor={onColorSubTopPanel || onColorLayout || onColor}
                     on:message />
            </div>
          {/if}
        </div>
      {/if}

      {#if contentPanelParams}
        <div class="content-panel-outer" bind:this={contentPanelOuterElem}>
          <div bind:this={contentPanelElement}
               class:x-ready={$contentPanelReady}
               class="cc-panel-content
                      {contentPanelBgClassNames}
                      {contentPanelCssClassNames}">

            <Panel content={contentPanelParams.component}
                   onColor={onColorContentPanel || onColorLayout || onColor}
                  on:message />

          </div>
        </div>

        <!-- <Scrollbar
          onColor={onColorContentPanel || onColorLayout || onColor}
          observerTarget={document.body}
          scrollArea={document.body}
          showArrows={false}
          buttonPressingMove={10} /> -->

      {/if}

      <!-- TODO super bottom panel -->

      {#if bottomPanelParams}
        <div class:x-ready={$bottomPanelReady}
             class="cc-panel-bottom
                    {bottomPanelBgClassNames}
                    {bottomPanelCssClassNames}">
          <Panel content={bottomPanelParams.component}
                 onColor={onColorBottomPanel || onColorLayout || onColor}
                 on:message />
        </div>
      {/if}

    <!-- Scrollbar (or scroll store) -->

    </div> <!-- end app-layout-grid-front -->

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

  .app-layout-grid-background
  {
    /*background-color: blue;*/
    grid-area: 1 / 1 / 2 / 2; /* row-start, col-start, row-end, col-end */
    z-index: 10;
    min-height: 100vh;
  }

  .app-layout-grid-front
  {
    /*background-color: red;*/
    grid-area: 1 / 1 / 2 / 2; /* row-start, col-start, row-end, col-end */
    z-index: 20;
    /*width: 100%;*/
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
  }

  /* TODO: super bottom panel */


  :global(.c-app-layout .cc-panel-bottom)
  {
    z-index: 50;

    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;

    transition: top 0.2s ease-out 0s;
  }

  /* hide scrollbar but keep scroll functionality */

  :global( body )
  {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  :global( body::-webkit-scrollbar )
  {
    display: none;
  }

</style>
