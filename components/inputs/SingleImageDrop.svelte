<script>
/**
 * This component is an image file drop area
 * - Fires a "imagefile" event if aan image was dropped or selected and
 *   generation of the preview was succesful
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file
 */

/* ------------------------------------------------------------------ Imports */

import { createEventDispatcher } from 'svelte';

const dispatch = createEventDispatcher();

import { fade } from 'svelte/transition';

import ValueStore
  from '@hkd-base/classes/ValueStore.js';

import { filedrop }
  from '@hkd-fe/actions/filedrop.js';

import { loadImage }
  from '@hkd-fe/helpers/image-file.js';

import BodyText
  from '@hkd-fe/components/text/BodyText.svelte';

import Image
  from '@hkd-fe/components/media/Image.svelte';

import TabIcon
  from '@hkd-fe/components/icons/TabIcon.svelte';

import DocumentArrowUp
  from '@hkd-fe/components/icons/hero/solid/DocumentArrowUp.svelte';

import ExclamationCircle
  from '@hkd-fe/components/icons/hero/outline/ExclamationCircle.svelte';

import EllipsisHorizontal
  from '@hkd-fe/components/icons/hero/solid/EllipsisHorizontal.svelte';


// import InlineIcon
//   from "@hkd-fe/components/icons/InlineIcon.svelte";

// import DocumentArrowUp
//   from "@hkd-fe/components/icons/hero/outline/DocumentArrowUp.svelte";

// -- Constants

// -- Logging

// import { getModuleLogger }
//   from "@hkd-base/helpers/log.js";

// const log = getModuleLogger( "Test.svelte" );

/* ---------------------------------------------------------------- Internals */

let fileDropOptions;
let previewImageSrc;

let error = null;

let isOver = false;

const busy = new ValueStore( false );

// -----------------------------------------------------------------------------

/**
 * Load preview image
 *
 * @param {(string|File)} urlOrImageFile
 */
async function loadPreview( urlOrImageFile )
{
  try {
    // console.log( "Load preview", urlOrImageFile );

    const previewImage = await loadImage( urlOrImageFile );

    previewImageSrc = previewImage.src;
    error = null;

    if( urlOrImageFile !== initialImageUrl )
    {
      dispatch('drop', { urlOrImageFile, busy } );
    }
  }
  catch( e )
  {
    console.error( e );
    previewImageSrc = null;
    error= e;
  }
}


/* ------------------------------------------------------------------ Exports */

/**
 * CSS class names to add to the element
 */
let cssClassNames = '';
export { cssClassNames as class };

export let onColor;

export let tabIndex = -1;
export let disabled = false;
export let accept = 'image/*';

export let uploadIcon = DocumentArrowUp;
export let uploadText = 'Upload image';

export let uploadIconClasses = '';
export let uploadTextClasses = '';

export let overIcon = DocumentArrowUp;
export let overText = '';

export let overIconClasses = '';
export let overTextClasses = '';

export let overlayIcon = DocumentArrowUp;
export let overlayText = '';

export let overlayIconClasses = '';
export let overlayTextClasses = '';

export let busyIcon = EllipsisHorizontal;
export let busyText = '';

export let busyIconClasses = '';
export let busyTextClasses = '';

export let errorIcon = ExclamationCircle;
export let errorText = 'Failed to load image';

export let errorIconClasses = '';
export let errorTextClasses = '';

export let initialImageUrl = null;

export let fit = 'contain';
export let position = 'center center';

/* ----------------------------------------------------------------- Reactive */

$: {
  //
  // Update file drop options
  //
  fileDropOptions =
    {
      tabIndex,
      multiple: false,
      accept,
      disabled
    };
}



// -----------------------------------------------------------------------------

$: if( initialImageUrl )
{
  //
  // Load initial images
  //
  loadPreview( initialImageUrl );
}

// -----------------------------------------------------------------------------

/**
 * Component destroyed
 * => Cancel file reader operators
 */
// onDestroy( cancelLoadPreviews );

</script>

<div c-single-image-drop
     class="x-on-{onColor} {cssClassNames}"
     on:over={ ( e ) => { isOver = e.detail.isOver; } }
     use:filedrop={fileDropOptions}
     on:filedrop={ (e) => { loadPreview( e.detail.files[0] ); } }>

    {#if $busy}

      <div cc-busy-box
         in:fade={{duration: 250}}>

        <div cc-inner
           class:x-two-rows={busyText}>

          <TabIcon
            {onColor}
            class="{busyIconClasses}"
            content={busyIcon} />

          {#if busyText}
            <BodyText
              {onColor}
              class="{busyTextClasses}">{busyText}</BodyText>
          {/if}
        </div>
      </div>

    {:else if isOver}

      <div cc-over-box
         in:fade={{duration: 250}}>

        <div cc-inner
           class:x-two-rows={overText}>

          <TabIcon
            {onColor}
            class="{overIconClasses}"
            content={overIcon} />

          {#if overText}
            <BodyText
              {onColor}
              class="{overTextClasses}">{overText}</BodyText>
          {/if}
        </div>
      </div>

    {:else}

      {#if !previewImageSrc}

        {#if !error}
          <div cc-upload-box
               in:fade={{duration: 250}}>

            <div cc-inner
               class:x-two-rows={uploadText}>

              <TabIcon
                {onColor}
                class="{uploadIconClasses}"
                content={uploadIcon} />

              {#if uploadText}
                <BodyText
                  {onColor}
                  class="{uploadTextClasses}">{uploadText}</BodyText>
              {/if}
            </div>

          </div>
        {:else}
          <div cc-error-box>

             <div cc-inner
               class:x-two-rows={errorText}>

              <TabIcon
                {onColor}
                class="{errorIconClasses}"
                content={errorIcon} />

              {#if errorText}
                <BodyText
                  {onColor}
                  class="{errorTextClasses}">{errorText}</BodyText>
              {/if}

            </div>

          </div>
        {/if}

      {:else}

        <div cc-image-box
             in:fade={{duration: 250}}
             class:isOver>

          <Image src={previewImageSrc}
                 {fit}
                 {position} />

        </div>

        <div cc-image-overlay-box
             class:isOver>

          <div cc-inner
               class:x-two-rows={overlayText}>

            {#if overlayIcon}
              <TabIcon
                {onColor}
                class="{overlayIconClasses}"
                content={overlayIcon} />
            {/if}

            {#if overlayText}
              <BodyText
                {onColor}
                class="{overlayTextClasses}">{overlayText}</BodyText>
            {/if}

          </div>

        </div>

      {/if}
    {/if}

</div>

<style>
  [c-single-image-drop]
  {
    display: grid;

    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);

    min-height: 0;
    max-height: 100%;

    min-width: 0;
    max-width: 100%;

    cursor: pointer;
  }

  :global( [c-single-image-drop] > * )
  {
    min-height: 0;
    min-width: 0;
  }

  [cc-over-box],
  [cc-upload-box],
  [cc-busy-box],
  [cc-error-box]
  {
    display: grid;
    grid-template-columns: minmax(0, auto);
    grid-template-rows: minmax(0, auto);

    align-items: center;
    justify-items: center;
  }

  [cc-image-box]
  {
    grid-area: 1 / 1 / 2 / 2; /* row-start, col-start, row-end, col-end */
  }

  [cc-image-overlay-box]
  {
    grid-area: 1 / 1 / 2 / 2; /* row-start, col-start, row-end, col-end */

    display: grid;
    grid-template-columns: minmax(0, auto);
    grid-template-rows: minmax(0, auto);

    align-items: center;
    justify-items: center;

    pointer-events: none;
  }


  [cc-inner]
  {
    display: grid;
    grid-template-columns: minmax(0, auto);
    grid-template-rows: minmax(0, auto);

    align-items: center;
    justify-items: center;
  }

  [cc-inner].x-two-rows
  {
    align-content: center;

    grid-template-columns: minmax(0, auto);
    grid-template-rows: repeat( 2, min-content );
  }

</style>