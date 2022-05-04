<script>
  // -- Imports

  import { expectString,
           expectPositiveNumber } from "@hkd-base/expect.js";

  import { objectGet } from "@hkd-base/object.js";

  import { expectValidSurfaceColor } from "@hkd-fe/theme.js";

  import { topPanelReady,
           subTopPanelReady,
           contentPanelReady,
           bottomPanelReady } from "@hkd-fe/stores/layout.js";

  import View from "@hkd-fe/components/routing/View.svelte";

  import {
    currentRouteAndState,
    getRoute } from "@hkd-fe/stores/router.js";

  import { menuTree } from "@hkd-fe/stores/main-menus.js";

  // import { debug } from "@hkd-base/log.js";

  import Scrollbar from "@hkd-fe/components/scrollbar/Scrollbar.svelte";

  // -- Exports

  export let viewParams;

  // $: console.log( "StandardAppLayout:viewParams", viewParams );

  let classNames = "";

  export { classNames as class };

  export let onColor;

  $: expectValidSurfaceColor( onColor );

  // ---------------------------------------------------------------------------
  // - App menu background and onColor

  const appMenuRouteLayoutBackground =
    getRoute("app-menu").layout.backgroundColor || onColor;

  const appMenuRoute = getRoute("app-menu");

  const appMenuRouteViews = appMenuRoute.views;

  // console.log( "test", getRoute("app-menu") );

  // console.log("appMenuRouteViews", appMenuRouteViews);

  let topPanelParams;
  let subTopPanelParams;
  let contentPanelParams;
  let bottomPanelParams;

  let layoutParams;
  let layoutBackgroundColor;

  // ---------------------------------------------------------------------------
  // - Respond to state and route changes
  // - Set layout background and onColor

  let currentRouteReady = true;

  let currentRoute;
  let currentState;
  let currentAccess;

  import { equals } from "@hkd-base/compare.js";

  $: {
    const { route, state, access } = $currentRouteAndState;

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
  // Process layout parameter [readyTimeoutMs]

  let readyTimeoutMs = 500;

  $: {
    if( layoutParams && ("readyTimeoutMs" in layoutParams ) )
    {
      readyTimeoutMs = layoutParams.readyTimeoutMs;

      expectPositiveNumber( readyTimeoutMs,
        "Invalid value for layout parameter [readyTimeoutMs]" );
    }
  }

  // ---------------------------------------------------------------------------
  // Process layout parameter [aspect]

  let layoutAspect = 0;

  $: {
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
    if( currentRoute )
    {
      if( !currentRouteReady )
      {
        const pathOnStart = currentRoute.path;
        // console.log("Route change started", pathOnStart);

        topPanelReady.set( false );
        subTopPanelReady.set( false );
        contentPanelReady.set( false );
        bottomPanelReady.set( false );

        setTimeout( () => {
          if( currentRoute.path === pathOnStart && !currentRouteReady )
          {
            currentRouteReady = true;
          }
        }, readyTimeoutMs );
      }
      else  {
        // console.log("Route change ready", currentRoute.path);

        topPanelReady.set( true );
        subTopPanelReady.set( true );
        contentPanelReady.set( true );
        bottomPanelReady.set( true );
      }
    }
  }

  $: {
    const currentRouteViews = currentRoute.views;

    const showAppMenu =
      objectGet( currentState, "data.appMenu.show", false );

    // console.log( "currentState.data.appMenu.show", { showAppMenu } );

    if( !showAppMenu )
    {
      // - Show normal route

      topPanelParams = currentRouteViews.topPanel;
      subTopPanelParams = currentRouteViews.subTopPanel;
      contentPanelParams = currentRouteViews.contentPanel;
      bottomPanelParams = currentRouteViews.bottomPanel;

      layoutParams = currentRoute.layout;
      layoutBackgroundColor = currentRoute.layout.backgroundColor;
    }
    else {
      // - Show app menu

      const currentMenuLabel =
        objectGet( currentState, "data.appMenu.menuLabel", "main" );

      const menu = $menuTree.getMenu( currentMenuLabel );

      topPanelParams = { ...appMenuRouteViews.appBar };
      topPanelParams.title = menu.title;

      subTopPanelParams = null;

      contentPanelParams = appMenuRouteViews.contentPanel;

      bottomPanelParams = null;

      layoutParams = appMenuRoute.layout;

      layoutBackgroundColor = appMenuRouteLayoutBackground;
    }

    // console.log( "layoutParams", layoutParams );

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
  // - Top panel background and onColor
  // - Action panel background and onColor
  // - Content panel background and onColor
  // - Bottom panel background and onColor

  let layoutBackgroundClass = "";

  let topPanelBackgroundClass = "";
  let subTopPanelBackgroundClass = "";
  let contentPanelBackgroundClass = "";
  let bottomPanelBackgroundClass = "";

  let onColorLayout = onColor;

  let onColorTopPanel = onColor;
  let onColorSubTopPanel = onColor;
  let onColorContentPanel = onColor;
  let onColorBottomPanel = onColor;

  $: {
    if( layoutParams && layoutParams.backgroundColor )
    {
      layoutBackgroundClass =
        `g-bgcolor-${layoutParams.backgroundColor}`;

      onColorLayout = layoutParams.backgroundColor;
    }
    else {
      layoutBackgroundClass = "";
      onColorLayout = layoutBackgroundColor || onColor;
    }
  }

  $: {
    if( topPanelParams && topPanelParams.backgroundColor )
    {
      topPanelBackgroundClass =
        `g-bgcolor-${topPanelParams.backgroundColor}`;

      onColorTopPanel = topPanelParams.backgroundColor;
    }
    else {
      topPanelBackgroundClass = "";
      onColorTopPanel = layoutBackgroundColor || onColor;
    }
  }

  $: {
    if( subTopPanelParams && subTopPanelParams.backgroundColor )
    {
      subTopPanelBackgroundClass =
        `g-bgcolor-${subTopPanelParams.backgroundColor}`;

      onColorSubTopPanel = subTopPanelParams.backgroundColor;
    }
    else {
      subTopPanelBackgroundClass = "";
      onColorSubTopPanel = layoutBackgroundColor || onColor;
    }
  }

  $: {
    if( contentPanelParams && contentPanelParams.backgroundColor )
    {
      contentPanelBackgroundClass =
        `g-bgcolor-${contentPanelParams.backgroundColor}`;

      onColorContentPanel = contentPanelParams.backgroundColor;
    }
    else {
      contentPanelBackgroundClass = "";
      onColorContentPanel = layoutBackgroundColor || onColor;
    }
  }

  $: {
    if( bottomPanelParams && bottomPanelParams.backgroundColor )
    {
      bottomPanelBackgroundClass =
        `g-bgcolor-${bottomPanelParams.backgroundColor}`;

      onColorTopPanel = bottomPanelParams.backgroundColor;
    }
    else {
      bottomPanelBackgroundClass = "";
      onColorBottomPanel = layoutBackgroundColor || onColor;
    }
  }

  // ---------------------------------------------------------------------------
  // Define CSS classes

  let layoutCssClassNames = "";

  let topPanelCssClassNames = "";
  let subTopPanelCssClassNames = "";
  let contentPanelCssClassNames = "";
  let bottomPanelCssClassNames = "";

  $: {
    if( layoutParams && layoutParams.classNames )
    {
      layoutCssClassNames = layoutParams.classNames;
    }
    else {
      layoutCssClassNames = "";
    }
  }

  $: {
    if( topPanelParams && topPanelParams.classNames )
    {
      topPanelCssClassNames = topPanelParams.classNames;
    }
    else {
      topPanelCssClassNames = "";
    }
  }

  $: {
    if( subTopPanelParams && subTopPanelParams.classNames )
    {
      subTopPanelCssClassNames = subTopPanelParams.classNames;
    }
    else {
      subTopPanelCssClassNames = "";
    }
  }

  $: {
    if( contentPanelParams && contentPanelParams.classNames )
    {
      contentPanelCssClassNames = contentPanelParams.classNames;
    }
    else {
      contentPanelCssClassNames = "";
    }
  }

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
  // Scroll content panel to top on [state.path] change

  let currentPath = null;

  let contentPanelElement;

  $: {
    if( contentPanelElement )
    {
      //console.log( "StandardAppLayout", $currentRouteAndState );

      const currentState = $currentRouteAndState.state;

      if( currentPath !== currentState.path )
      {
        currentPath = currentState.path;
        contentPanelElement.scrollTop = 0;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Aspect control (optional)

  let panelWidth;
  let heightStyle = "";

  $: {
    if( layoutAspect )
    {
      heightStyle = `height: ${panelWidth / layoutAspect}px`;
      // console.log( "CHECK", panelWidth, panelHeight );
    }
    else {
      heightStyle = "";
    }
  }
</script>

<!-- Max width: 100vw includes scrollbar, 100% not-->
<div bind:clientWidth={panelWidth}
     style={heightStyle}
     class:x-ready={currentRouteReady}
     class="layout {classNames}
            {layoutBackgroundClass} {layoutCssClassNames}">

  {#if topPanelParams && onColorTopPanel}
    <div class:x-ready={$topPanelReady}
         class="panel-top g-panel-top {topPanelBackgroundClass}
                {topPanelCssClassNames}">
      <View params={topPanelParams}
            onColor={onColorTopPanel}
            on:message />
    </div>
  {/if}

  {#if subTopPanelParams && onColor}
    <div class:x-ready={$subTopPanelReady}
         class="panel-sub-top g-panel-sub-top {subTopPanelBackgroundClass}
                {subTopPanelCssClassNames}">
      <View params={subTopPanelParams}
            onColor={onColorSubTopPanel}
            on:message />
    </div>
  {/if}

  {#if contentPanelParams && onColorContentPanel}
    <div bind:this={contentPanelElement}
         class:x-ready={$contentPanelReady}
         class="panel-content g-panel-content {contentPanelBackgroundClass}
                {contentPanelCssClassNames}">

      <View params={contentPanelParams}
            onColor={onColorContentPanel}
            on:message />

    </div>

    <Scrollbar
      onColor={onColorContentPanel}
      observerTarget={contentPanelElement}
      scrollArea={contentPanelElement}
      showArrows={false}
      buttonPressingMove={10} />
  {:else}
    <!-- Empty -->
  {/if}

  {#if bottomPanelParams && onColorBottomPanel}
    <div class:x-ready={$bottomPanelReady}
         class="panel-bottom g-panel-bottom {bottomPanelBackgroundClass}
                {bottomPanelCssClassNames}">
      <View params={bottomPanelParams}
            onColor={onColorBottomPanel}
            on:message />
    </div>
  {/if}

</div>

<style>
  .layout
  {
    top: 0px;
    bottom: 0px;

    left: 0px;
    right: 0px;

    display: grid;
    grid-template-columns: 100vw;

    /* [top-panel] [sub-top-panel] [content-panel] [bottom-panel] */
    grid-template-rows: min-content min-content auto min-content;

    height: 100%;  /* iphone 6 better than 100vh */
    width: 100%;
    max-width: 100%;

    /*overflow: auto;*/
    /*overflow: hidden;*/

    overflow-x: hidden;
    overflow-y: auto;

    /*border: dashed 1px green;*/
  }

  .layout-bg-img
  {
    position: absolute;
    display: block;
    top: 0px;
    bottom: 0px;

    left: 0px;
    right: 0px;

    overflow-x: hidden;
    overflow-y: hidden;
  }

  .panel-top
  {
    grid-area: 1 / 1;
    grid-row: 1;
  }

  .panel-sub-top
  {
    grid-area: 1 / 1;
    grid-row: 2;
  }

  .panel-content
  {
    grid-area: 1 / 1;
    grid-row: 3;

    align-self: stretch;

    /*border-top: dashed 5px green;
    border-bottom: dashed 5px green;*/

    overflow-x: hidden;
    overflow-y: auto;

    -ms-overflow-style: none;  /* IE and Edge */

    scrollbar-width: none;  /* Firefox */
  }

  .panel-content::-webkit-scrollbar
  {
    display: none;
  }

  .panel-bottom
  {
    grid-area: 1 / 1;
    grid-row: 4;
    /*background-color: red;
    border: dashed 1px red;*/
  }
</style>
