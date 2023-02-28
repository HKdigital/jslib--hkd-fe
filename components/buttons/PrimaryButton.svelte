<script>

/* ------------------------------------------------------------------ Imports */

import Button from "@hkd-fe/components/buttons/Button.svelte";

/* ---------------------------------------------------------------- Internals */

let cssClassNames = "";

/* ------------------------------------------------------------------ Exports */

export { cssClassNames as class };

export let onColor = null;

export let disabled = false;

export let centerInner = true;

/* ----------------------------------------------------------------- Reactive */

</script>

<Button
  c-primary-button
  {...$$restProps}
  class={cssClassNames}
  {centerInner}
  {onColor}
  on:click
  {disabled}>
  <slot></slot>
</Button>
