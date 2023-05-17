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
  c-tertiary-button
  {...$$restProps}
  inline={true}
  class="{cssClassNames}"
  {centerInner}
  {onColor}
  on:click
  {disabled}>
  <span><slot></slot></span>
</Button>
