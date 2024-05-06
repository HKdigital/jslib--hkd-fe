<script>

/* ------------------------------------------------------------------ Imports */

import ListIcon from '@hkd-fe/components/icons/ListIcon.svelte';

import PlusSmall
  from '@hkd-fe/components/icons/hero/solid/PlusSmall.svelte';

import Button
  from '@hkd-fe/components/buttons/Button.svelte';

// // -- Constants

// import { SURFACE_1 }
//   from "@hkd-fe/constants/surfaces.js";

/* ---------------------------------------------------------------- Internals */

let colorClasses = '';

/* ------------------------------------------------------------------ Exports */

let cssClassNames = '';
export { cssClassNames as class };

export let icon = PlusSmall;
// export let miniIcon = true;

export let onColor = null;

// export let active = false;

export let center = false;

/** Use the router functionality to find the href for an internal link */
export let route = null;
export let routeOptions = { replaceCurrent: false };

/* ----------------------------------------------------------------- Reactive */

$: {
  //
  // Add color class `x-on-<surface color>`
  //
  if( onColor )
  {
    colorClasses = `x-on-${onColor}`;
  }
  else {
    colorClasses = '';
  }
}

</script>

<Button
  c-icon-button
  {...$$restProps}
  class="{colorClasses} {cssClassNames}"
  {onColor}
  {center}
  {route}
  {routeOptions}
  on:click>
  <div class="grid">

    <ListIcon
      content={icon} />

    <div class="label"><slot></slot></div>
  </div>
</Button>

<style>
  .grid
  {
    display: grid;

    grid-template-columns: min-content auto;

    align-items: center;

    cursor: pointer;
  }

</style>