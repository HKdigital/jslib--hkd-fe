<script>

/* ------------------------------------------------------------------ Imports */

import { createEventDispatcher } from 'svelte';

const dispatch = createEventDispatcher();

import BodyText
  from '@hkd-fe/components/text/BodyText.svelte';

// -- Constants

import { SURFACE_NONE }
  from '@hkd-fe/constants/surfaces.js';

import { UPDATE_EVENT }
  from '@hkd-fe/constants/events.js';

// -- Logging

// import { getModuleLogger }
//   from '@hkd-base/helpers/log.js';

// const log = getModuleLogger( 'TextEdit.svelte' );


/* ---------------------------------------------------------------- Internals */

let focused;

let editElement;

// -----------------------------------------------------------------------------

/**
 * Focus the component
 *
 * @param {object} e
 */
function doFocus( e )
{
  // console.log("doFocus: " + placeholder);

  //
  // Weird hack to force setting focus
  //
  // @see https://stackoverflow.com/
  //      questions/2388164/set-focus-on-div-contenteditable-element
  //
  const selection = window.getSelection(),
        range = document.createRange();

  range.setStart( editElement, 0);
  range.setEnd( editElement, 0);
  selection.removeAllRanges();
  selection.addRange( range );

  focused = true;
  e.preventDefault();
}

// -----------------------------------------------------------------------------

/**
 * Blur the component
 * - Emits an `UPDATE` event
 */
function doBlur()
{
  // console.log("doBlur: " + placeholder);

  focused = false;

  //
  // Get innerText and replace tabs by double space
  //
  const tmp = editElement.innerText.replaceAll('\\t', '  ');

  //
  // Remove newlines if not allowed
  //
  content =
    allowNewLine ? tmp : tmp.replaceAll('[\\n\\r]+','');

  //
  // TESTING:
  // The following timeout is because we're testing something:
  // The component seems to crash when the event fires and an error occurs
  //
  // -> remove setTimeout!
  //

  setTimeout( ()=> {
    dispatch( UPDATE_EVENT, { updatedValue: content } );
  }, 0 );
}

// -----------------------------------------------------------------------------

/**
 * Prevent the user from adding newlines to the text
 */
function tryPreventNewline()
{
  if( !allowNewLine && event.key === 'Enter' )
  {
    event.preventDefault();
  }
}

// -----------------------------------------------------------------------------

/**
 * Intercept the paste event
 * - Cancel the default paste operation
 * - Manually past the plain text version instead
 * - Optionally remove newlines if component property
 *   `allowNewLine` is set to false
 *
 * @param {object} e - Paste event
 */
function pasteAsPlainText( e )
{
  e.preventDefault();

  let text = e.clipboardData.getData('text/plain');

  if( !allowNewLine )
  {
    text = text.replace(/[\n\r]/g, '');
  }

  document.execCommand('insertHTML', false, text);
}

/* ------------------------------------------------------------------ Exports */

let cssClassNames = '';
export { cssClassNames as class };

export let onColor;
export let surfaceColor = SURFACE_NONE;


/* Center the element (element should have a width) */
export let center = false;

export let content;
export let placeholder;
export let allowNewLine = false;

/**
 * Parser function that receives the value of the input element
 * and should return an object that contains the parsed value or
 * an error: { value [, error] }
 *
 * @type {function}
 */

// export let parser = null;

/* ----------------------------------------------------------------- Reactive */

$: {
  if( editElement && content && !editElement.innerText)
  {
    editElement.innerText = content;
  }
}

// -----------------------------------------------------------------------------

$: {
  if( surfaceColor !== SURFACE_NONE && !onColor )
  {
    onColor = surfaceColor;
  }
}

// $: {
//   log.debug( { content } );
// }

</script>

<div c-text-edit
     class="g-bg-{surfaceColor} {cssClassNames}"
     class:x-focused={focused}>
  <div cc-box>
    <BodyText
      {onColor}>
      <!-- https://stackoverflow.com/questions/24215428/losing-focus-in-contenteditable-in-safari -->
      <div contenteditable="true"
         cc-content
         class:x-center={center}
         bind:this={editElement}
         on:focus={doFocus}
         on:blur={doBlur}
         on:keydown={tryPreventNewline}
         on:paste={pasteAsPlainText}
         role="textbox"
         tabindex="0">
          {#if !content && !focused}
            <div cc-placeholder>{placeholder}</div>
          {/if}
      </div>
    </BodyText>
  </div>
</div>

<style>
  [c-text-edit]
  {
    cursor: text;
  }

  [cc-content]
  {
    /* display: block;*/
    display: grid;
  }

  [cc-content]:active,
  [cc-content]:focus {
    border:none;
    outline:none;
  }

  .x-center { text-align: center; }

</style>