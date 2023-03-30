<script>
/**
 * This component will output values via an `update` event
 *
 * Object event.detail will contain { updatedValue }
 *
 * Example usage
 * -------------
 *
 *   let check;
 *
 *   function checkboxValueUpdated( data )
 *   {
 *     log.debug("checkboxValueUpdated", data);
 *   }
 *
 *   --
 *
 *   <Checkbox {onColor}
 *     bind:check
 *     initialValue={false}
 *     on:update={checkboxValueUpdated}>Check me!</Checkbox>
 */

/* ------------------------------------------------------------------ Imports */

import { createEventDispatcher } from 'svelte';

const dispatch = createEventDispatcher();

import BodyText
  from "@hkd-fe/components/text/BodyText.svelte";

import ListIcon from "@hkd-fe/components/icons/ListIcon.svelte";

import Box
  from "@hkd-fe/components/icons/hero/outline/Box.svelte";

import Checkbox
  from "@hkd-fe/components/icons/hero/outline/Checkbox.svelte";

import Check
  from "@hkd-fe/components/icons/hero/outline/Check.svelte";

// import Empty
//   from "@hkd-fe/components/icons/hero/solid/Empty.svelte";

// import { generateLocalId } from "@hkd-base/helpers/unique.js";

// -- Logging

import { getModuleLogger }
  from "@hkd-base/helpers/log.js";

const log = getModuleLogger( "Checkbox.svelte" );

/* ---------------------------------------------------------------- Internals */

// let name = generateLocalId();

let cssClassNames = "";

let colorClasses = "";

let initialValueCopied = false;

let previousValue = false;

let value = false;

// -----------------------------------------------------------------------------

/**
 * Toggle the checkbox value
 */
function toggle()
{
  if( !allowEdit )
  {
    return;
  }

  value = !value;
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

export let center=false;

/**
 * Label of the checkbox
 *
 * @type {string}
 */
// export let label = "";

/**
 * Initial value to use as value
 *
 * @type {string}
 */
export let initialValue = false;

export let allowEdit = true;

// -----------------------------------------------------------------------------

/**
 * Check or uncheck the checkbox
 *
 * @param {*} updatedValue
 */
function check( checked=true )
{
  if( !allowEdit )
  {
    return;
  }

  if( value !== checked )
  {
    value = !!checked;
  }
}

export { check };


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
  //
  // Copy initialValue to value if
  // - initialValue has been set
  // - initialValue has not been copied to value yet
  //
  if( initialValue !== undefined &&
      !initialValueCopied )
  {
    if( initialValue !== value )
    {
      value = initialValue;
    }

    initialValueCopied = true;

    // log.debug( "initialValueCopied" );
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
    previousValue = value;

    dispatch( "update", { checked: value } );
  }
}

// -----------------------------------------------------------------------------

let iconContent;

$: {
  if( value )
  {
    if( allowEdit )
    {
      iconContent = Checkbox;
    }
    else {
      iconContent = Check;
    }
  }
  else {
    if( allowEdit )
    {
      iconContent = Box;
    }
    else {
      iconContent = null; // => checkbox and label hidden
    }
  }
}

</script>

{#if iconContent}
  <div c-checkbox
       on:click={toggle}
       class="g-no-select"
       class:x-center={center}
       class:x-pointer={allowEdit}>

      <ListIcon
        content={iconContent}
        {onColor} />

      <BodyText {onColor}>
        <slot></slot>
      </BodyText>

  </div>
{/if}

<style>

[c-checkbox] {}

div
{
  display: grid;
  grid-template-columns: min-content auto;

  justify-content: start;
  justify-items: start;

  align-items: center;
}

.x-pointer {
  cursor: pointer;
}

.x-center {
  justify-content: center;
}
</style>
