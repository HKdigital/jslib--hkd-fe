<script>

import { createEventDispatcher } from 'svelte';

const dispatch = createEventDispatcher();

import { expectNumber,
         expectDefined } from "@hkd-base/helpers/expect.js";

import { arrayToObject } from "@hkd-base/helpers/array.js";

import TertiaryButton
  from "@hkd-fe/components/buttons/TertiaryButton.svelte";

import BodyText
  from "@hkd-fe/components/text/BodyText.svelte";

import ListIcon from "@hkd-fe/components/icons/ListIcon.svelte";

import Circle
  from "@hkd-fe/components/icons/hero/outline/Circle.svelte";

import CheckCircle
  from "@hkd-fe/components/icons/hero/solid/CheckCircle.svelte";

import { generateLocalId } from "@hkd-base/helpers/unique.js";

// -- Logging

import { getModuleLogger }
  from "@hkd-base/helpers/log.js";

const log = getModuleLogger( "RadioGroup.svelte" );

/* ---------------------------------------------------------------- Internals */

/**
 * A "select" event will be dispatched is the value of the radio button has
 * been updated.
 */
const EVENT_SELECT = "select";

const VALUE_DISPLAYVALUE = [ "value", "displayValue" ];

// let error;

let name = generateLocalId();

let colorClasses = "";

let selectedIndex = -1;

let standardizedValues;

/**
 * Select a value (if not already selected)
 *
 * @param {number} index
 */
function handleUserSelect( index )
{
  expectNumber( index, "Missing or invalid parameter [index]" );

  let details;

  if( index === selectedIndex )
  {
    selectedIndex = -1;
    details = { index, value: null, displayValue: null };

    dispatch( EVENT_SELECT, details );
  }
  else {
    selectedIndex = index;
    details = { index, ...standardizedValues[ index ] };

    if( !("displayValue" in details) )
    {
      details.displayValue = details.value;
    }

    dispatch( EVENT_SELECT, details );
  }
}

// -----------------------------------------------------------------------------

let cssClassNames = "";

/* ------------------------------------------------------------------ Exports */

export { cssClassNames as class };

export let onColor = null;

export { EVENT_SELECT };

/**
 * Set values for the radio group
 *
 * @type {object[]}
 *
 *       list of objects
 *       [ { displayValue: <string>, value: <*> }, ... ]
 *
 *       list of arrays
 *       [ [ value, displayValue ], ... ]
 *
 */
export let values = null;

/**
 * Center the selected list item
 */
export let center = true;

// -----------------------------------------------------------------------------

/**
 * Function that can be used by parent component to select a specific value
 *
 * @param {string} value
 *   Value to select (selects the first option that has the specified value,
 *   use selectIndex if a specific index should be selected)
 */
export function selectValue( value )
{
  expectDefined( value, "Missing or invalid parameter [value]" );

  if( null === value )
  {
    //
    // null means no value selected
    //
    selectByIndex( -1 );
    return;
  }

  for( let j = 0, n = standardizedValues.length; j < n; j = j + 1 )
  {
    const current = standardizedValues[ j ];

    if( value === current.value )
    {
      if( selectedIndex !== j )
      {
        selectedIndex = j;
      }
      break;
    }
  } // end for

  // console.log( { value, selectedIndex } );
}

// -----------------------------------------------------------------------------

/**
 * Select a specific value by index.
 *
 * @param {number} [index=-1]
 *   The value `-1` implies that no value will be selected
 */
export function selectByIndex( index=-1 )
{
  expectNumber( index, "Missing or invalid parameter [index]" );

  if( selectedIndex !== index )
  {
    selectedIndex = index;
  }
}

// -----------------------------------------------------------------------------

/**
 * Reset the selected value
 * - No value will be selected after calling this function
 */
export function reset( e )
{
  // console.log("reset");

  selectByIndex( -1 );

  if( e )
  {
    e.stopPropagation();
    e.preventDefault();
  }
}

/* ----------------------------------------------------------------- Reactive */

$: {
  //
  // Set property `standardizedValues`
  //
  // - Convert values set as [ value, displayValue ]
  //   to objects { value, displayValue }
  //
  if( values )
  {
    standardizedValues = [];

    for( let value of values )
    {
      if( Array.isArray( value ) )
      {
        value = arrayToObject( value, VALUE_DISPLAYVALUE );
      }
      else if( !(value instanceof Object) )
      {
        value = { value };
      }

      standardizedValues.push( value );
    } // end for
  }
  else {
    standardizedValues = null;
  }
}

// -----------------------------------------------------------------------------

$: {
  //
  // Add color class `x-on-<surface color>`
  //
  if( onColor )
  {
    colorClasses = `x-on-${onColor}`;
  }
  else {
    colorClasses = "";
  }
}

</script>

<div c-radio-group
    class:x-center={center}
     class="{colorClasses}
            {cssClassNames}">

  {#if standardizedValues}

    {#each standardizedValues as { displayValue, value }, index }
      {#if selectedIndex < 0 || selectedIndex === index}
        <label
          class="g-no-select"
          class:x-selected={selectedIndex === index}>

          <input type=radio {name} {value}
            on:click={ () => { handleUserSelect( index ); } } />

          <ListIcon
            content={ selectedIndex === index ? CheckCircle : Circle }
            {onColor} />

          <!-- <div icon class="x-radio">
            <svelte:component
              this={selectedIndex === index ? CheckCircle : Circle } />
          </div> -->

          <BodyText {onColor}>
            {displayValue !== undefined ? displayValue : value}

           <!-- {#if selectedIndex === index}

              <TertiaryButton
                {onColor}
                on:click={ reset }>

                - wijzig

              </TertiaryButton>

            {/if} -->

          </BodyText>

        </label>
      {/if}
    {/each}

    <!-- <BodyText {onColor}>
      <TertiaryButton
        {onColor}
        on:click={ reset }>

        wijzig

      </TertiaryButton>
    </BodyText> -->

  {/if}

</div>

<style>
[c-radio-group]
{
  display: grid;
  grid-template-columns: auto;
  justify-content: start;
}

[c-radio-group].x-center
{
  justify-content: center;
}

label
{
  display: grid;
  /*  grid-template-columns: min-content auto;*/
  grid-template-columns: min-content min-content 1fr;

  justify-content: start;
  justify-items: start;

  align-items: center;
  cursor: pointer;

  max-width: max-content;
}

/*label.x-center {
  justify-content: center;
}*/

</style>
