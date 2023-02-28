<script>

/* ------------------------------------------------------------------ Imports */

import { createEventDispatcher } from 'svelte';

const dispatch = createEventDispatcher();

import BodyText
  from "@hkd-fe/components/text/BodyText.svelte";

// -- Constants

import { SURFACE_LIGHT_GREY }
  from "@theme-jetnet/all-constants.js";

// -- Logging

import { getModuleLogger } from "@hkd-base/helpers/log.js";

const log = getModuleLogger( "BodyTextEdit.svelte" );

/* ------------------------------------------------------------------ Exports */

let cssClassNames = "";
export { cssClassNames as class };

export let surfaceColor = SURFACE_LIGHT_GREY;

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
// eslint-disable-next-line no-unused-vars
export let parser = null;

/* ---------------------------------------------------------------- Internals */


let focused;

let editElement;

function doFocus( e )
{
  console.log("doFocus: " + placeholder);
  focused = true;
  e.preventDefault();
}

// -----------------------------------------------------------------------------

function doBlur()
{
  console.log("doBlur: " + placeholder);

  focused = false;

  //
  // Get innerText and replace tabs by double space
  //
  let tmp = editElement.innerText.replaceAll("\\t", "  ");

  //
  // Remove newlines if not allowed
  //
  content =
    allowNewLine ? tmp : tmp.replaceAll("[\\n\\r]+","");

  //
  // TESTING:
  // component crashes when the event fires and an error occurs?
  //
  // -> remove setTimeout!
  //

  setTimeout( ()=> {
    dispatch( "update", { updatedValue: content } );
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

  let text = e.clipboardData.getData("text/plain");

  if( !allowNewLine )
  {
    text = text.replace(/[\n\r]/g, '');
  }

  document.execCommand("insertHTML", false, text);
}

/* ----------------------------------------------------------------- Reactive */

$: {
  if( editElement && content && !editElement.innerText)
  {
    editElement.innerText = content;
  }
}

$: {
  log.debug( { content } );
}

</script>

<div c-body-text-edit
     class="g-bg-{surfaceColor} g-padding-tiny {cssClassNames}"
     class:x-focused={focused}>
  <BodyText onColor={surfaceColor} class={cssClassNames}>
    <!-- https://stackoverflow.com/questions/24215428/losing-focus-in-contenteditable-in-safari -->
    <div contenteditable="true"
         class="cc-content"
         bind:this={editElement}
         on:focus={doFocus}
         on:blur={doBlur}
         on:keydown={tryPreventNewline}
         on:paste={pasteAsPlainText}>
      {#if !content && !focused}
        <div class="cc-placeholder">{placeholder}</div>
      {/if}
    </div>
  </BodyText>
</div>

<style>
  [c-body-text-edit]
  {
    cursor: text;
  }

  .cc-content
  {
    /* display: block;*/
    display: grid;
  }

  [contenteditable="true"]:active,
  [contenteditable="true"]:focus {
    border:none;
    outline:none;
  }


</style>