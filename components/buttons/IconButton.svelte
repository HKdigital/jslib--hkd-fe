<script>

/* ------------------------------------------------------------------ Imports */

// import PrimaryButton from "@hkd-fe/components/buttons/PrimaryButton.svelte";
// import SecondaryButton from "@hkd-fe/components/buttons/SecondaryButton.svelte";

import ListIcon from "@hkd-fe/components/icons/ListIcon.svelte";

import TabIcon from "@hkd-fe/components/icons/TabIcon.svelte";

import PlusSmall
  from "@hkd-fe/components/icons/hero/solid/PlusSmall.svelte";

import { redirectToRoute } from "@hkd-fe/stores/router.js";

import { SURFACE_LIGHT_GREY } from "@theme-jetnet/all-constants.js";

import Button from "@hkd-fe/components/buttons/Button.svelte";

/* ---------------------------------------------------------------- Internals */

let colorClasses = "";

/* ------------------------------------------------------------------ Exports */

let cssClassNames = "";
export { cssClassNames as class };

export let icon = PlusSmall;
export let miniIcon = true;

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
    colorClasses = "";
  }
}

</script>

<Button
  c-icon-button
  {...$$restProps}
  class="{cssClassNames}"
  {onColor}
  {center}
  {route}
  {routeOptions}
  on:click>
  <div class="grid">

    <ListIcon
      content={icon}
      onColor={SURFACE_LIGHT_GREY} />

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