<script>
  /* ---------------------------------------------------------------- Imports */

  import { onMount,
           onDestroy,
           createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  import { createObserver } from './utils/observer';

  import { expectValidSurfaceColor } from '@hkd-fe/helpers/colors.js';

  /* ---------------------------------------------------------------- Exports */

  export let onColor;

  $: expectValidSurfaceColor( onColor );

  // export let className = 'scrollbar-thumb';
  export let wrapperElem = null;
  export let observerTarget = null;
  export let smooth = false;
  export let trackElem = null;
  export let pressingUp = false;
  export let pressingDown = false;
  export let buttonPressingMove = 5;
  export let showArrows;

  /* -------------------------------------------------------------- Internals */


  const heightReducer = showArrows ? 40 : 0;

  let thumbElem;
  let thumbElemStyle = 'height: 0px; top: 0px';

  let noScroll = true;
  let pos = { top: 0, y: 0 };
  let unsubscribeObserver;

  /**
   * Calculating and set new height and top of thumb
   * - Sets property `thumbElemStyle`
   */
  function updateThumbHeightAndTop()
  {
    const maxHeight = wrapperElem.scrollHeight - heightReducer;

    const visibleArea = wrapperElem.offsetHeight - heightReducer;

    const currentScrolled = wrapperElem.scrollTop;

    const visiblePercent = (visibleArea / maxHeight) * 100;
    const scrolledPercent = (currentScrolled / maxHeight) * 100;

    const thumbTop = (visibleArea / 100) * scrolledPercent + 'px';
    const thumbHeight = visiblePercent + '%';

    if( thumbHeight === '100%' )
    {
      noScroll = true;
    }
    else {
      noScroll = false;
    }
    // noScroll = thumbHeight === '100%';

    thumbElemStyle = `height: ${thumbHeight}; top: ${thumbTop}`;
  }

  /**
   * Common handler for "touchmove" and "mousemove"
   *
   * @param {MouseEvent|TouchEvent} e
   */
  function thumbInteractionHappening( e )
  {
    e.preventDefault();
    e.stopPropagation();
    const clientY = e.type === 'touchmove' ? e.changedTouches[0].clientY : e.clientY;
    const dy = clientY - pos.y;
    wrapperElem.scrollTop = pos.top + dy;
  }

  /**
   * Common handler for "touchend" and "mouseup"
   */
  function thumbInteractionEnd()
  {
    setTimeout(() => {
      dispatch('unlock-click');
    });

    document.body.style.userSelect = 'inherit';
    document.removeEventListener('mousemove', thumbInteractionHappening);
    document.removeEventListener('mouseup', thumbInteractionEnd);
    document.removeEventListener('touchmove', thumbInteractionHappening);
    document.removeEventListener('touchend', thumbInteractionEnd);
  }

  /**
   * Common handler from "touchstart" and "mousedown
   * @param {MouseEvent|TouchEvent} e
   */
  function thumbInteractionStart(e)
  {
    dispatch('lock-click');

    e.preventDefault();
    e.stopPropagation();

    pos = {
      top: wrapperElem.scrollTop,
      y: e.type === 'touchstart' ? e.changedTouches[0].clientY : e.clientY
    };

    document.body.style.userSelect = 'none';

    if (e.type === 'touchstart')
    {
      document.addEventListener('touchmove', thumbInteractionHappening);
      document.addEventListener('touchend', thumbInteractionEnd);
    }
    else {
      document.addEventListener('mousemove', thumbInteractionHappening);
      document.addEventListener('mouseup', thumbInteractionEnd);
    }
  }

  /**
   * Setting position and size for
   * track element
   */
  function initTrackBar()
  {
    trackElem.style.top = wrapperElem.offsetTop + heightReducer / 2 + 'px';
    trackElem.style.height = wrapperElem.offsetHeight - heightReducer + 'px';
  }

  onMount( () => {
    initTrackBar();

    thumbElem.addEventListener('mousedown', thumbInteractionStart);
    thumbElem.addEventListener('touchstart', thumbInteractionStart);

    wrapperElem.addEventListener('scroll', () => {
      updateThumbHeightAndTop();
      dispatch('scroll');
    } );

    window.addEventListener('resize', initTrackBar);

    const observerElem =
      observerTarget.$$ ? observerTarget.happyObserverTarget() : observerTarget;

    unsubscribeObserver =
      createObserver( observerElem, () => updateThumbHeightAndTop() );
  });

  onDestroy( () => {
    thumbElem.removeEventListener('mousedown', thumbInteractionStart);
    thumbElem.removeEventListener('touchstart', thumbInteractionStart);

    window.removeEventListener('resize', initTrackBar);

    unsubscribeObserver();
  });

  function buttonScrollDown( pressing )
  {
    if( !pressing )
    {
      return;
    }

    requestAnimationFrame(() => {
      wrapperElem.scrollTop += buttonPressingMove;
      buttonScrollDown(pressingDown);
    });
  }

  function buttonScrollUp( pressing )
  {
    if( !pressing)
    {
      return;
    }

    requestAnimationFrame( () => {
      wrapperElem.scrollTop -= buttonPressingMove;
      buttonScrollUp(pressingUp);
    });
  }

  /* ------------------------------------------------------------------ Logic */

  $: buttonScrollUp( pressingUp );
  $: buttonScrollDown( pressingDown );

</script>

<div
  bind:this="{thumbElem}"
  style={thumbElemStyle}
  class="g-scrollbar-thumb g-scrollbar-thumb-on-{onColor} scrollbar-thumb"
  class:no-scroll="{noScroll}"
  class:smooth
></div>

<style>
  .scrollbar-thumb {
    /*background-color: #b0b0b0;*/
    background-color: red;
    width: 0.6rem;
    border-radius: 0.3rem;
    cursor: pointer;

    position: absolute;
    z-index: 21;
    display: block;

    height:  20px;

    /*background-color: blue !important;*/
    /*width: var(--scrollbar-thumb-width, 0.5rem) !important;*/
  }

  .scrollbar-thumb.no-scroll {
    display: none;
  }

  .scrollbar-thumb.smooth {
    transition: top 0.2s ease;
  }
</style>
