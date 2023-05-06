<script>

/**
 * This component will output values via an `update` event
 *
 * Object event.detail will contain { updatedValue }
 */

/* ------------------------------------------------------------------ Imports */

import { createEventDispatcher } from 'svelte';

const dispatch = createEventDispatcher();

/* ---------------------------------------------------------------- Internals */

let cssClassNames = "";

let colorClasses = "";

let hideLabel = false;
let hidePlaceholder = true;

let showErrorMessage = false;

let placeholderText = null;

// let pristine = true;

let focused = false;

let initialValueCopied = false;

let previousValue = "";

let value = "";

let finalValue = "";

let errorMessage = "";

// -----------------------------------------------------------------------------

/**
 * Enter `focused` mode
 */
function setFocus()
{
  focused = true;
}

// -----------------------------------------------------------------------------

/**
 * Enter `not focused` mode
 * - Copy finalValue to value (if it exists), e.g. a trimmed value
 */
function blur()
{
  // console.log("blur");

  focused = false;

  if( finalValue && finalValue !== value )
  {
    value = finalValue;
  }
}

/* ------------------------------------------------------------------ Exports */

/**
 * CSS classes to add to the element
 */
export { cssClassNames as class };

/**
 * Color of the surface where the element is placed on
 * - Will set a CSS class `x-on-{onColor}` on the element
 *
 * @type {string}
 */
export let onColor = null;

/**
 * Label of the input element
 *
 * @type {string}
 */
export let label = "";

/**
 * Placeholder text
 *
 * @type {string}
 */
export let placeholder = "";
// export let errorMessage = "";

/**
 * Initial value to use as value
 *
 * @type {string}
 */
export let initialValue = "";

/**
 * Parser function that receives the value of the input element
 * and should return an object that contains the parsed value or
 * an error: { value [, error] }
 *
 * @type {function}
 */
// eslint-disable-next-line no-unused-vars
export let parser = null;

/**
 * Set to true if a value is optional
 * @type {Boolean}
 */
export let optional = false;

// -----------------------------------------------------------------------------

/**
 * Set value
 *
 * @param {*} updatedValue
 */

function setValue( updatedValue )
{
  value = updatedValue;
}

export { setValue };

/* ----------------------------------------------------------------- Reactive */

$: {
  //
  // If onColor has been set
  // - add color class `x-on-<surface color>`
  //
  if( onColor )
  {
    colorClasses = `x-on-${onColor}`;
  }
  else {
    colorClasses = "";
  }
}

// -----------------------------------------------------------------------------

$: {
  //if( label && (placeholder.length || value.length) )
  if( label && (focused || value.length) )
  {
    // Use label as placeholder
    hideLabel = false;
  }
  else {
    hideLabel = true;
  }
}

// -----------------------------------------------------------------------------

$: {
  //
  // Set placeholderText
  // - equal to placeholder if set
  // - equal to label if set
  // - empty otherwise
  //
  if( placeholder.length )
  {
    placeholderText = placeholder;
  }
  else if( label )
  {
    placeholderText = label;

  }
  else {
    placeholderText = "";
  }
}

// -----------------------------------------------------------------------------

$: {
  //
  // Hide placeholder if
  // - some value has been entered
  // - no placeholder text has been set
  //
  hidePlaceholder = value.length > 0 || !placeholderText.length;
}

// -----------------------------------------------------------------------------

$: {
  //
  // Copy initialValue to value if
  // - initialValue has been set
  // - initialValue has not been copied to value yet
  //
  if( initialValue &&
      !initialValueCopied  )
  {
    if( initialValue !== value )
    {
      value = initialValue;
    }

    initialValueCopied = true;
  }
}

// -----------------------------------------------------------------------------

$: {
  //
  // If value changes:
  // - Parse value
  // - Update previousValue (to detect changes)
  //
  if( previousValue !== value )
  {
    const output = parser ? parser( value ) : { value };

    // console.log( "InputField", output );

    if( output.error )
    {
      if( typeof output.error === "string" )
      {
        errorMessage = output.error;
      }
      else if( output.error instanceof Error )
      {
        errorMessage = output.error.message;
      }
      else {
        throw new Error(
          `Parser returned invalid property [error] ` +
          `(expected string or Error)`);
      }

      showErrorMessage = true;
    }
    else {
      showErrorMessage = false;
    }

    if( output.value && output.value !== value )
    {
      if( typeof output.value === "string" )
      {
        value = output.value;
      }
      else {
        throw new Error(
          `Parser returned invalid property [value] ` +
          `(expected string)`);
      }
    }

    previousValue = value;

    if( "finalValue" in output )
    {
      finalValue = output.finalValue;
    }
    else {
      finalValue = value;
    }

    dispatch( "update", { updatedValue: finalValue } );
  }
}

// -----------------------------------------------------------------------------

// {...$$restProps}
// https://medium.com/codex/how-to-style-an-input-field-with-css-only-tips-and-techniques-e6a00e9dcc50
//

let inputType = "text";

export { inputType as type };

</script>

<!-- {focused} -->

<!-- {hideLabel} -->
<label c-input-field
       class="{colorClasses}
              {cssClassNames}"
       class:x-error={showErrorMessage}
       class:x-focused={focused}
       class:x-optional={optional && !finalValue}
       on:click
       on:keydown={(e)=> { if( e.code === "Enter" ) { dispatch("enter"); } }}>

  <div class="cc-label"
       class:x-hidden={hideLabel}>{label}</div>

   <div cc-input-bg></div>

   {#if inputType == "number"}
    <input class="cc-input" type="number" bind:value
           on:focus={setFocus}
           on:blur={blur}>
  {:else if inputType === "phone"}
    <input class="cc-input" type="tel" bind:value
           on:focus={setFocus}
           on:blur={blur}>
  {:else if inputType === "email"}
    <input class="cc-input" type="email" bind:value
           on:focus={setFocus}
           on:blur={blur}>
  {:else}
    <input class="cc-input" type="text" bind:value
           on:focus={setFocus}
           on:blur={blur}>
  {/if}

  <span class="cc-placeholder"
        class:x-hidden={hidePlaceholder||focused}>{placeholderText}</span>

  <!-- <span class="cc-error"
        class:x-display-none={focused || !showErrorMessage}
        aria-live="polite">{errorMessage}</span> -->

  <!-- <span class="cc-error"
        class:x-hidden={!showErrorMessage}
        aria-live="polite">{errorMessage||"&nbsp;"}</span> -->
</label>

<style lang="scss">

  :global( [c-input-field] )
  {
    display: grid;
    /*background-color: blue;*/
  }

  .cc-label
  {
    z-index: 1;

    grid-row: 1;
    opacity: 1;
    transition: opacity 0.5s;
  }

  /*.cc-label.visible {
    opacity: 1;
    transition: opacity 0.5s;
  }*/

  [cc-input-bg]
  {
    z-index: 1;

    grid-row: 2;
    grid-column: 1;

    background-color: transparent;
  }

  .cc-placeholder
  {
    z-index: 2;

    grid-row: 2;
    grid-column: 1;

    justify-self: center;

    transition: opacity 0.5s;
  }

  .cc-placeholder.x-focused
  {
    opacity: 0.5;
  }

  .cc-input
  {
    z-index: 3;

    grid-row: 2;
    grid-column: 1;

    font-family: inherit;
    font-weight: inherit;
    font-size: inherit;
    line-height: inherit;
    letter-spacing: inherit;
    outline: none;

    color: inherit;

    border-width: thin;
    border-style: solid;
    border-color: aqua;

    background-color: transparent;
  }

  .cc-error
  {
    z-index: 1;

    grid-row: 3;
    grid-column: 1;

    text-align: center;

    transition: opacity 0.5s;
  }

  .x-hidden
  {
    opacity: 0;
  }

  .x-display-none
  {
    display: none;
  }

  /*.placeholder {
    position: absolute;
    left: 12px;
    bottom: 50%;
    top: 22px;

    height: 100%;

    transform: translateY(-50%);

    left: var(--field-padding);
    width: calc(100% - (var(--field-padding) * 2));

    color: #aaa;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;

     transition:
      top 0.3s ease,
      color 0.3s ease,
      font-size 0.3s ease;
  }

  input:focus + .placeholder {
    top: -10px;
    font-size: 10px;
    color: #222;
  }

  .error-message {
    width: 100%;
    display: flex;
    align-items: center;
    padding: 0 8px;
    font-size: 12px;
    background: #d30909;
    color: #fff;
    height: 24px;
  }

  .error-message:empty {
    opacity: 0;
  }*/

</style>