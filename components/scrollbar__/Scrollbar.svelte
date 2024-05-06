<script>

/* ------------------------------------------------------------------ Imports */

import Track from './Track.svelte';

import { expectValidSurfaceColor } from '@hkd-fe/helpers/colors.js';

export let onColor;

$: expectValidSurfaceColor( onColor );

/* ------------------------------------------------------------------ Exports */

export let observerTarget;
export let scrollArea;
export let buttonPressingMove = 5;
export let showArrows = false;

</script>

<Track
  {onColor}
  wrapperElem="{scrollArea}"
  observerTarget="{observerTarget}"
  buttonPressingMove="{buttonPressingMove}"
  showArrows="{showArrows}"
/>
