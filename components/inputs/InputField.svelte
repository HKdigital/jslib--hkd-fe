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

let colorClasses = '';

let hideLabel = false;
let hidePlaceholder = true;

let showErrorMessage = false;

let placeholderText = null;

// let pristine = true;

let focused = false;

let initialValueCopied = false;

let previousValue = '';

let value = '';

let finalValue = '';

let errorMessage = '';

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
 * CSS class names to add to the element
 */
let cssClassNames = '';
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
export let label = '';

/**
 * Placeholder text
 *
 * @type {string}
 */
export let placeholder = '';
// export let errorMessage = "";

/**
 * Initial value to use as value
 *
 * @type {string}
 */
export let initialValue = '';

/**
 * Parser function that receives the value of the input element
 * and should return an object that contains the parsed value or
 * an error: { value [, error] }
 *
 * @type {function}
 */

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
    colorClasses = '';
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
    placeholderText = '';
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
      if( typeof output.error === 'string' )
      {
        errorMessage = output.error;
      }
      else if( output.error instanceof Error )
      {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        errorMessage = output.error.message;
      }
      else {
        throw new Error(
          'Parser returned invalid property [error] ' +
          '(expected string or Error)');
      }

      showErrorMessage = true;
    }
    else {
      showErrorMessage = false;
    }

    if( output.value && output.value !== value )
    {
      if( typeof output.value === 'string' )
      {
        value = output.value;
      }
      else {
        throw new Error(
          'Parser returned invalid property [value] ' +
          '(expected string)');
      }
    }

    previousValue = value;

    if( 'finalValue' in output )
    {
      finalValue = output.finalValue;
    }
    else {
      finalValue = value;
    }

    dispatch( 'update', { updatedValue: finalValue } );
  }
}

// -----------------------------------------------------------------------------

// {...$$restProps}
// https://medium.com/codex/how-to-style-an-input-field-with-css-only-tips-and-techniques-e6a00e9dcc50
//

let inputType = 'text';

export { inputType as type };

</script>

<!-- {focused} -->

<!-- {hideLabel} -->

<!-- eslint-disable-next-line svelte/valid-compile -->
<label c-input-field
       class="{colorClasses}
              {cssClassNames}"
       class:x-error={showErrorMessage}
       class:x-focused={focused}
       class:x-optional={optional && !finalValue}
       on:click
       on:keydown={(e)=> { if( e.code === 'Enter' ) { dispatch('enter'); } }}>

  {#if label}
    <div cc-label
         class:x-hidden={hideLabel}>{label}</div>
  {/if}

   <div cc-input-bg></div>

   {#if inputType == 'number'}
    <input cc-input type="number" bind:value
           on:focus={setFocus}
           on:blur={blur}>
  {:else if inputType === 'phone'}
    <input cc-input type="tel" bind:value
           on:focus={setFocus}
           on:blur={blur}>
  {:else if inputType === 'email'}
    <input cc-input type="email" bind:value
           on:focus={setFocus}
           on:blur={blur}>
  {:else}
    <input cc-input type="text" bind:value
           on:focus={setFocus}
           on:blur={blur}>
  {/if}

  <span cc-placeholder
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
  }


  [cc-input-bg]
  {
    z-index: 1;

    grid-row: 1;
    grid-column: 1;

    background-color: transparent;
  }

  [cc-placeholder]
  {
    z-index: 2;

    grid-row: 1;
    grid-column: 1;

    // justify-self: center;
    justify-self: start;

    transition: opacity 0.4s;
  }

  [cc-input]
  {
    z-index: 3;

    grid-row: 1;
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


  [cc-label]
  {
    z-index: 4;

    grid-row: 1;
    grid-column: 1;

    // justify-self: start;

    justify-self: end;
    margin-right: 16px;

    align-self: top;

    height: fit-content;
    transform:translateY(-50%);

    opacity: 1;
    transition-delay: 0.4s;
    transition: opacity 0s;
  }

  // [cc-error]
  // {
  //   z-index: 1;

  //   grid-row: 3;
  //   grid-column: 1;

  //   text-align: center;

  //   transition: opacity 0.5s;
  // }

  .x-hidden
  {
    opacity: 0;
  }

  .x-display-none
  {
    display: none;
  }

</style>