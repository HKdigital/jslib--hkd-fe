<script>

  /* ---------------------------------------------------------------- Imports */

  import Thumb from './Thumb.svelte';
  import ScrollButton from './ScrollButton.svelte';

  import { expectValidSurfaceColor } from "@hkd-fe/helpers/colors.js";

  /* ---------------------------------------------------------------- Exports */

  export let onColor;

  $: expectValidSurfaceColor( onColor );

  // export let className = 'scrollbar-track';
  export let wrapperElem = null;
  export let observerTarget = null;
  export let buttonPressingMove = 5;
  export let showArrows;

  /* -------------------------------------------------------------- Internals */

  const SCROLLBAR_IDLE_DELAY = 500;

  let trackElem;
  let clickLock = false;
  let smooth = false;
  let pressingUp = false;
  let pressingDown = false;

  let idleTimer;
  let idle = true;

  /**
   * Scrolling area when clicking on
   * scrollbar track
   *
   * @param {MouseEvent} event
   */
  function clickTrack( event )
  {
    if( clickLock )
    {
      return;
    }

    smooth = true;

    event.preventDefault();
    event.stopPropagation();

    const { offsetY } = event;
    const percents = (offsetY / trackElem.offsetHeight) * 100;

    wrapperElem.scrollTop = (wrapperElem.scrollHeight / 100) * percents;

    setTimeout(() => {
      smooth = false;
    },
    250);
  }

  /**
   * Set or reset the idle timer when a scroll event occurs
   */
  function onScroll()
  {
    // console.log("onScroll");

    idle = false;

    if( idleTimer )
    {
      clearTimeout( idleTimer );
      idleTimer = null;
    }

    idleTimer = setTimeout( () => {
      idle = true;
    },
    SCROLLBAR_IDLE_DELAY );
  }

  /* ------------------------------------------------------------------ Logic */

  $: {
    //
    // Fix incorrect scrollbar height and top after navigation change
    //
    if( observerTarget && trackElem )
    {
      const rect = observerTarget.getBoundingClientRect();

      trackElem.style.top = `${rect.top}px`;
      trackElem.style.height = `${rect.height}px`;
    }
  }

</script>

{#if wrapperElem}
  <div bind:this="{trackElem}"
      class:x-idle={idle}
      class="g-scrollbar-track g-scrollbar-track-on-{onColor}
             scrollbar-track"
       on:click="{clickTrack}">
    {#if trackElem}
      {#if showArrows}
        <ScrollButton direction="up" bind:pressing="{pressingUp}" />
      {/if}
      <Thumb
        {onColor}
        wrapperElem="{wrapperElem}"
        trackElem="{trackElem}"
        observerTarget="{observerTarget}"
        smooth="{smooth}"
        on:scroll="{onScroll}"
        on:lock-click="{() => (clickLock = true)}"
        on:unlock-click="{() => (clickLock = false)}"
        pressingUp="{pressingUp}"
        pressingDown="{pressingDown}"
        buttonPressingMove="{buttonPressingMove}"
        showArrows="{showArrows}"
      />
      {#if showArrows}
        <ScrollButton direction="down" bind:pressing="{pressingDown}" />
      {/if}
    {/if}
  </div>
{/if}

<style>
  .scrollbar-track {
    position: absolute;
    z-index: 20;

    width: 0.5rem;
    right: 0;

    background-color: olive;

    /*opacity: 1;*/
    /*transition: opacity 0.5s;*/

    /*border-radius: 5px;*/
    /*background-color: #dbdbdb;*/
    /*box-shadow: 0 0 0 4px #dbdbdb;*/
  }

  /*.idle {
    opacity: 0.1 !important;
  }*/
</style>
